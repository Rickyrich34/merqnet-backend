// backend/controllers/paymentController.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const User = require("../models/User");
const Bid = require("../models/Bid");
const Request = require("../models/Request");
const Receipt = require("../models/Receipt");

const getAuthUserId = (req) => req.user?.id || null;

const makeReceiptId = () => `REC-${Math.floor(100000 + Math.random() * 900000)}`;

// ✅ 8% platform fee
const PLATFORM_FEE_BPS = 800; // 8.00% (basis points)

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
  return stripe.customers.update(customerId, { default_source: sourceId });
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
   CARDS CRUD
========================================================== */

// GET CARDS
exports.getCards = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized", cards: [] });

    const user = await User.findById(userId).select("cards");
    if (!user) return res.status(404).json({ message: "User not found", cards: [] });

    const cards = Array.isArray(user.cards) ? user.cards : [];
    return res.status(200).json({ cards });
  } catch (err) {
    console.error("getCards error:", err);
    return res.status(500).json({ message: "Failed to load cards", cards: [] });
  }
};

// ADD CARD (tokenId from Stripe Elements)
exports.addCard = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ message: "Stripe secret key not configured" });
    }

    const { tokenId, makeDefault } = req.body || {};
    if (!tokenId) return res.status(400).json({ message: "Missing tokenId" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const customerId = await ensureStripeCustomer(user);

    // Attach card to customer using token
    const source = await stripe.customers.createSource(customerId, { source: tokenId });

    const newCard = {
      stripeSourceId: source.id,
      brand: source.brand || "Card",
      last4: source.last4,
      exp_month: source.exp_month,
      exp_year: source.exp_year,
      isDefault: !!makeDefault,
    };

    if (!Array.isArray(user.cards)) user.cards = [];

    // Prevent duplicates (best-effort)
    const dup = user.cards.find(
      (c) =>
        String(c.last4) === String(newCard.last4) &&
        Number(c.exp_year) === Number(newCard.exp_year) &&
        Number(c.exp_month) === Number(newCard.exp_month)
    );
    if (dup) {
      try {
        await stripe.customers.deleteSource(customerId, source.id);
      } catch {}
      return res.status(400).json({ message: "Card already exists" });
    }

    // Default handling
    if (makeDefault || user.cards.length === 0) {
      user.cards.forEach((c) => (c.isDefault = false));
      newCard.isDefault = true;
      try {
        await setStripeDefaultSource(customerId, source.id);
      } catch (e) {
        console.warn("set default_source failed:", stripeErrMessage(e));
      }
    }

    user.cards.push(newCard);
    await user.save();

    return res.status(201).json({ message: "Card saved", card: newCard });
  } catch (err) {
    console.error("addCard error:", err);
    const msg = stripeErrMessage(err);
    const status = stripeErrStatus(err);
    return res.status(status).json({
      message: msg || "Failed to add card",
    });
  }
};

// DELETE CARD (param = last4, based on your current model)
exports.deleteCard = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { cardId } = req.params;
    const last4 = String(cardId || "");

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!Array.isArray(user.cards) || user.cards.length === 0) {
      return res.status(404).json({ message: "No cards found" });
    }

    const idx = user.cards.findIndex((c) => String(c.last4) === last4);
    if (idx === -1) return res.status(404).json({ message: "Card not found" });

    const customerId = await ensureStripeCustomer(user);

    const removed = user.cards[idx];
    user.cards.splice(idx, 1);

    if (removed.isDefault && user.cards.length > 0) {
      user.cards.forEach((c, i) => (c.isDefault = i === 0));
      try {
        await setStripeDefaultSource(customerId, user.cards[0].stripeSourceId);
      } catch (e) {
        console.warn("default_source update failed:", stripeErrMessage(e));
      }
    }

    await user.save();

    if (removed.stripeSourceId) {
      try {
        await stripe.customers.deleteSource(customerId, removed.stripeSourceId);
      } catch (e) {
        console.warn("deleteSource failed:", stripeErrMessage(e));
      }
    }

    return res.status(200).json({ message: "Card deleted" });
  } catch (err) {
    console.error("deleteCard error:", err);
    return res.status(500).json({ message: "Failed to delete card" });
  }
};

