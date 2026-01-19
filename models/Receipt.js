const mongoose = require("mongoose");
const { Schema } = mongoose;

const RatingSchema = new Schema(
  {
    value: { type: Number, min: 1, max: 10 },
    reasons: { type: [String], default: [] },
    comment: { type: String, default: "", maxlength: 200 },
    ratedAt: { type: Date },
    ratedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false }
);

const ReceiptSchema = new Schema(
  {
    receiptId: { type: String, required: true, unique: true, index: true },

    requestId: { type: Schema.Types.ObjectId, ref: "Request", required: true, index: true },
    bidId: { type: Schema.Types.ObjectId, ref: "Bid", required: true, index: true },

    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    amount: { type: Number, required: true },
    currency: { type: String, default: "usd" },

    // Stripe charge id
    stripeChargeId: { type: String, default: "" },

    // ✅ NEW: Stripe identifiers
    stripePaymentIntentId: { type: String, default: null },
    stripePaymentMethodId: { type: String, default: null },

    // ✅ NEW: friendly payment method display
    paymentMethod: { type: String, default: null },

    // ✅ NEW: card snapshot (for receipts)
    cardBrand: { type: String, default: null },
    cardLast4: { type: String, default: null },
    cardExpMonth: { type: Number, default: null },
    cardExpYear: { type: Number, default: null },

    viewedByBuyer: { type: Boolean, default: true },
    viewedBySeller: { type: Boolean, default: false },

    // IMPORTANT: keep values lowercase in DB
    status: {
      type: String,
      enum: ["paid", "completed"],
      default: "paid",
      lowercase: true,
      trim: true,
    },

    rating: { type: RatingSchema, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Receipt", ReceiptSchema);
