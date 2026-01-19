const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // CAMPOS QUE EL FRONT NECESITA DIRECTOS
    buyerFullName: {
      type: String,
      required: true,
    },
    buyerEmail: {
      type: String,
      required: true,
    },
    requestTitle: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      default: "matched",
      enum: ["matched", "contacted", "completed", "rejected"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Match", matchSchema);
