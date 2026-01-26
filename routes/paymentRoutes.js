// ===============================
// backend/routes/paymentRoutes.js
// ===============================
const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

// Cards
router.get("/cards", protect, paymentController.getCards);
router.post("/cards", protect, paymentController.addCard);
router.put("/cards/default", protect, paymentController.setDefaultCard);
router.delete("/cards/:id", protect, paymentController.deleteCard);

// Summary
router.get("/summary/:bidId", protect, paymentController.getSummary);

// Pay
router.post("/pay", protect, paymentController.payNow);

module.exports = router;
