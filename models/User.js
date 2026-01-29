// backend/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ========== SHIPPING ADDRESS SCHEMA ==========
// ✅ Backward compatible:
// - DB keeps storing: addressLine1
// - Frontend can send: streetAddress (alias -> addressLine1)
const shippingAddressSchema = new mongoose.Schema({
  addressLine1: {
    type: String,
    required: true,
    alias: "streetAddress",
  },
  addressLine2: { type: String, default: "" },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  postalCode: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
});

// ========== CARD (LOCAL METADATA) SCHEMA ==========
// NOTE: Stores ONLY safe metadata + Stripe reference.
// Legacy cards might not have stripeSourceId (older records).
const cardSchema = new mongoose.Schema(
  {
    brand: { type: String, default: "" },
    last4: { type: String, required: true },
    exp_month: { type: Number, default: null },
    exp_year: { type: Number, default: null },

    // ✅ NOT required to allow legacy cards to be deleted without validation errors
    // Enforcement happens in paymentController.payNow (must exist to charge)
    stripeSourceId: { type: String, default: "" },

    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

// ========== USER SCHEMA ==========
const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },

    rating: {
      type: Number,
      default: 0,
    },

    acceptsInternationalTrade: {
      type: Boolean,
      default: false,
    },

    shippingAddresses: {
      type: [shippingAddressSchema],
      validate: [arrayLimit, "{PATH} exceeds the limit of 3"],
      default: [],
    },

    profileImage: {
      type: String,
      default: "",
    },

    sellerCategory: {
      type: String,
      enum: [
        "Technology",
        "Construction",
        "Automotive",
        "Fashion",
        "Industrial",
        "Food",
        "Other",
      ],
      default: null,
    },

    sellerCountry: {
      type: String,
      default: "United States",
    },

    sellerType: {
      type: String,
      enum: ["Distributor", "Reseller", "Manufacturer", "Exporter"],
      default: null,
    },

    stripeCustomerId: {
      type: String,
      default: "",
    },

    cards: {
      type: [cardSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

function arrayLimit(val) {
  return val.length <= 3;
}

// ========== PASSWORD HASHING ==========
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ========== PASSWORD COMPARISON ==========
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
