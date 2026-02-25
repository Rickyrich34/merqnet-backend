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
      text:
        `User: ${username}\n` +
        `Email: ${email}\n` +
        `Request ID: ${requestId}\n\n` +
        `Message:\n${message}\n`,
      replyTo: email,
    });

    // Resend SDK puede devolver el id en diferentes shapes según versión
    const id =
      result?.id ||
      result?.data?.id ||
      (Array.isArray(result?.data) ? result.data[0]?.id : null) ||
      null;

    return res.json({ success: true, id });
  } catch (error) {
    console.error("Support email error:", error);
    return res.status(500).json({ error: "Email failed" });
  }
});

module.exports = router;