// backend/controllers/dashboardController.js
const Bid = require("../models/Bid");
const Request = require("../models/Request");

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // buyer perspective: requests owned
    const activeRequests = await Request.countDocuments({ clientID: userId });

    // seller perspective: bids made by seller (not necessarily “live”, but real count)
    const myLiveBids = await Bid.countDocuments({ sellerId: userId, accepted: false });

    return res.json({
      liveBids: myLiveBids,
      activeRequests,
    });
  } catch (err) {
    console.error("getDashboard error:", err);
    return res.status(500).json({ message: "Server error loading dashboard" });
  }
};
