const Notification = require("../models/Notification");

function getAuthUserId(req) {
  // Supports common patterns:
  // req.user._id (passport/jwt middleware)
  // req.userId (custom)
  // req.user.id
  const u = req.user || {};
  return String(u._id || u.id || req.userId || "");
}

exports.listMyNotifications = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const onlyUnread = String(req.query.unread || "").toLowerCase() === "true";

    const filter = { userId };
    if (onlyUnread) filter.isRead = false;

    const [items, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(filter),
    ]);

    res.json({
      page,
      limit,
      total,
      items,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load notifications" });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const count = await Notification.countDocuments({ userId, isRead: false });
    res.json({ unread: count });
  } catch (err) {
    res.status(500).json({ message: "Failed to load unread count" });
  }
};

exports.markOneRead = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;

    const updated = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: "Notification not found" });

    res.json({ notification: updated });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark as read" });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark all as read" });
  }
};

exports.deleteOne = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;

    const deleted = await Notification.findOneAndDelete({ _id: id, userId }).lean();
    if (!deleted) return res.status(404).json({ message: "Notification not found" });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete notification" });
  }
};