// SET DEFAULT CARD (param = last4, based on your current model)
exports.setDefaultCard = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { cardId } = req.params;
    const last4 = String(cardId || "");

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!Array.isArray(user.cards) || user.cards.length === 0) {
      return res.status(404).json({ message: "No cards found" });
    }

    const target = user.cards.find((c) => String(c.last4) === last4);
    if (!target) return res.status(404).json({ message: "Card not found" });

    user.cards.forEach((c) => (c.isDefault = false));
    target.isDefault = true;
    await user.save();

    const customerId = await ensureStripeCustomer(user);

    if (target.stripeSourceId) {
      try {
        await setStripeDefaultSource(customerId, target.stripeSourceId);
      } catch (e) {
        console.warn("default_source update failed:", stripeErrMessage(e));
      }
    }

    return res.status(200).json({ message: "Default card updated" });
  } catch (err) {
    console.error("setDefaultCard error:", err);
    return res.status(500).json({ message: "Failed to set default card" });
  }
};

/* ==========================================================
   LEGACY PAY NOW (charges API) — keep for backward compatibility
========================================================== */

exports.payNow = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { requestId, bidId } = req.body || {};

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!requestId || !bidId) return res.status(400).json({ message: "Missing requestId or bidId" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (String(request.clientID) !== String(user._id)) {
      return res.status(403).json({ message: "Forbidden: only buyer can pay" });
    }

    const bid = await Bid.findById(bidId);
    if (!bid) return res.status(404).json({ message: "Bid not found" });

    if (String(bid.requestId) !== String(request._id)) {
      return res.status(400).json({ message: "Bid does not belong to this request" });
    }

    if (!bid.accepted) {
      return res.status(400).json({ message: "Bid is not accepted" });
    }

    const existingReceipt = await Receipt.findOne({
      bidId: bid._id,
      status: { $in: ["paid", "completed"] },
    });
    if (existingReceipt) {
      return res.status(200).json({
        message: "Already paid",
        receiptId: existingReceipt.receiptId,
      });
    }

    const def = await ensureLocalDefaultCard(user);
    const sourceId = def?.stripeSourceId || "";

    if (!sourceId) {
      return res.status(400).json({
        message:
          "Default card exists in UI, but this user has no Stripe source id saved. Delete old cards and re-add them.",
      });
    }

    const total = Number(bid.totalPrice);
    if (!Number.isFinite(total) || total <= 0) {
      return res.status(400).json({ message: "Invalid bid total price" });
    }

    const amountCents = Math.round(total * 100);
    const customerId = await ensureStripeCustomer(user);

    try {
      await setStripeDefaultSource(customerId, sourceId);
    } catch (e) {
      console.warn("default_source update failed:", stripeErrMessage(e));
    }

    const charge = await stripe.charges.create({
      amount: amountCents,
      currency: "usd",
      customer: customerId,
      description: `MerqNet payment | request ${requestId} | bid ${bidId}`,
      metadata: {
        requestId: String(requestId),
        bidId: String(bidId),
        buyerId: String(user._id),
        sellerId: String(bid.sellerId),
      },
    });

    const cardDetails = charge?.payment_method_details?.card || {};
    const brand = cardDetails.brand ? String(cardDetails.brand).toUpperCase() : null;
    const last4 = cardDetails.last4 || null;
    const expMonth = cardDetails.exp_month ?? null;
    const expYear = cardDetails.exp_year ?? null;
    const paymentMethodLabel = brand && last4 ? `${brand} •••• ${last4}` : null;

    const receiptDoc = await Receipt.create({
      receiptId: makeReceiptId(),
      requestId: request._id,
      bidId: bid._id,
      buyerId: user._id,
      sellerId: bid.sellerId,
      amount: total,
      currency: "usd",
      stripeChargeId: charge.id,
      stripePaymentIntentId: charge.payment_intent || null,
      stripePaymentMethodId: charge.payment_method || null,
      paymentMethod: paymentMethodLabel,
      cardBrand: brand,
      cardLast4: last4,
      cardExpMonth: expMonth,
      cardExpYear: expYear,
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

    return res.status(200).json({ message: "Payment successful", receiptId: receiptDoc.receiptId });
  } catch (err) {
    console.error("payNow error:", err);
    return res.status(500).json({ message: "Payment failed" });
  }
};

/* ==========================================================
   STRIPE CONNECT (seller onboarding)
========================================================== */

exports.createConnectOnboardingLink = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ message: "Stripe secret key not configured" });
    }

    let accountId = user.stripeConnectAccountId || "";
    if (!accountId) {
      const acct = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: { merqnetUserId: String(user._id) },
      });

      accountId = acct.id;
      user.stripeConnectAccountId = accountId;
      await user.save();
    }

    const frontend = (process.env.STRIPE_CONNECT_RETURN_URL || process.env.FRONTEND_URL || "").replace(/\/$/, "");
    const returnUrl =
      process.env.STRIPE_CONNECT_RETURN_URL || (frontend ? `${frontend}/settings` : "https://example.com");
    const refreshUrl = process.env.STRIPE_CONNECT_REFRESH_URL || returnUrl;

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return res.status(200).json({
      message: "Onboarding link created",
      url: link.url,
      stripeConnectAccountId: accountId,
    });
  } catch (err) {
    console.error("createConnectOnboardingLink error:", err);
    const msg = stripeErrMessage(err);
    const status = stripeErrStatus(err);
    return res.status(status).json({ message: msg || "Failed to create onboarding link" });
  }
};

