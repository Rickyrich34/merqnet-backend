const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const bidController = require("../controllers/bidController");

// CREATE bid (seller)
router.post("/request/:requestId", protect, bidController.createBid);

// GET bids for request (buyer)
router.get("/request/:requestId", protect, bidController.getBidsByRequest);

// ✅ GET single bid (buyer) - for payment page
router.get("/:bidId", protect, bidController.getBidById);

// ACCEPT bid (buyer)
router.put("/:bidId/accept", protect, bidController.acceptBid);

module.exports = router;
