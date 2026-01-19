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

// Payment (Pay Now)
router.post("/pay", paymentController.payNow);

module.exports = router;
