const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const receiptController = require("../controllers/receiptController");

/* ================= SAFETY ================= */

function safe(fn) {
  if (typeof fn !== "function") {
    return (req, res) =>
      res.status(500).json({ message: "Route handler missing" });
  }
  return fn;
}

/* ================= ROUTES ================= */

// Buyer
router.get(
  "/buyer",
  protect,
  safe(receiptController.getBuyerReceipts)
);

// Seller
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

// Mark viewed
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

// Complete
router.patch(
  "/:id/complete",
  protect,
  safe(receiptController.completeReceipt)
);

module.exports = router;
