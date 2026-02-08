const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

// All routes require auth
router.use(protect);

/* =========================
   CARDS
========================= */

router.get("/cards", paymentController.getCards);
router.post("/cards", paymentController.addCard);
router.delete("/cards/:cardId", paymentController.deleteCard);

/* =========================
   STRIPE CONNECT (PAYOUT / SELLER ONBOARDING)
========================= */

router.post("/connect/onboarding", paymentController.startOnboarding);

/* =========================
   PAYMENT INTENT (MODERN FLOW)
========================= */

router.post("/create-payment-intent", paymentController.createPaymentIntent);

router.post("/complete-payment", paymentController.completePaymentIntent);

module.exports = router;
