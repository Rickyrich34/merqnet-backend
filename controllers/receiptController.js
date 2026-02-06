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

// Find by Mongo _id OR receiptId
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
/* ================= CREATE ======================== */
/* ================================================= */

exports.createReceipt = async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const body = req.body || {};

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
/* ================= GET BUYER ===================== */
/* ================================================= */

exports.getBuyerReceipts = async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

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
/* ================= GET SELLER ==================== */
/* ================================================= */

exports.getSellerReceipts = async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

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
/* ================= GET ONE ======================= */
/* ================================================= */

exports.getReceipt = async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;

    let receipt = await findReceiptByParamId(id);

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    receipt = await populateReceiptQuery(
      Receipt.findById(receipt._id)
    );

    if (!isParty(receipt, userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.status(200).json(receipt);
  } catch (err) {
    console.error("getReceipt error:", err);

    return res.status(500).json({
      message: "Server error loading receipt",
    });
  }
};

/* ================================================= */
/* ================= VIEWED ======================== */
/* ================================================= */

exports.markViewed = async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const { userType } = req.body || {};

    if (!["buyer", "seller"].includes(userType)) {
      return res.status(400).json({ message: "Invalid userType" });
    }

    const receipt = await findReceiptByParamId(id);

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

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
/* ================= MARK ALL ====================== */
/* ================================================= */

exports.markAllViewed = async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { userType } = req.body || {};

    if (!["buyer", "seller"].includes(userType)) {
      return res.status(400).json({ message: "Invalid userType" });
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
/* ============ MARK VIEWED ALL (ALIASES) =========== */
/* ================================================= */

exports.markViewedBuyerAll = async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    await Receipt.updateMany(
      { buyerId: userId, viewedByBuyer: false },
      { $set: { viewedByBuyer: true } }
    );

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("markViewedBuyerAll error:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

exports.markViewedSellerAll = async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    await Receipt.updateMany(
      { sellerId: userId, viewedBySeller: false },
      { $set: { viewedBySeller: true } }
    );

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("markViewedSellerAll error:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/* ================================================= */
/* ================= COMPLETE ====================== */
/* ================================================= */

exports.completeReceipt = async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;

    const receipt = await findReceiptByParamId(id);

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    if (String(receipt.buyerId) !== String(userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (String(receipt.status).toLowerCase() !== "paid") {
      return res.status(400).json({ message: "Not paid" });
    }

    receipt.status = "completed";

    await receipt.save();

    const populated = await populateReceiptQuery(
      Receipt.findById(receipt._id)
    );

    return res.status(200).json({
      receipt: populated,
    });
  } catch (err) {
    console.error("completeReceipt error:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/* ================================================= */
/* ================= RATE ========================== */
/* ================================================= */

exports.rateReceipt = async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const { value, reasons = [], comment = "" } = req.body || {};

    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
      return res.status(400).json({ message: "Invalid rating" });
    }

    const v = clamp(round1(numeric), 1.0, 10.0);

    const receipt = await findReceiptByParamId(id);

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    if (String(receipt.status).toLowerCase() !== "completed") {
      return res.status(400).json({ message: "Not completed" });
    }

    if (receipt.rating?.value) {
      return res.status(400).json({ message: "Already rated" });
    }

    const ratingPayload = {
      value: v,
      reasons,
      comment,
      ratedAt: new Date(),
      ratedBy: userId,
    };

    await Receipt.findByIdAndUpdate(receipt._id, {
      $set: {
        rating: ratingPayload,
        status: "completed",
      },
    });

    const populated = await populateReceiptQuery(
      Receipt.findById(receipt._id)
    );

    return res.status(200).json({
      receipt: populated,
    });
  } catch (err) {
    console.error("rateReceipt error:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
};
