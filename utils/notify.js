const Notification = require("../models/Notification");

/**
 * Create an in-app notification.
 */
async function notifyInApp({ userId, title, message, type = "general", link = "", metadata = {} }) {
  if (!userId) return null;

  return Notification.create({
    userId,
    title,
    message,
    type,
    link,
    channel: "in_app",
    metadata,
  });
}

/**
 * Queue an SMS notification (does NOT send).
 * Later you can run a worker to send queued messages via Twilio.
 */
async function notifySmsQueued({
  userId,
  phone,
  title,
  message,
  type = "general",
  link = "",
  metadata = {},
}) {
  if (!userId || !phone) return null;

  return Notification.create({
    userId,
    title,
    message,
    type,
    link,
    channel: "sms",
    phone,
    smsStatus: "queued",
    metadata,
  });
}

module.exports = {
  notifyInApp,
  notifySmsQueued,
};