/* ==========================================================
   PAYMENT INTENT FLOW (choose payment method at pay time)
   - createPaymentIntent: returns clientSecret
   - completePaymentIntent: creates receipt + marks bid/request (NO WEBHOOK REQUIRED)
========================================================== */

exports.createPaymentIntent = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { requestId, bidId } = req.body || {};

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!requestId || !bidId) return res.status(400).json({ message: "Missing requestId or bidId" });

    const buyer = await User.findById(userId);
    if (!buyer) return res.status(404).json({ message: "User not found" });

    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (String(request.clientID) !== String(buyer._id)) {
      return res.status(403).json({ message: "Forbidden: only buyer can pay" });
    }

    const bid = await Bid.findById(bidId);
    if (!bid) return res.status(404).json({ message: "Bid not found" });

    if (String(bid.requestId) !== String(request._id)) {
      return res.status(400).json({ message: "Bid does not belong to this request" });
    }

    if (!bid.accepted) {
      return res.status(400).json({ message: "Bid is not accepted" });
    }

    // Idempotency: if already paid, return receipt
    const existingReceipt = await Receipt.findOne({
      bidId: bid._id,
      status: { $in: ["paid", "completed"] },
    });
    if (existingReceipt) {
      return res.status(200).json({
        message: "Already paid",
        receiptId: existingReceipt.receiptId,
        clientSecret: null,
        paymentIntentId: null,
      });
    }

    const total = Number(bid.totalPrice);
    if (!Number.isFinite(total) || total <= 0) {
      return res.status(400).json({ message: "Invalid bid total price" });
    }

    const amountCents = Math.round(total * 100);
    const feeCents = calcFeeCents(amountCents);

    // Seller must be onboarded in Connect
    const seller = await User.findById(bid.sellerId).select("stripeConnectAccountId email");
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    const destination = seller.stripeConnectAccountId || "";
    if (!destination) {
      return res.status(400).json({
        message:
          "Seller is not onboarded to Stripe Connect yet. Seller must complete onboarding before receiving payouts.",
      });
    }

    const customerId = await ensureStripeCustomer(buyer);
    const idempotencyKey = `pi_${requestId}_${bidId}_${userId}`;

    const pi = await stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency: "usd",
        customer: customerId,
        automatic_payment_methods: { enabled: true },

        application_fee_amount: Math.min(feeCents, amountCents),
        transfer_data: { destination },

        description: `MerqNet payment | request ${requestId} | bid ${bidId}`,
        metadata: {
          requestId: String(requestId),
          bidId: String(bidId),
          buyerId: String(buyer._id),
          sellerId: String(bid.sellerId),
          platformFeeBps: String(PLATFORM_FEE_BPS),
        },
      },
      { idempotencyKey }
    );

    return res.status(200).json({
      clientSecret: pi.client_secret,
      paymentIntentId: pi.id,
      amount: total,
      currency: "usd",
      platformFee: feeCents / 100,
    });
  } catch (err) {
    console.error("createPaymentIntent error:", err);
    const msg = stripeErrMessage(err);
    const status = stripeErrStatus(err);
    return res.status(status).json({ message: msg || "Failed to create payment intent" });
  }
};

