// =====================================
// backend/controllers/paymentController.js
// =====================================
const Stripe = require("stripe");

const User = require("../models/User");
const Bid = require("../models/Bid");
const Request = require("../models/Request");
const Receipt = require("../models/Receipt");

// Lazy Stripe init (never crash server on missing env)
let stripeClient = null;
function getStripe() {
  if (stripeClient) return stripeClient;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;

  stripeClient = new Stripe(key);
  return stripeClient;
}

function stripeEnvError(res) {
  return res.status(500).json({
    message: "Stripe is not configured on the server. Missing STRIPE_SECRET_KEY.",
  });
}

const getAuthUserId = (req) => req.user?.id || req.user?._id || null;

const makeReceiptId = () =>
  `REC-${Math.floor(100000 + Math.random() * 900000)}`;

async function ensureStripeCustomer(user, stripe) {
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({ email: user.email });
  user.stripeCustomerId = customer.id;
  await user.save();
  return customer.id;
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

// -----------------------------
// GET CARDS
// -----------------------------
exports.getCards = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId)
      return res.status(401).json({ message: "Unauthorized", cards: [] });

    const user = await User.findById(userId).select("cards");
    if (!user)
      return res.status(404).json({ message: "User not found", cards: [] });

    const cards = Array.isArray(user.cards) ? user.cards : [];
    return res.status(200).json({ cards });
  } catch (err) {
    console.error("getCards error:", err);
    return res.status(500).json({ message: "Failed to load cards", cards: [] });
  }
};

// -----------------------------
// ADD CARD (Frontend sends { paymentMethodId: "pm_..." })
// -----------------------------
exports.addCard = async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) return stripeEnvError(res);

    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { paymentMethodId } = req.body || {};
    if (!paymentMethodId)
      return res.status(400).json({ message: "Missing paymentMethodId" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const customerId = await ensureStripeCustomer(user, stripe);

    // Attach PM to customer
    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
    } catch (e) {
      // If already attached, Stripe throws — ignore that case safely
      const msg = String(e?.message || "");
      if (!msg.toLowerCase().includes("already")) {
        console.error("attach paymentMethod error:", e);
        return res
          .status(400)
          .json({ message: "Failed to attach payment method" });
      }
    }

    // Retrieve details (brand/last4/exp)
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    const card = pm?.card || {};
    const brand = card?.brand ? String(card.brand).toUpperCase() : "CARD";
    const last4 = card?.last4 || "----";
    const expMonth = card?.exp_month ?? null;
    const expYear = card?.exp_year ?? null;

    if (!Array.isArray(user.cards)) user.cards = [];

    // Prevent duplicates
    const exists = user.cards.some(
      (c) => c.stripePaymentMethodId === paymentMethodId
    );
    if (!exists) {
      user.cards.push({
        stripePaymentMethodId: paymentMethodId,
        brand,
        last4,
        expMonth,
        expYear,
        isDefault: user.cards.length === 0, // first card default
      });
    }

    // Ensure local default always exists
    await ensureLocalDefaultCard(user);

    await user.save();

    return res.status(200).json({ message: "Card added" });
  } catch (err) {
    console.error("addCard error:", err);
    return res.status(500).json({ message: "Failed to add card" });
  }
};

// -----------------------------
// SET DEFAULT CARD
// Frontend calls PUT /cards/default with body { stripePaymentMethodId }
// -----------------------------
exports.setDefaultCard = async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) return stripeEnvError(res);

    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { stripePaymentMethodId } = req.body || {};
    if (!stripePaymentMethodId)
      return res.status(400).json({ message: "Missing stripePaymentMethodId" });

    const user = await User.findById(userId);
    if (!user || !Array.isArray(user.cards))
      return res.status(404).json({ message: "User or cards not found" });

    const target = user.cards.find(
      (c) => c.stripePaymentMethodId === stripePaymentMethodId
    );
    if (!target) return res.status(404).json({ message: "Card not found" });

    user.cards.forEach((c) => (c.isDefault = false));
    target.isDefault = true;
    await user.save();

    const customerId = await ensureStripeCustomer(user, stripe);

    // Set Stripe default payment method (invoice_settings)
    try {
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: stripePaymentMethodId },
      });
    } catch (e) {
      // Not fatal for UI; local default still set
      console.error("stripe set default PM error:", e);
    }

    return res.status(200).json({ message: "Default card updated" });
  } catch (err) {
    console.error("setDefaultCard error:", err);
    return res.status(500).json({ message: "Failed to set default card" });
  }
};

