const Message = require("../models/Message");
const User = require("../models/User");

// --------------------------------------------------
// CREATE MESSAGE
// --------------------------------------------------
exports.createMessage = async (req, res) => {
  try {
    const { requestId, buyerId, sellerId, sender, recipient, text, isSystem } =
      req.body;

    const message = new Message({
      requestId,
      buyerId,
      sellerId,
      sender,
      recipient,
      text,
      isSystem: isSystem || false,
    });

    await message.save();

    res.status(201).json({ message: "Message created", data: message });
  } catch (err) {
    console.error("Error creating message:", err);
    res.status(500).json({ error: "Server error creating message" });
  }
};

// --------------------------------------------------
// GET ALL MESSAGES FOR USER
// --------------------------------------------------
exports.getMessagesForUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }],
    })
      .populate("sender", "fullName email")
      .populate("recipient", "fullName email")
      .populate("buyerId", "fullName email")
      .populate("sellerId", "fullName email")
      .populate("requestId", "productName");

    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Server error fetching messages" });
  }
};

// --------------------------------------------------
// MARK MESSAGE AS READ
// --------------------------------------------------
exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { read: true },
      { new: true }
    );

    res.json(message);
  } catch (err) {
    console.error("Error marking message read:", err);
    res.status(500).json({ error: "Server error marking as read" });
  }
};

// --------------------------------------------------
// ⭐ MARK ALL MESSAGES AS READ (WHEN LEAVING /messages)
// --------------------------------------------------
exports.markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    await Message.updateMany(
      {
        recipient: userId,   // only messages addressed to the user
        read: false,
      },
      {
        $set: { read: true },
      }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Error marking all messages read:", err);
    res.status(500).json({ error: "Server error marking all as read" });
  }
};

// --------------------------------------------------
// GET MESSAGE THREADS — FIXED VERSION (INBOX)
// --------------------------------------------------
exports.getMessageThreads = async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [{ buyerId: userId }, { sellerId: userId }],
    })
      .populate("requestId", "productName category")
      .populate("buyerId", "fullName email")
      .populate("sellerId", "fullName email")
      .populate("sender", "fullName email")
      .populate("recipient", "fullName email");

    const threadMap = {};

    for (const msg of messages) {
      const reqId = msg.requestId?._id?.toString();
      if (!reqId) continue;

      if (!threadMap[reqId]) {
        threadMap[reqId] = {
          requestId: reqId,
          productName: msg.requestId.productName,
          buyerId: msg.buyerId?._id,
          sellerId: msg.sellerId?._id,
          sender: null,
          recipient: null,
          lastMessage: "",
          lastDate: null,
          unread: 0,
        };
      }

      if (
        !threadMap[reqId].lastDate ||
        msg.createdAt > threadMap[reqId].lastDate
      ) {
        threadMap[reqId].lastMessage = msg.text;
        threadMap[reqId].lastDate = msg.createdAt;
        threadMap[reqId].sender = msg.sender;
        threadMap[reqId].recipient = msg.recipient;
      }

      if (
        msg.recipient?._id?.toString() === userId.toString() &&
        msg.read === false
      ) {
        threadMap[reqId].unread++;
      }
    }

    return res.json(Object.values(threadMap));
  } catch (err) {
    console.error("Error loading threads:", err);
    res.status(500).json({ error: "Server error loading threads" });
  }
};
