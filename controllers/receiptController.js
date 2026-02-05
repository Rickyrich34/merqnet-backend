const mongoose = require("mongoose");
const Receipt = require("../models/Receipt");

// IMPORTANT: support multiple auth middleware patterns
const getAuthUserId = (req) =>
  String(req.user?._id || req.user?.id || req.userId || "");

/* ================= POPULATE ================= */

const populateReceiptQuery = (query) =>
  query
    .populate("buyerId", "fullName email")
    .populate("sellerId", "fullName email")
    .populate(
      "requestId",
      "productName category quantity condition sizeWeight description clientID createdAt"
    )
    .populate(
      "bidId",
      "unitPrice totalPrice deliveryTime accepted acceptedAt sellerId requestId createdAt"
    );

/* ================= HELPERS ================= */

function isParty(receipt, userId) {
  if (!receipt || !userId) return false;

  const uid = String(userId);

  const buyerId = receipt.buyerId?._id
    ? String(receipt.buyerId._id)
    : String(receipt.buyerId);

  const sellerId = receipt.sellerId?._id
    ? String(receipt.sellerId._id)
    : String(receipt.sellerId);

  return buyerId === uid || sellerId === uid;
}

// Find by Mongo _id OR receiptId like "REC-831060"
async function findReceiptByParamId(id) {
  let receipt = null;

  if (mongoose.Types.ObjectId.isValid(id)) {
    receipt = await Receipt.findById(id);
  }

  if (!receipt) {
    receipt = await Receipt.findOne({ receiptId: id });
  }

  return receipt;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function parseLimit(req) {
  if (String(req.query.latest) === "true") return 1;

  const lim = Number(req.query.limit);

  if (!Number.isFinite(lim)) return null;

  return Math.max(1, Math.min(100, lim));
}

function parsePage(req) {
  const p = Number(req.query.page);

  if (!Number.isFinite(p)) return 1;

  return Math.max(1, p);
}

/* ================================================= */
/* ================= CREATE RECEIPT ================= */
/* ================================================= */

// POST /api/receipts/create
// Called after successful payment
exports.createReceipt = async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const body = req.body || {};

    // We do NOT invent fields — just accept what frontend sends
    const receipt = new Receipt({
      ...body,
      buyerId: userId,
      status: body.status || "paid",
      createdAt: new Date(),
    });

    await receipt.save();

    const populated = await populateReceiptQuery(
      Receipt.findById(receipt._id)
    );

    return res.status(201).json(populated);
  } catch (err) {
    console.error("createReceipt error:", err);

    return res.status(500).json({
      message: "Server error creating receipt",
    });
  }
};

/* ================================================= */
/* ================= GET BUYER ================= */
/* ================================================= */

exports.getBuyerReceipts = async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    if (!userId)
      return res.status(401).json({ message: "Unauthorized" });

    const onlyUnviewed = String(req.query.unviewed) === "true";

    const limit = parseLimit(req);

    const page = parsePage(req);

    const skip = limit ? (page - 1) * limit : 0;

    const filter = { buyerId: userId };

    if (onlyUnviewed) filter.viewedByBuyer = false;

    let q = Receipt.find(filter).sort({ createdAt: -1 });

    if (limit) q = q.skip(skip).limit(limit);

    const receipts = await populateReceiptQuery(q);

    return res.status(200).json(receipts);
  } catch (err) {
    console.error("getBuyerReceipts error:", err);

    return res.status(500).json({
      message: "Server error fetching buyer receipts",
    });
  }
};

/* ================================================= */
/* ================= GET SELLER ================= */
/* ================================================= */

exports.getSellerReceipts = async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    if (!userId)
      return res.status(401).json({ message: "Unauthorized" });

    const onlyUnviewed = String(req.query.unviewed) === "true";

    const limit = parseLimit(req);

    const page = parsePage(req);

    const skip = limit ? (page - 1) * limit : 0;

    const filter = { sellerId: userId };

    if (onlyUnviewed) filter.viewedBySeller = false;

    let q = Receipt.find(filter).sort({ createdAt: -1 });

    if (limit) q = q.skip(skip).limit(limit);

    const receipts = await populateReceiptQuery(q);

    return res.status(200).json(receipts);
  } catch (err) {
    console.error("getSellerReceipts error:", err);

    return res.status(500).json({
      message: "Server error fetching seller receipts",
    });
  }
};

/* ================================================= */
/* ================= GET ONE ================= */
/* ================================================= */

exports.getReceipt = async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    if (!userId)
      return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;

    let receipt = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      receipt = await populateReceiptQuery(
        Receipt.findById(id)
      );
    }

    if (!receipt) {
      receipt = await populateReceiptQuery(
        Receipt.findOne({ receiptId: id })
      );
    }

    if (!receipt)
      return res.status(404).json({ message: "Receipt not found" });

    if (!isParty(receipt, userId))
      return res.status(403).json({ message: "Forbidden" });

    return res.status(200).json(receipt);
  } catch (err) {
    console.error("getReceipt error:", err);

    return res.status(500).json({
      message: "Server error loading receipt",
    });
  }
};

