const mongoose = require("mongoose");
const Bid = require("../models/Bid");
const User = require("../models/User");
const Request = require("../models/Request");
const Receipt = require("../models/Receipt");

// helper: rolling 30 days window
const DAYS_30_MS = 30 * 24 * 60 * 60 * 1000;
const PAYMENT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h to pay

// ----------------------------- RATING HELPERS -----------------------------
async function buildSellerRatingMap(sellerIds) {
  if (!Array.isArray(sellerIds) || sellerIds.length === 0) return {};

  const objIds = sellerIds
    .map((id) => {
      try {
        return new mongoose.Types.ObjectId(String(id));
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  if (objIds.length === 0) return {};

  // avg + count from receipts that have rating.value
  const agg = await Receipt.aggregate([
    {
      $match: {
        sellerId: { $in: objIds },
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
  ]);

  return agg.reduce((acc, row) => {
    acc[String(row._id)] = {
      sellerRating: Number(row.avgRating || 0),
      sellerRatingCount: Number(row.ratingCount || 0),
    };
    return acc;
  }, {});
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
// CREATE BID (seller) ✅ eBay-style: update same bid
// ------------------------------------
exports.createBid = async (req, res) => {
  try {
    const { requestId } = req.params;
    const sellerId = req.user.id;

    const { unitPrice, totalPrice } = req.body;

    // ✅ Price-only is allowed (negotiation in chat)
    if (!unitPrice || !totalPrice) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const existing = await Bid.findOne({ requestId, sellerId });

    // ✅ If a bid already exists for this seller+request, overwrite prices (eBay style)
    if (existing) {
      // Safety: don’t allow changing an accepted/payment-stage bid
      if (existing.accepted || existing.status === "pending_payment") {
        return res.status(400).json({
          message: "This bid is already accepted and cannot be modified.",
        });
      }

      existing.unitPrice = unitPrice;
      existing.totalPrice = totalPrice;

      // keep the rest exactly as-is (terms negotiated in chat)
      // existing.deliveryTime stays unchanged
      // existing.images stays unchanged

      existing.status = "pending";
      existing.accepted = false;
      existing.acceptedAt = null;
      existing.paymentDueAt = null;

      await existing.save();
      return res.status(200).json(existing);
    }

    // ✅ First-time bid: auto-set deliveryTime and no photos
    const bid = new Bid({
      requestId,
      sellerId,
      unitPrice,
      totalPrice,
      deliveryTime: "Negotiated in chat",
      images: [],
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
// GET bids by request ✅ rating from receipts + sort stable
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

    const shaped = bids.map((b) => attachRatingToBidObject(b.toObject(), ratingMap));
    res.json(shaped);
  } catch (err) {
    console.error("getBidsByRequest error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------------
// ✅ GET single bid (buyer) — REQUIRED by bidRoutes.js
// ------------------------------------
exports.getBidById = async (req, res) => {
  try {
    const { bidId } = req.params;

    const bid = await Bid.findById(bidId).populate("sellerId", "email fullName");
    if (!bid) return res.status(404).json({ message: "Bid not found" });

    const sellerId = bid?.sellerId?._id ? String(bid.sellerId._id) : null;
    const ratingMap = sellerId ? await buildSellerRatingMap([sellerId]) : {};

    const shaped = attachRatingToBidObject(bid.toObject(), ratingMap);
    res.json(shaped);
  } catch (err) {
    console.error("getBidById error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------------
// ACCEPT BID (buyer)
// ------------------------------------
exports.acceptBid = async (req, res) => {
  try {
    const { bidId } = req.params;

    // ✅ MINIMAL SAFE: support auth middleware that sets id OR _id (no logic change)
    const buyerId = req.user?.id || req.user?._id;

    const bid = await Bid.findById(bidId);
    if (!bid) return res.status(404).json({ message: "Bid not found" });

    const request = await Request.findById(bid.requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    // ✅ MINIMAL FIX: support both clientID and clientId
    const requestBuyerId = request.clientID || request.clientId;

    // ✅ DEBUG ONLY (safe)
    console.log("ACCEPT DEBUG:", {
      buyerId: buyerId ? String(buyerId) : null,
      requestBuyerId: requestBuyerId ? String(requestBuyerId) : null,
      request_clientID: request.clientID ? String(request.clientID) : null,
      request_clientId: request.clientId ? String(request.clientId) : null,
      bidId: String(bid._id),
      requestId: String(request._id),
    });

    if (String(requestBuyerId) !== String(buyerId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const buyer = await User.findById(buyerId);
    if (!buyer) return res.status(404).json({ message: "User not found" });

    const now = new Date();

    if (buyer.buyerSuspendedUntil && buyer.buyerSuspendedUntil > now) {
      return res.status(403).json({
        message: "Account temporarily restricted",
        suspendedUntil: buyer.buyerSuspendedUntil,
      });
    }

    const alreadyAccepted = await Bid.findOne({
      requestId: bid.requestId,
      accepted: true,
    });

    if (alreadyAccepted) {
      return res.status(400).json({ message: "A bid is already accepted" });
    }

    bid.accepted = true;
    bid.acceptedAt = now;
    bid.status = "pending_payment";
    bid.paymentDueAt = new Date(now.getTime() + PAYMENT_WINDOW_MS);

    await bid.save();

    res.json({
      message: "Bid accepted. Proceed to payment.",
      paymentDueAt: bid.paymentDueAt,
    });
  } catch (err) {
    console.error("acceptBid error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------------
// INTERNAL: register abandoned payment
// ------------------------------------
exports.registerAbandonedPayment = async (bid) => {
  try {
    if (!bid || bid.status !== "pending_payment") return;

    const now = new Date();
    if (!bid.paymentDueAt || bid.paymentDueAt > now) return;

    bid.status = "cancelled_nonpayment";
    bid.accepted = false;
    await bid.save();

    const request = await Request.findById(bid.requestId);
    if (!request) return;

    // ✅ MINIMAL FIX: support both clientID and clientId
    const requestBuyerId = request.clientID || request.clientId;

    const buyer = await User.findById(requestBuyerId);
    if (!buyer) return;

    const windowStart = new Date(now.getTime() - DAYS_30_MS);

    buyer.buyerStrikes = Array.isArray(buyer.buyerStrikes)
      ? buyer.buyerStrikes.filter((s) => s.at >= windowStart)
      : [];

    buyer.buyerStrikes.push({
      at: now,
      reason: "nonpayment",
      bidId: bid._id,
    });

    if (buyer.buyerStrikes.length >= 3) {
      buyer.buyerSuspendedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    await buyer.save();
  } catch (err) {
    console.error("registerAbandonedPayment error:", err);
  }
};
