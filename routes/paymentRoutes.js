const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

// All payment routes require auth
router.use(protect);

// Cards (MATCH FRONTEND)
router.get("/cards", paymentController.getCards);
router.post("/cards", paymentController.addCard);

// Frontend calls: PUT /api/payments/cards/default  body: { stripePaymentMethodId }
router.put("/cards/default", paymentController.setDefaultCard);

// Frontend calls: DELETE /api/payments/cards/:id   where :id is card._id
router.delete("/cards/:id", paymentController.deleteCard);

// Frontend calls: GET /api/payments/summary/:bidId
router.get("/summary/:bidId", paymentController.getSummary);

// Payment (Frontend calls: POST /api/payments/pay  body: { bidId })
router.post("/pay", paymentController.payNow);

module.exports = router;
