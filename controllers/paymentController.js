// backend/controllers/paymentController.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const User = require("../models/User");
const Bid = require("../models/Bid");
const Request = require("../models/Request");
const Receipt = require("../models/Receipt");

const getAuthUserId = (req) => req.user?.id || null;

const makeReceiptId = () =>
  `REC-${Math.floor(100000 + Math.random() * 900000)}`;

// ✅ 8% platform fee
const PLATFORM_FEE_BPS = 800;

/* ================= HELPERS ================= */

function stripeErrMessage(err) {
  return err?.raw?.message || err?.message || "Stripe error";
}

function stripeErrStatus(err) {
  const s = Number(err?.statusCode);
  return Number.isFinite(s) && s >= 400 && s <= 599 ? s : 500;
}

function calcFeeCents(amountCents) {
  return Math.round((amountCents * PLATFORM_FEE_BPS) / 10000);
}

async function ensureStripeCustomer(user) {
  if (user.stripeCustomerId) {
    try {
      const existing = await stripe.customers.retrieve(user.stripeCustomerId);
      if (existing && existing.id) return user.stripeCustomerId;
    } catch (e) {
      const msg = String(stripeErrMessage(e) || "");
      const isMissing =
        e?.raw?.code === "resource_missing" || /no such customer/i.test(msg);

      if (!isMissing) throw e;
    }
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || undefined,
  });

  user.stripeCustomerId = customer.id;
  await user.save();

  return customer.id;
}

async function setStripeDefaultSource(customerId, sourceId) {
  return stripe.customers.update(customerId, {
    default_source: sourceId,
  });
}

async function ensureLocalDefaultCard(user) {
  if (!Array.isArray(user.cards)) user.cards = [];
  if (user.cards.length === 0) return null;

  let def = user.cards.find((c) => c.isDefault) || null;

  if (!def) {
    user.cards.forEach((c, i) => (c.isDefault = i === 0));
    await user.save();
    def = user.cards[0];
  }

  return def;
}

/* ==========================================================
   PAY NOW (LEGACY)
========================================================== */

exports.payNow = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { requestId, bidId } = req.body || {};

    if (!userId)
      return res.status(401).json({ message: "Unauthorized" });

    if (!requestId || !bidId)
      return res
        .status(400)
        .json({ message: "Missing requestId or bidId" });

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const request = await Request.findById(requestId);
    if (!request)
      return res.status(404).json({ message: "Request not found" });

    if (String(request.clientID) !== String(user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const bid = await Bid.findById(bidId);
    if (!bid)
      return res.status(404).json({ message: "Bid not found" });

    if (!bid.accepted)
      return res.status(400).json({ message: "Bid not accepted" });

    const existing = await Receipt.findOne({
      bidId: bid._id,
      status: { $in: ["paid", "completed"] },
    });

    if (existing) {
      return res.status(200).json({
        message: "Already paid",
        receiptId: existing.receiptId,
      });
    }

    const def = await ensureLocalDefaultCard(user);
    const sourceId = def?.stripeSourceId || "";

    if (!sourceId) {
      return res.status(400).json({
        message: "No Stripe card available",
      });
    }

    const total = Number(bid.totalPrice);

    if (!Number.isFinite(total) || total <= 0) {
      return res.status(400).json({ message: "Invalid price" });
    }

    const amountCents = Math.round(total * 100);
    const customerId = await ensureStripeCustomer(user);

    await setStripeDefaultSource(customerId, sourceId);

    const charge = await stripe.charges.create({
      amount: amountCents,
      currency: "usd",
      customer: customerId,
      description: "MerqNet payment",
    });

    const card = charge?.payment_method_details?.card || {};

    const brand = card.brand?.toUpperCase() || null;
    const last4 = card.last4 || null;

    // ✅ CREATE RECEIPT (NO INVALID FIELDS)
    const receiptDoc = await Receipt.create({
      receiptId: makeReceiptId(),

      requestId: request._id,
      bidId: bid._id,

      buyerId: user._id,
      sellerId: bid.sellerId,

      amount: total,
      receiptId: makeReceiptId(),

  requestId: request._id,
  bidId: bid._id,

  buyerId: buyer._id,
  sellerId: bid.sellerId,

  // ✅ SNAPSHOT DEL PRODUCTO
  productName: request.productName,

  amount,
  currency: pi.currency || "usd",

  stripeChargeId: charge?.id || null,
  stripePaymentIntentId: pi.id,
  stripePaymentMethodId: pi.payment_method || null,

  paymentMethod: paymentMethodLabel,

  cardBrand: brand,
  cardLast4: last4,
  cardExpMonth: expMonth,
  cardExpYear: expYear,

  status: "completed",
  viewedByBuyer: true,
  viewedBySeller: false,
    });

    return res.status(200).json({
      message: "Payment successful",
      receiptId: receiptDoc.receiptId,
    });
  } catch (err) {
    console.error("payNow error:", err);
    return res.status(500).json({ message: "Payment failed" });
  }
};

