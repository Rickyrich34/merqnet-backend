// backend/routes/productRoutes.js
const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");

// Rutas oficiales de productos MerqNet
router.post("/", productController.createProduct);      // <-- FIX
router.get("/", productController.getProducts);         // <-- FIX
router.get("/:id", productController.getProductById);   // <-- FIX
router.delete("/:id", productController.deleteProduct); // <-- FIX

module.exports = router;
