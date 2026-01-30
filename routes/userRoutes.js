const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

// All payment routes require auth
router.use(protect);

// Cards CRUD
router.get("/cards", paymentController.getCards);
router.post("/cards", paymentController.addCard);
router.delete("/cards/:cardId", paymentController.deleteCard);
router.patch("/cards/:cardId/default", paymentController.setDefaultCard);

// ✅ NEW: PaymentIntent flow (Apple Pay / Google Pay / PayPal buttons via Elements on frontend)
router.post("/intent", paymentController.createPaymentIntent);

// ✅ NEW: Seller onboarding for Stripe Connect (so you can pay sellers + take 8%)
router.post("/connect/onboard", paymentController.createConnectOnboardingLink);

// Legacy Payment (Pay Now) — keep for now so nothing breaks
router.post("/pay", paymentController.payNow);

module.exports = router;