// ✅ NEW: finalize without webhook
// Call this after stripe.confirmPayment() returns succeeded
exports.completePaymentIntent = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { paymentIntentId } = req.body || {};

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!paymentIntentId) return res.status(400).json({ message: "Missing paymentIntentId" });

    const buyer = await User.findById(userId);
    if (!buyer) return res.status(404).json({ message: "User not found" });

    // If already created, return it
    const existing = await Receipt.findOne({
      stripePaymentIntentId: String(paymentIntentId),
      status: { $in: ["paid", "completed"] },
    });
    if (existing) {
      return res.status(200).json({ message: "Already completed", receiptId: existing.receiptId });
    }

    const pi = await stripe.paymentIntents.retrieve(String(paymentIntentId), {
      expand: ["charges.data.payment_method_details"],
    });

    if (!pi) return res.status(404).json({ message: "PaymentIntent not found" });

    const buyerId = pi?.metadata?.buyerId;
    if (!buyerId || String(buyerId) !== String(buyer._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (pi.status !== "succeeded") {
      return res.status(400).json({ message: `Payment not succeeded (status=${pi.status})` });
    }

    const requestId = pi?.metadata?.requestId;
    const bidId = pi?.metadata?.bidId;
    const sellerId = pi?.metadata?.sellerId;

    if (!requestId || !bidId || !sellerId) {
      return res.status(400).json({ message: "Missing metadata on PaymentIntent" });
    }

    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (String(request.clientID) !== String(buyer._id)) {
      return res.status(403).json({ message: "Forbidden: only buyer can complete" });
    }

    const bid = await Bid.findById(bidId);
    if (!bid) return res.status(404).json({ message: "Bid not found" });

    if (String(bid.requestId) !== String(request._id)) {
      return res.status(400).json({ message: "Bid does not belong to this request" });
    }

    if (!bid.accepted) {
      return res.status(400).json({ message: "Bid is not accepted" });
    }

    // Build receipt details from charge
    const charge = (pi?.charges?.data && pi.charges.data[0]) || null;
    const cardDetails = charge?.payment_method_details?.card || {};
    const brand = cardDetails.brand ? String(cardDetails.brand).toUpperCase() : null;
    const last4 = cardDetails.last4 || null;
    const expMonth = cardDetails.exp_month ?? null;
    const expYear = cardDetails.exp_year ?? null;
    const paymentMethodLabel = brand && last4 ? `${brand} •••• ${last4}` : null;

    const amount = Number(pi.amount_received || pi.amount || 0) / 100;

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

    bid.status = "paid";
    await bid.save();

    request.status = "completed";
    await request.save();

    await Bid.deleteMany({
      requestId: request._id,
      _id: { $ne: bid._id },
    });

    return res.status(200).json({ message: "Completed", receiptId: receiptDoc.receiptId });
  } catch (err) {
    console.error("completePaymentIntent error:", err);
    const msg = stripeErrMessage(err);
    const status = stripeErrStatus(err);
    return res.status(status).json({ message: msg || "Failed to complete payment" });
  }
};

/* ==========================================================
   OPTIONAL WEBHOOK (you can keep this; not required anymore)
========================================================== */
exports.stripeWebhook = async (req, res) => {
  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET || "";
    if (!secret) {
      return res.status(500).send("Missing STRIPE_WEBHOOK_SECRET");
    }

    const sig = req.headers["stripe-signature"];
    if (!sig) return res.status(400).send("Missing Stripe-Signature header");

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, secret);
    } catch (err) {
      console.error("Webhook signature verify failed:", stripeErrMessage(err));
      return res.status(400).send(`Webhook Error: ${stripeErrMessage(err)}`);
    }

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object;
      // If you re-enable webhook route later, you can call completePaymentIntent logic here
      // but since you removed the webhook route, this function is optional.
      console.log("payment_intent.succeeded webhook received:", pi?.id);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("stripeWebhook error:", err);
    return res.status(500).send("Webhook handler failed");
  }
};
