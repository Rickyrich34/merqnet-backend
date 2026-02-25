const express = require("express");
const router = express.Router();
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

router.post("/", async (req, res) => {
  try {
    const { issueType, requestId, subject, message, email, username } = req.body;

    const result = await resend.emails.send({
      from: "noreply@supportmerqnet.com",
      to: ["Rickyramz34@hotmail.com"],
      subject: `[${issueType}] ${subject}`,
      text: `User: ${username}\nEmail: ${email}\nRequest ID: ${requestId}\n\nMessage:\n${message}\n`,
      replyTo: email, // ✅ CORRECTO (no reply_to)
    });

    return res.json({ success: true, id: result?.id || null });
  } catch (error) {
    console.error("Support email error:", error);
    return res.status(500).json({ error: "Email failed" });
  }
});

module.exports = router;
