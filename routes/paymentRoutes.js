const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

// Everything below requires auth
router.use(protect);

/* ===============================
   PAYMENTS
================================ */

// Legacy Payment
router.post("/pay", paymentController.payNow);

// Stripe PaymentIntent
router.post(
  "/create-payment-intent",
  paymentController.createPaymentIntent
);

// Complete PaymentIntent
router.post(
  "/complete-payment-intent",
  paymentController.completePaymentIntent
);

module.exports = router;
