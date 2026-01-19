const express = require("express");
const router = express.Router();

const {
  createMessage,
  getMessagesForUser,
  markAsRead,
  getMessageThreads,
  markAllAsRead,   // <-- ADD THIS
} = require("../controllers/messageController");

const Message = require("../models/Message");


// -------------------------------------------------------------
// BUYER → ASK THE SELLER  (KEEPING EXACTLY AS YOU SENT IT)
// -------------------------------------------------------------
router.post("/ask", async (req, res) => {
  try {
    const { requestId, buyerId, sellerId, text } = req.body;

    if (!requestId || !buyerId || !sellerId || !text) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newMessage = await Message.create({
      requestId,
      buyerId,
      sellerId,
      sender: buyerId,       // ✔ BUYER sends the message
      recipient: sellerId,   // ✔ SELLER receives
      text,
      isSystem: false,
      read: false,
    });

    res.status(201).json({
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (err) {
    console.error("Error sending Ask message:", err);
    res.status(500).json({ error: "Server error sending Ask message" });
  }
});


// -------------------------------------------------------------
// GENERAL MESSAGE CREATION (KEEP AS IS)
// -------------------------------------------------------------
router.post("/", createMessage);


// -------------------------------------------------------------
// GET ALL MESSAGES FOR A SPECIFIC USER (KEEP AS IS)
// -------------------------------------------------------------
router.get("/user/:userId", getMessagesForUser);


// -------------------------------------------------------------
// GET THREADS (KEEP AS IS)
// -------------------------------------------------------------
router.get("/threads/:userId", getMessageThreads);


// -------------------------------------------------------------
// MARK ONE MESSAGE AS READ (KEEP AS IS)
// -------------------------------------------------------------
router.patch("/mark-read/:messageId", markAsRead);


// -------------------------------------------------------------
// ⭐ FIX: MARK ALL MESSAGES AS READ WHEN USER LEAVES /messages
// -------------------------------------------------------------
router.put("/mark-all-read/:userId", markAllAsRead);


// -------------------------------------------------------------
module.exports = router;
