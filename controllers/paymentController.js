const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const User = require("../models/User");
const Bid = require("../models/Bid");
const Request = require("../models/Request");
const Receipt = require("../models/Receipt");

/* ==========================================================
   HELPERS
========================================================== */

const getAuthUserId = (req) => req.user?.id || null;

const makeReceiptId = () =>
  `REC-${Math.floor(100000 + Math.random() * 900000)}`;

// 8% platform fee
const PLATFORM_FEE_BPS = 800;

function stripeErrMessage(err) {
  return err?.raw?.message || err?.message || "Stripe error";
}

function calcFeeCents(amountCents) {
  return Math.round((amountCents * PLATFORM_FEE_BPS) / 10000);
}

async function ensureStripeCustomer(user) {
  if (user.stripeCustomerId) {
    try {
      const existing = await stripe.customers.retrieve(user.stripeCustomerId);
      if (existing?.id) return user.stripeCustomerId;
    } catch (e) {}
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || undefined,
  });

  user.stripeCustomerId = customer.id;
  await user.save();

  return customer.id;
}

/* ==========================================================
   CARDS (LOCAL STORAGE)
========================================================== */

exports.getCards = async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    if (!userId)
      return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).select("cards");

    if (!user)
      return res.status(404).json({ message: "User not found" });

    return res.status(200).json(user.cards || []);
  } catch (err) {
    console.error("getCards:", err);
    return res.status(500).json({ message: "Failed to load cards" });
  }
};

exports.addCard = async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    const { stripeSourceId, brand, last4, expMonth, expYear } = req.body;

    if (!userId)
      return res.status(401).json({ message: "Unauthorized" });

    if (!stripeSourceId || !last4)
      return res.status(400).json({ message: "Invalid card data" });

    const user = await User.findById(userId);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (!Array.isArray(user.cards)) user.cards = [];

    const newCard = {
      stripeSourceId,
      brand,
      last4,
      expMonth,
      expYear,
      isDefault: user.cards.length === 0,
    };

    user.cards.push(newCard);

    await user.save();

    return res.status(201).json(newCard);
  } catch (err) {
    console.error("addCard:", err);
    return res.status(500).json({ message: "Failed to add card" });
  }
};

exports.deleteCard = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { cardId } = req.params;

    if (!userId)
      return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    user.cards = user.cards.filter(
      (c) => String(c._id) !== String(cardId)
    );

    if (user.cards.length) {
      user.cards.forEach((c, i) => {
        c.isDefault = i === 0;
      });
    }

    await user.save();

    return res.status(200).json({ message: "Card deleted" });
  } catch (err) {
    console.error("deleteCard:", err);
    return res.status(500).json({ message: "Failed to delete card" });
  }
};

/* ==========================================================
   CREATE PAYMENT INTENT (STRIPE)
========================================================== */

exports.createPaymentIntent = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { requestId, bidId } = req.body;

    if (!userId)
      return res.status(401).json({ message: "Unauthorized" });

    if (!requestId || !bidId)
      return res.status(400).json({ message: "Missing ids" });

    const buyer = await User.findById(userId);
    const request = await Request.findById(requestId);
    const bid = await Bid.findById(bidId);

    if (!buyer || !request || !bid)
      return res.status(404).json({ message: "Data not found" });

    if (!bid.accepted)
      return res.status(400).json({ message: "Bid not accepted" });

    const total = Number(bid.totalPrice);

    if (!Number.isFinite(total) || total <= 0)
      return res.status(400).json({ message: "Invalid price" });

    const amountCents = Math.round(total * 100);
    const feeCents = calcFeeCents(amountCents);

    const seller = await User.findById(bid.sellerId);

    if (!seller?.stripeConnectAccountId)
      return res.status(400).json({ message: "Seller not onboarded" });

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
    console.error("createPaymentIntent:", err);

    return res.status(500).json({
      message: stripeErrMessage(err),
    });
  }
};

/* ==========================================================
   COMPLETE PAYMENT
========================================================== */

exports.completePaymentIntent = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { paymentIntentId } = req.body;

    if (!userId)
      return res.status(401).json({ message: "Unauthorized" });

    if (!paymentIntentId)
      return res.status(400).json({ message: "Missing id" });

    const buyer = await User.findById(userId);

    if (!buyer)
      return res.status(404).json({ message: "User not found" });

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["charges.data.payment_method_details"],
    });

    if (pi.status !== "succeeded")
      return res.status(400).json({ message: "Not completed" });

    const requestId = pi.metadata?.requestId;
    const bidId = pi.metadata?.bidId;

    const request = await Request.findById(requestId);
    const bid = await Bid.findById(bidId);

    if (!request || !bid)
      return res.status(404).json({ message: "Missing data" });

    const charge = pi.charges.data[0];
    const card = charge?.payment_method_details?.card || {};

    const brand = card.brand?.toUpperCase() || null;
    const last4 = card.last4 || null;

    const amount = pi.amount_received / 100;

    const receipt = await Receipt.create({
      receiptId: makeReceiptId(),

      requestId: request._id,
      bidId: bid._id,

      buyerId: buyer._id,
      sellerId: bid.sellerId,

      amount,
      currency: pi.currency,

      stripeChargeId: charge?.id,
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
      message: "Payment completed",
      receiptId: receipt.receiptId,
    });
  } catch (err) {
    console.error("completePaymentIntent:", err);

    return res.status(500).json({
      message: stripeErrMessage(err),
    });
  }
};

/* ==========================================================
   STRIPE CONNECT ONBOARDING (SELLERS)
========================================================== */

exports.startOnboarding = async (req, res) => {
  try {
    const userId = getAuthUserId(req);

    if (!userId)
      return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    let accountId = user.stripeConnectAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        country: "US",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      accountId = account.id;

      user.stripeConnectAccountId = accountId;
      await user.save();
    }

    // ✅ FIXED RETURN URL
    const accountLink = await stripe.accountLinks.create({
      account: accountId,

      refresh_url: `${process.env.FRONTEND_URL}/payout-setup`,
      return_url: `${process.env.FRONTEND_URL}/payout-setup`,

      type: "account_onboarding",
    });

    return res.status(200).json({
      url: accountLink.url,
    });
  } catch (err) {
    console.error("startOnboarding:", err);

    return res.status(500).json({
      message: stripeErrMessage(err),
    });
  }
};
