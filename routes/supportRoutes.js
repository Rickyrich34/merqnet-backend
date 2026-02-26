const express = require("express");
const router = express.Router();
const { Resend } = require("resend");
const Support = require("../models/Support");

const resend = new Resend(process.env.RESEND_API_KEY);

router.post("/", async (req, res) => {
  try {
    const { issueType, requestId, subject, message, email, username } = req.body;

    // 1️⃣ Guardar en Mongo
    const saved = await Support.create({
      issueType,
      requestId,
      subject,
      message,
      email,
      username,
    });

    // 2️⃣ Enviar email
    const result = await resend.emails.send({
      from: "MerqNet Support <noreply@supportmerqnet.com>",
      to: [process.env.SUPPORT_TO_EMAIL], // 🔥 ya no hardcode
      subject: `MerqNet Support • [${issueType}] ${subject}`,
      text:
        `User: ${username}\n` +
        `Email: ${email}\n` +
        `Request ID: ${requestId}\n\n` +
        `Message:\n${message}\n`,
      replyTo: email,
    });

    const id = result?.id || null;

    return res.json({
      success: true,
      id,
      ticketId: saved._id,
    });

  } catch (error) {
    console.error("Support email error:", error);
    return res.status(500).json({ error: "Email failed" });
  }
});

module.exports = router;