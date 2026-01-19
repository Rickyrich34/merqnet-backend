const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Display
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    type: {
      type: String,
      default: "general",
      trim: true,
      maxlength: 50,
      index: true,
    },

    // Optional deep link inside the app
    link: { type: String, default: "", trim: true, maxlength: 200 },

    // Read state
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },

    // Channels: keep SMS-ready info here, but do not send yet
    channel: {
      type: String,
      enum: ["in_app", "sms"],
      default: "in_app",
      index: true,
    },
    phone: { type: String, default: "", trim: true, maxlength: 30 },

    smsStatus: {
      type: String,
      enum: ["", "queued", "sent", "failed"],
      default: "",
      index: true,
    },
    smsError: { type: String, default: "", trim: true, maxlength: 300 },

    // Useful for debugging / filters
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);
