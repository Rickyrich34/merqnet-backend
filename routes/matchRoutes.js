// routes/matchRoutes.js
const express = require("express");
const router = express.Router();
const matchController = require("../controllers/matchController");

// ✅ Obtener matches inteligentes por SCORE
// (mejores primero: categoría, condición, cantidad, nombre)
router.get("/seller/:sellerId", matchController.getMatches);

// ✅ Ruta clásica de verificación (FULL y PARTIAL)
// (se conserva para no romper frontend viejo)
router.post("/check", async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const Product = require("../models/Product");
    const Request = require("../models/Request");

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const requests = await Request.find();

    let fullMatches = [];
    let partialMatches = [];

    for (const reqItem of requests) {
      const sameCategory =
        product.category?.trim().toLowerCase() ===
        reqItem.category?.trim().toLowerCase();

      const sameCondition =
        product.condition?.trim().toLowerCase() ===
        reqItem.condition?.trim().toLowerCase();

      if (sameCategory && sameCondition) {
        if (product.quantity >= reqItem.quantity) {
          fullMatches.push({
            matchType: "FULL",
            productId: product._id,
            requestId: reqItem._id,
            buyerName: reqItem.buyerName,
            buyerLocation: reqItem.buyerLocation,
            buyerRating: reqItem.buyerRating || "N/A",
            requestedQuantity: reqItem.quantity,
            sellerQuantity: product.quantity,
            brand: product.brand,
            condition: product.condition,
          });
        } else {
          partialMatches.push({
            matchType: "PARTIAL",
            productId: product._id,
            requestId: reqItem._id,
            buyerName: reqItem.buyerName,
            buyerLocation: reqItem.buyerLocation,
            buyerRating: reqItem.buyerRating || "N/A",
            requestedQuantity: reqItem.quantity,
            sellerQuantity: product.quantity,
            brand: product.brand,
            condition: product.condition,
          });
        }
      }
    }

    return res.status(200).json({
      productId,
      fullMatches,
      partialMatches,
    });
  } catch (error) {
    console.error("🔥 Match Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