/* ==========================================================
   CREATE PAYMENT INTENT
========================================================== */

exports.createPaymentIntent = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { requestId, bidId } = req.body || {};

    if (!userId)
      return res.status(401).json({ message: "Unauthorized" });

    if (!requestId || !bidId)
      return res.status(400).json({ message: "Missing ids" });

    const buyer = await User.findById(userId);
    if (!buyer)
      return res.status(404).json({ message: "User not found" });

    const request = await Request.findById(requestId);
    if (!request)
      return res.status(404).json({ message: "Request not found" });

    const bid = await Bid.findById(bidId);
    if (!bid)
      return res.status(404).json({ message: "Bid not found" });

    if (!bid.accepted)
      return res.status(400).json({ message: "Bid not accepted" });

    const total = Number(bid.totalPrice);

    if (!Number.isFinite(total) || total <= 0) {
      return res.status(400).json({ message: "Invalid price" });
    }

    const amountCents = Math.round(total * 100);
    const feeCents = calcFeeCents(amountCents);

    const seller = await User.findById(bid.sellerId);

    if (!seller?.stripeConnectAccountId) {
      return res.status(400).json({
        message: "Seller not onboarded",
      });
    }

    const customerId = await ensureStripeCustomer(buyer);

    const pi = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      customer: customerId,

      automatic_payment_methods: { enabled: true },

      application_fee_amount: Math.min(feeCents, amountCents),

      transfer_data: {
        destination: seller.stripeConnectAccountId,
      },

      metadata: {
        requestId,
        bidId,
        buyerId: buyer._id.toString(),
        sellerId: bid.sellerId.toString(),
      },
    });

    return res.status(200).json({
      clientSecret: pi.client_secret,
      paymentIntentId: pi.id,
      amount: total,
      currency: "usd",
    });
  } catch (err) {
    console.error("createPaymentIntent error:", err);

    return res.status(500).json({
      message: stripeErrMessage(err),
    });
  }
};

/* ==========================================================
   COMPLETE PAYMENT INTENT
========================================================== */

exports.completePaymentIntent = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { paymentIntentId } = req.body || {};

    if (!userId)
      return res.status(401).json({ message: "Unauthorized" });

    if (!paymentIntentId)
      return res.status(400).json({ message: "Missing paymentIntentId" });

    const buyer = await User.findById(userId);
    if (!buyer)
      return res.status(404).json({ message: "User not found" });

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["charges.data.payment_method_details"],
    });

    if (!pi || pi.status !== "succeeded") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    const requestId = pi.metadata?.requestId;
    const bidId = pi.metadata?.bidId;

    const request = await Request.findById(requestId);
    const bid = await Bid.findById(bidId);

    if (!request || !bid) {
      return res.status(404).json({ message: "Data missing" });
    }

    const charge = pi.charges.data[0];
    const card = charge?.payment_method_details?.card || {};

    const brand = card.brand?.toUpperCase() || null;
    const last4 = card.last4 || null;

    const amount = Number(pi.amount_received) / 100;

    // ✅ CREATE RECEIPT (NO INVALID FIELDS)
    const receiptDoc = await Receipt.create({
      receiptId: makeReceiptId(),

      requestId: request._id,
      bidId: bid._id,

      buyerId: buyer._id,
      sellerId: bid.sellerId,

      amount,
      currency: pi.currency || "usd",

      stripeChargeId: charge?.id || null,
      stripePaymentIntentId: pi.id,

      paymentMethod:
        brand && last4 ? `${brand} •••• ${last4}` : null,

      cardBrand: brand,
      cardLast4: last4,

      status: "completed",

      viewedByBuyer: true,
      viewedBySeller: false,
    });

    bid.status = "paid";
    await bid.save();

    request.status = "completed";
    await request.save();

    await Bid.deleteMany({
      requestId: request._id,
      _id: { $ne: bid._id },
    });

    return res.status(200).json({
      message: "Completed",
      receiptId: receiptDoc.receiptId,
    });
  } catch (err) {
    console.error("completePaymentIntent error:", err);

    return res.status(500).json({
      message: stripeErrMessage(err),
    });
  }
};
