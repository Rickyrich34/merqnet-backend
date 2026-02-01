const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

// Everything below requires auth
router.use(protect);

// Cards CRUD
router.get("/cards", paymentController.getCards);
router.post("/cards", paymentController.addCard);
router.delete("/cards/:cardId", paymentController.deleteCard);
router.patch("/cards/:cardId/default", paymentController.setDefaultCard);

// Legacy Payment (kept for backward compatibility)
router.post("/pay", paymentController.payNow);

// ✅ NEW: PaymentIntent checkout (Apple Pay / Google Pay / etc.)
router.post("/create-payment-intent", paymentController.createPaymentIntent);

// ✅ NEW: Seller Connect onboarding
router.post("/connect/onboarding", paymentController.createConnectOnboardingLink);

module.exports = router;