// -----------------------------
// DELETE CARD
// Frontend calls DELETE /cards/:id where :id is Mongo subdoc _id
// -----------------------------
exports.deleteCard = async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) return stripeEnvError(res);

    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const id = String(req.params.id || "");
    if (!id) return res.status(400).json({ message: "Missing card id" });

    const user = await User.findById(userId);
    if (!user || !Array.isArray(user.cards))
      return res.status(404).json({ message: "User or cards not found" });

    const idx = user.cards.findIndex((c) => String(c._id) === id);
    if (idx === -1) return res.status(404).json({ message: "Card not found" });

    const removed = user.cards[idx];
    user.cards.splice(idx, 1);

    // If removed default -> set first as default
    if (removed?.isDefault && user.cards.length > 0) {
      user.cards.forEach((c, i) => (c.isDefault = i === 0));
    }

    await user.save();

    // Detach from Stripe customer (best effort)
    try {
      if (user.stripeCustomerId && removed?.stripePaymentMethodId) {
        await stripe.paymentMethods.detach(removed.stripePaymentMethodId);
      }
    } catch (e) {
      // ignore
    }

    return res.status(200).json({ message: "Card deleted" });
  } catch (err) {
    console.error("deleteCard error:", err);
    return res.status(500).json({ message: "Failed to delete card" });
  }
};

// -----------------------------
// SUMMARY
// GET /summary/:bidId -> { bid, request }
// -----------------------------
exports.getSummary = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { bidId } = req.params || {};

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!bidId) return res.status(400).json({ message: "Missing bidId" });

    const bid = await Bid.findById(bidId);
    if (!bid) return res.status(404).json({ message: "Bid not found" });

    const requestId = bid.requestId;
    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const buyerId = request.clientID || request.clientId;
    if (String(buyerId) !== String(userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.status(200).json({ bid, request });
  } catch (err) {
    console.error("getSummary error:", err);
    return res.status(500).json({ message: "Failed to load summary" });
  }
};

// -----------------------------
// PAY NOW
// POST /pay with body { bidId }
// returns { receiptId }
// -----------------------------
exports.payNow = async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) return stripeEnvError(res);

    const userId = getAuthUserId(req);
    const { bidId } = req.body || {};

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!bidId) return res.status(400).json({ message: "Missing bidId" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const bid = await Bid.findById(bidId);
    if (!bid) return res.status(404).json({ message: "Bid not found" });

    const request = await Request.findById(bid.requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const buyerId = request.clientID || request.clientId;
    if (String(buyerId) !== String(user._id)) {
      return res
        .status(403)
        .json({ message: "Forbidden: only buyer can pay" });
    }

    if (!bid.accepted) {
      return res.status(400).json({ message: "Bid is not accepted" });
    }

    // If already paid, return existing receipt
    const existingReceipt = await Receipt.findOne({
      bidId: bid._id,
      status: "paid",
    });
    if (existingReceipt) {
      return res.status(200).json({
        message: "Already paid",
        receiptId: existingReceipt.receiptId,
      });
    }

    // Must have default card
    const def = await ensureLocalDefaultCard(user);
    const pmId = def?.stripePaymentMethodId || "";
    if (!pmId) return res.status(400).json({ message: "No default card set" });

    const customerId = await ensureStripeCustomer(user, stripe);

    // Make sure this PM is attached (best effort)
    try {
      await stripe.paymentMethods.attach(pmId, { customer: customerId });
    } catch (_) {}

    // Charge total = bid.totalPrice + 6% fee
    const subtotal = Number(bid.totalPrice);
    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      return res.status(400).json({ message: "Invalid bid total price" });
    }

    const merqnetFee = Number((subtotal * 0.06).toFixed(2));
    const totalToCharge = Number((subtotal + merqnetFee).toFixed(2));
    const amountCents = Math.round(totalToCharge * 100);

    // PaymentIntent (correct for pm_...)
    const pi = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      customer: customerId,
      payment_method: pmId,
      confirm: true,
      off_session: true,
      description: `MerqNet payment | request ${request._id} | bid ${bid._id}`,
      metadata: {
        requestId: String(request._id),
        bidId: String(bid._id),
        buyerId: String(user._id),
        sellerId: String(bid.sellerId),
        subtotal: String(subtotal),
        merqnetFee: String(merqnetFee),
        totalCharged: String(totalToCharge),
      },
    });

    if (pi.status !== "succeeded") {
      return res.status(400).json({ message: "Payment did not succeed" });
    }

    // Build payment method label
    const brand = def?.brand ? String(def.brand).toUpperCase() : null;
    const last4 = def?.last4 || null;
    const expMonth = def?.expMonth ?? null;
    const expYear = def?.expYear ?? null;
    const paymentMethodLabel =
      brand && last4 ? `${brand} •••• ${last4}` : null;

    const receiptDoc = await Receipt.create({
      receiptId: makeReceiptId(),
      requestId: request._id,
      bidId: bid._id,
      buyerId: user._id,
      sellerId: bid.sellerId,

      amount: totalToCharge,
      currency: "usd",

      stripePaymentIntentId: pi.id,
      stripePaymentMethodId: pmId,

      paymentMethod: paymentMethodLabel,
      cardBrand: brand,
      cardLast4: last4,
      cardExpMonth: expMonth,
      cardExpYear: expYear,

      status: "paid",
      viewedByBuyer: true,
      viewedBySeller: false,
    });

    return res.status(200).json({
      message: "Payment successful",
      receiptId: receiptDoc.receiptId,
    });
  } catch (err) {
    console.error("payNow error:", err);

    const msg = String(err?.message || "Payment failed");
    return res.status(500).json({ message: msg });
  }
};
