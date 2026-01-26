// backend/controllers/paymentController.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const User = require("../models/User");
const Bid = require("../models/Bid");
const Request = require("../models/Request");
const Receipt = require("../models/Receipt");

const getAuthUserId = (req) => req.user?.id || null;

const makeReceiptId = () => `REC-${Math.floor(100000 + Math.random() * 900000)}`;

async function ensureStripeCustomer(user) {
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({ email: user.email });
  user.stripeCustomerId = customer.id;
  await user.save();
  return customer.id;
}

async function setStripeDefaultSource(customerId, sourceId) {
  // In Charges flow, "default_source" is used for charging.
  // This will make stripe.charges.create pick it up.
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

// -----------------------------
// GET CARDS
// -----------------------------
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

// -----------------------------
// ADD CARD (tokenId from Stripe Elements)
// -----------------------------
exports.addCard = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { tokenId, makeDefault } = req.body || {};
    if (!tokenId) return res.status(400).json({ message: "Missing tokenId" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const customerId = await ensureStripeCustomer(user);

    // Attach card to customer using token
    const source = await stripe.customers.createSource(customerId, { source: tokenId });

    // Store minimal card meta locally
    const newCard = {
      stripeSourceId: source.id,
      brand: source.brand || "Card",
      last4: source.last4,
      exp_month: source.exp_month,
      exp_year: source.exp_year,
      isDefault: !!makeDefault,
    };

    if (!Array.isArray(user.cards)) user.cards = [];

    if (makeDefault) {
      user.cards.forEach((c) => (c.isDefault = false));
      newCard.isDefault = true;

      try {
        await setStripeDefaultSource(customerId, source.id);
      } catch (e) {
        console.warn("set default_source failed:", e.message);
      }
    } else if (user.cards.length === 0) {
      // first card should become default
      user.cards.forEach((c) => (c.isDefault = false));
      newCard.isDefault = true;

      try {
        await setStripeDefaultSource(customerId, source.id);
      } catch (e) {
        console.warn("set default_source failed:", e.message);
      }
    }

    // prevent duplicates by last4+exp
    const dup = user.cards.find(
      (c) => c.last4 === newCard.last4 && c.exp_year === newCard.exp_year && c.exp_month === newCard.exp_month
    );
    if (dup) {
      // If duplicate, delete newly created source to avoid clutter
      try {
        await stripe.customers.deleteSource(customerId, source.id);
      } catch {}
      return res.status(400).json({ message: "Card already exists" });
    }

    user.cards.push(newCard);
    await user.save();

    return res.status(201).json({ message: "Card saved", card: newCard });
  } catch (err) {
    console.error("addCard error:", err);
    return res.status(500).json({ message: "Failed to add card" });
  }
};

// -----------------------------
// DELETE CARD (param = last4, based on your current model)
// -----------------------------
exports.deleteCard = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { cardId } = req.params; // your routes name it :cardId
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

    // If removed default, set new default
    if (removed.isDefault && user.cards.length > 0) {
      user.cards.forEach((c, i) => (c.isDefault = i === 0));
      try {
        await setStripeDefaultSource(customerId, user.cards[0].stripeSourceId);
      } catch (e) {
        console.warn("default_source update failed:", e.message);
      }
    }

    await user.save();

    // Remove from Stripe customer too
    if (removed.stripeSourceId) {
      try {
        await stripe.customers.deleteSource(customerId, removed.stripeSourceId);
      } catch (e) {
        console.warn("deleteSource failed:", e.message);
      }
    }

    return res.status(200).json({ message: "Card deleted" });
  } catch (err) {
    console.error("deleteCard error:", err);
    return res.status(500).json({ message: "Failed to delete card" });
  }
};

// -----------------------------
// SET DEFAULT CARD (param = last4, based on your current model)
// -----------------------------
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
        console.warn("default_source update failed:", e.message);
      }
    }

    return res.status(200).json({ message: "Default card updated" });
  } catch (err) {
    console.error("setDefaultCard error:", err);
    return res.status(500).json({ message: "Failed to set default card" });
  }
};

// -----------------------------
// PAY NOW (charges API)
// -----------------------------
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

    // Buyer-only payment
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

    // Prevent double-paying
    const existingReceipt = await Receipt.findOne({ bidId: bid._id, status: "paid" });
    if (existingReceipt) {
      return res.status(200).json({
        message: "Already paid",
        receiptId: existingReceipt.receiptId,
      });
    }

    // Default card
    const def = await ensureLocalDefaultCard(user);
    const sourceId = def?.stripeSourceId || "";

    // This is the REAL check now
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
      console.warn("default_source update failed:", e.message);
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

    // ✅ Capture card + identifiers for receipt display
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

      // Stripe references
      stripeChargeId: charge.id,
      stripePaymentIntentId: charge.payment_intent || null,
      stripePaymentMethodId: charge.payment_method || null,

      // Friendly card display
      paymentMethod: paymentMethodLabel,
      cardBrand: brand,
      cardLast4: last4,
      cardExpMonth: expMonth,
      cardExpYear: expYear,

      status: "paid",
      viewedByBuyer: true,
      viewedBySeller: false,
    });

    return res.status(200).json({ message: "Payment successful", receiptId: receiptDoc.receiptId });
  } catch (err) {
    console.error("payNow error:", err);
    return res.status(500).json({ message: "Payment failed" });
  }
};
