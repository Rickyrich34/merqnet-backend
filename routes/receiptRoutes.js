const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const receiptController = require("../controllers/receiptController");

/* ================= SAFETY CHECK ================= */

function safe(fn) {
  if (typeof fn !== "function") {
    return (req, res) =>
      res.status(500).json({ message: "Route handler missing" });
  }
  return fn;
}

/* ================= ROUTES ================= */

// Buyer receipts
router.get(
  "/buyer",
  protect,
  safe(receiptController.getBuyerReceipts)
);

// Seller receipts
router.get(
  "/seller",
  protect,
  safe(receiptController.getSellerReceipts)
);

// Mark all
router.put(
  "/mark-all",
  protect,
  safe(receiptController.markAllViewed)
);

// Mark viewed aliases
router.put(
  "/mark-viewed/buyer",
  protect,
  safe(receiptController.markViewedBuyerAll)
);

router.put(
  "/mark-viewed/seller",
  protect,
  safe(receiptController.markViewedSellerAll)
);

router.put(
  "/markViewed/buyer",
  protect,
  safe(receiptController.markViewedBuyerAll)
);

router.put(
  "/markViewed/seller",
  protect,
  safe(receiptController.markViewedSellerAll)
);

// ✅ CREATE (RESTORED — FUNCTION EXISTS)
router.post(
  "/create",
  protect,
  safe(receiptController.createReceipt)
);

// Complete
router.patch(
  "/:id/complete",
  protect,
  safe(receiptController.completeReceipt)
);

// Rate
router.post(
  "/:id/rate",
  protect,
  safe(receiptController.rateReceipt)
);

// Get one
router.get(
  "/:id",
  protect,
  safe(receiptController.getReceipt)
);

// Mark viewed single
router.put(
  "/:id/viewed",
  protect,
  safe(receiptController.markViewed)
);

module.exports = router;
