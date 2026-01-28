const Bid = require("../models/Bid");
const Request = require("../models/Request");
const Receipt = require("../models/Receipt");

// ------------------------------------
// Seller rating aggregation (FIXED)
// Uses rating.value (same schema as MainDashboard)
// ------------------------------------
const RATING_AGG_MAX_MS = 8000;

async function buildSellerRatingMap(sellerIds) {
  if (!sellerIds || sellerIds.length === 0) return {};

  try {
    const agg = await Receipt.aggregate([
      {
        $match: {
          sellerId: { $in: sellerIds.map((id) => id) },
          "rating.value": { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$sellerId",
          avgRating: { $avg: "$rating.value" },
          ratingCount: { $sum: 1 },
        },
      },
    ]).option({ allowDiskUse: true, maxTimeMS: RATING_AGG_MAX_MS });

    return agg.reduce((acc, row) => {
      acc[String(row._id)] = {
        sellerRating: Number(row.avgRating || 0),
        sellerRatingCount: Number(row.ratingCount || 0),
      };
      return acc;
    }, {});
  } catch (err) {
    console.warn("buildSellerRatingMap fallback (aggregation skipped):", err?.message || err);
    return {};
  }
}

function attachRatingToBidObject(bidObj, ratingMap) {
  const seller = bidObj?.sellerId;
  const sellerId = seller?._id ? String(seller._id) : seller ? String(seller) : null;

  const r =
    sellerId && ratingMap[sellerId]
      ? ratingMap[sellerId]
      : { sellerRating: 0, sellerRatingCount: 0 };

  return {
    ...bidObj,
    sellerRating: r.sellerRating,
    sellerRatingCount: r.sellerRatingCount,
  };
}

// ------------------------------------
// CREATE BID (seller submits or updates)
// ------------------------------------
exports.createBid = async (req, res) => {
  try {
    const { requestId } = req.params;
    const sellerId = req.user.id;

    const { unitPrice, totalPrice, deliveryTime, images } = req.body;

    if (unitPrice === undefined || totalPrice === undefined) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const u = Number(unitPrice);
    const t = Number(totalPrice);

    if (!Number.isFinite(u) || !Number.isFinite(t) || u <= 0 || t <= 0) {
      return res.status(400).json({ message: "Invalid prices" });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const deliveryClean =
      typeof deliveryTime === "string" && deliveryTime.trim()
        ? deliveryTime.trim()
        : "TBD";

    const imagesClean = Array.isArray(images) ? images : [];

    const existing = await Bid.findOne({ requestId, sellerId });

    if (existing) {
      if (existing.accepted || existing.status === "pending_payment") {
        return res.status(400).json({
          message: "This bid is already accepted and cannot be modified.",
        });
      }

      existing.unitPrice = u;
      existing.totalPrice = t;

      if (typeof deliveryTime === "string") {
        existing.deliveryTime = deliveryClean;
      } else if (!existing.deliveryTime) {
        existing.deliveryTime = "TBD";
      }

      if (Array.isArray(images)) {
        existing.images = imagesClean;
      }

      existing.status = "pending";
      existing.accepted = false;
      existing.acceptedAt = null;
      existing.paymentDueAt = null;

      await existing.save();
      return res.status(200).json(existing);
    }

    const bid = new Bid({
      requestId,
      sellerId,
      unitPrice: u,
      totalPrice: t,
      deliveryTime: deliveryClean,
      images: imagesClean,
      status: "pending",
      accepted: false,
    });

    await bid.save();
    res.status(201).json(bid);
  } catch (err) {
    console.error("createBid error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------------
// GET bids by request (buyer view)
// ------------------------------------
exports.getBidsByRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const bids = await Bid.find({ requestId })
      .populate("sellerId", "email fullName")
      .sort({ createdAt: 1 });

    const sellerIds = [
      ...new Set(
        bids
          .map((b) => (b?.sellerId?._id ? String(b.sellerId._id) : null))
          .filter(Boolean)
      ),
    ];

    const ratingMap = await buildSellerRatingMap(sellerIds);

    const enriched = bids.map((b) =>
      attachRatingToBidObject(b.toObject(), ratingMap)
    );

    res.json(enriched);
  } catch (err) {
    console.error("getBidsByRequest error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------------
// GET single bid by id
// ------------------------------------
exports.getBidById = async (req, res) => {
  try {
    const { bidId } = req.params;

    const bid = await Bid.findById(bidId).populate("sellerId", "email fullName");
    if (!bid) return res.status(404).json({ message: "Bid not found" });

    res.json(bid);
  } catch (err) {
    console.error("getBidById error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------------
// ACCEPT bid (buyer)
// ------------------------------------
exports.acceptBid = async (req, res) => {
  try {
    const { bidId } = req.params;

    const bid = await Bid.findById(bidId);
    if (!bid) return res.status(404).json({ message: "Bid not found" });

    bid.accepted = true;
    bid.acceptedAt = new Date();
    bid.status = "pending_payment";

    await bid.save();

    res.json({ message: "Bid accepted", bid });
  } catch (err) {
    console.error("acceptBid error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