/* ================================================= */
/* ================= VIEWED ================= */
/* ================================================= */

exports.markViewed = async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    if (!userId)
      return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;

    const { userType } = req.body || {};

    if (!userType || !["buyer", "seller"].includes(userType)) {
      return res
        .status(400)
        .json({ message: "Missing userType (buyer|seller)" });
    }

    let receipt = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      receipt = await Receipt.findById(id);
    }

    if (!receipt) {
      receipt = await Receipt.findOne({ receiptId: id });
    }

    if (!receipt)
      return res.status(404).json({ message: "Receipt not found" });

    const uid = String(userId);

    const buyerId = String(receipt.buyerId);

    const sellerId = String(receipt.sellerId);

    if (userType === "buyer" && buyerId !== uid)
      return res.status(403).json({ message: "Forbidden" });

    if (userType === "seller" && sellerId !== uid)
      return res.status(403).json({ message: "Forbidden" });

    if (userType === "buyer") receipt.viewedByBuyer = true;

    if (userType === "seller") receipt.viewedBySeller = true;

    await receipt.save();

    const populated = await populateReceiptQuery(
      Receipt.findById(receipt._id)
    );

    return res.status(200).json(populated);
  } catch (err) {
    console.error("markViewed error:", err);

    return res.status(500).json({
      message: "Server error updating receipt",
    });
  }
};

/* ================================================= */
/* ================= MARK ALL ================= */
/* ================================================= */

exports.markAllViewed = async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    if (!userId)
      return res.status(401).json({ message: "Unauthorized" });

    const { userType } = req.body || {};

    if (!userType || !["buyer", "seller"].includes(userType)) {
      return res
        .status(400)
        .json({ message: "Missing userType (buyer|seller)" });
    }

    const filter =
      userType === "buyer"
        ? { buyerId: userId }
        : { sellerId: userId };

    const update =
      userType === "buyer"
        ? { $set: { viewedByBuyer: true } }
        : { $set: { viewedBySeller: true } };

    await Receipt.updateMany(filter, update);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("markAllViewed error:", err);

    return res.status(500).json({
      message: "Server error marking all viewed",
    });
  }
};

/* ================================================= */
/* ================= COMPLETE ================= */
/* ================================================= */

exports.completeReceipt = async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    if (!userId)
      return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;

    const receipt = await findReceiptByParamId(id);

    if (!receipt)
      return res.status(404).json({ message: "Receipt not found" });

    if (String(receipt.buyerId) !== String(userId)) {
      return res.status(403).json({
        message: "Only the buyer can mark this as completed",
      });
    }

    const currentStatus = String(receipt.status || "").toLowerCase();

    if (currentStatus !== "paid") {
      return res.status(400).json({
        message: "Only paid receipts can be completed",
      });
    }

    receipt.status = "completed";

    await receipt.save();

    const populated = await populateReceiptQuery(
      Receipt.findById(receipt._id)
    );

    return res.status(200).json({
      message: "Receipt marked as completed",
      receipt: populated,
    });
  } catch (err) {
    console.error("completeReceipt error:", err);

    return res.status(500).json({
      message: "Server error completing receipt",
    });
  }
};

/* ================================================= */
/* ================= RATE ================= */
/* ================================================= */

exports.rateReceipt = async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    if (!userId)
      return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;

    const { value, reasons = [], comment = "" } = req.body || {};

    const numeric = Number(value);

    if (!Number.isFinite(numeric))
      return res.status(400).json({ message: "Invalid rating value" });

    const v = clamp(round1(numeric), 1.0, 10.0);

    const safeReasons = Array.isArray(reasons)
      ? reasons.map((x) => String(x)).slice(0, 10)
      : [];

    const safeComment = String(comment || "")
      .trim()
      .slice(0, 200);

    const receipt = await findReceiptByParamId(id);

    if (!receipt)
      return res.status(404).json({ message: "Receipt not found" });

    if (String(receipt.buyerId) !== String(userId)) {
      return res.status(403).json({
        message: "Only the buyer can rate this receipt",
      });
    }

    const currentStatusLower = String(receipt.status || "").toLowerCase();

    if (currentStatusLower !== "completed") {
      return res.status(400).json({
        message: "Receipt must be completed before rating",
      });
    }

    if (receipt.rating && receipt.rating.value) {
      return res.status(400).json({
        message: "This receipt is already rated",
      });
    }

    const ratingPayload = {
      value: v,
      reasons: safeReasons,
      comment: safeComment,
      ratedAt: new Date(),
      ratedBy: userId,
    };

    await Receipt.findByIdAndUpdate(
      receipt._id,
      {
        $set: {
          status: "completed",
          rating: ratingPayload,
        },
      },
      {
        new: true,
        runValidators: false,
      }
    );

    const populated = await populateReceiptQuery(
      Receipt.findById(receipt._id)
    );

    return res.status(200).json({
      message: "Rating saved",
      receipt: populated,
    });
  } catch (err) {
    console.error("rateReceipt error:", err);

    return res.status(500).json({
      message: "Server error saving rating",
    });
  }
};
