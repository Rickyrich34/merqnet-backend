const express = require("express");
const router = express.Router();

const {
  listMyNotifications,
  getUnreadCount,
  markOneRead,
  markAllRead,
  deleteOne,
} = require("../controllers/notificationController");

// ✅ IMPORT CORRECTO (named export)
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", listMyNotifications);
router.get("/unread-count", getUnreadCount);

router.patch("/:id/read", markOneRead);
router.patch("/read-all", markAllRead);

router.delete("/:id", deleteOne);

module.exports = router;
