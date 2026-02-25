const express = require("express");
const router = express.Router();
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

router.post("/", async (req, res) => {
  try {
    const { issueType, requestId, subject, message, email, username } = req.body;

    const result = await resend.emails.send({
      // Nombre corto visible en móvil + email real del dominio
      from: "MerqNet Support <noreply@supportmerqnet.com>",
      to: ["Rickyramz34@hotmail.com"],
      subject: `MerqNet Support • [${issueType}] ${subject}`,
      text:
        `User: ${username}\n` +
        `Email: ${email}\n` +
        `Request ID: ${requestId}\n\n` +
        `Message:\n${message}\n`,
      replyTo: email, // correcto para que al responder vaya al email del usuario
    });

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