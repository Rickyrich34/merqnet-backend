const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true },
    condition: { type: String, enum: ["New", "Used"], required: true },

    // Size / Weight (opcional)
    sizeWeight: { type: String, required: false },

    // Estos sí pertenecen SOLO a productos
    description: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    wholeLotPrice: { type: Number, required: true },

    // FOTO DEL PRODUCTO
    productPhoto: {
      type: String,
      required: false,
      default: null,
    },

    // IDENTIDAD DEL DUEÑO DEL PRODUCTO
    clientID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// 🔥 FIX DEFINITIVO: usar colección separada para Products
module.exports = mongoose.model("Product", ProductSchema, "products");
