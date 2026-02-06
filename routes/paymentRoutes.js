const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

// Everything below requires auth
router.use(protect);

// Cards
router.get("/cards", paymentController.getCards);
router.post("/cards", paymentController.addCard);
router.delete("/cards/:cardId", paymentController.deleteCard);
router.patch("/cards/:cardId/default", paymentController.setDefaultCard);

// Legacy pay
router.post("/pay", paymentController.payNow);

// Payment Intent
router.post(
  "/create-payment-intent",
  paymentController.createPaymentIntent
);

// Stripe Connect
router.post(
  "/connect/onboarding",
  paymentController.createConnectOnboardingLink
);

module.exports = router;
