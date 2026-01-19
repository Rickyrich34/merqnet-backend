const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true },
    condition: { type: String, required: true },
    sizeWeight: { type: String, required: false, default: "" },
    description: { type: String, required: false, default: "" },

    shippingAddress: {
      street: { type: String, required: false, default: "" },
      city: { type: String, required: false, default: "" },
      state: { type: String, required: false, default: "" },
      country: { type: String, required: false, default: "" },
      postalCode: { type: String, required: false, default: "" },
    },

    clientID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", RequestSchema);
