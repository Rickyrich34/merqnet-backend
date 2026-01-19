// backend/routes/receiptRoutes.js
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const receiptController = require("../controllers/receiptController");

// Buyer receipts (supports ?unviewed=true and ?limit=1)
router.get("/buyer", protect, receiptController.getBuyerReceipts);

// Seller receipts (supports ?unviewed=true and ?limit=1)
router.get("/seller", protect, receiptController.getSellerReceipts);

// These are used by your frontend (History + Dashboard clear)
router.put("/mark-all", protect, receiptController.markAllViewed);
router.put("/mark-viewed/buyer", protect, receiptController.markViewedBuyerAll);
router.put("/mark-viewed/seller", protect, receiptController.markViewedSellerAll);

// Backwards-compat aliases (your frontend calls these too)
router.put("/markViewed/buyer", protect, receiptController.markViewedBuyerAll);
router.put("/markViewed/seller", protect, receiptController.markViewedSellerAll);

// MUST be before "/:id"
router.patch("/:id/complete", protect, receiptController.completeReceipt);
router.post("/:id/rate", protect, receiptController.rateReceipt);

// Get ONE receipt by either Mongo _id OR receiptId
router.get("/:id", protect, receiptController.getReceipt);

// Mark receipt viewed (single)
router.put("/:id/viewed", protect, receiptController.markViewed);

module.exports = router;
