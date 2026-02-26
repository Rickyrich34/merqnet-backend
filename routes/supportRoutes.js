const express = require("express");
const router = express.Router();
const { Resend } = require("resend");
const Support = require("../models/Support");

const resend = new Resend(process.env.RESEND_API_KEY);

function isEmail(s = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim());
}

router.post("/", async (req, res) => {
  const startedAt = Date.now();

  try {
    const {
      issueType = "",
      requestId = "",
      subject = "",
      message = "",
      email = "",
      username = "",
    } = req.body || {};

    // ===== Validación mínima =====
    if (!String(issueType).trim())
      return res.status(400).json({ success: false, error: "issueType required" });

    if (!isEmail(email))
      return res.status(400).json({ success: false, error: "valid email required" });

    if (!String(subject).trim())
      return res.status(400).json({ success: false, error: "subject required" });

    if (!String(message).trim() || String(message).trim().length < 10)
      return res.status(400).json({ success: false, error: "message too short" });

    if (!process.env.RESEND_API_KEY)
      return res.status(500).json({ success: false, error: "RESEND_API_KEY missing" });

    const supportTo = (process.env.SUPPORT_TO_EMAIL || "help@supportmerqnet.com").trim();

    // ===== 1) Guardar en Mongo (NO BLOQUEA si falla) =====
    let saved = null;
    try {
      saved = await Support.create({
        issueType: String(issueType).trim(),
        requestId: String(requestId).trim(),
        subject: String(subject).trim(),
        message: String(message).trim(),
        email: String(email).trim(),
        username: String(username).trim(),
      });
    } catch (dbErr) {
      console.error("Support DB save failed (continuing):", dbErr?.message || dbErr);
      // seguimos, NO devolvemos 500 por esto
    }

    // ===== 2) Email interno a soporte =====
    const internalSubject = `MerqNet Support • [${String(issueType).trim()}] ${String(subject).trim()}`;

    const internalText =
      `User: ${String(username || "N/A").trim()}\n` +
      `Email: ${String(email).trim()}\n` +
      `Request ID: ${String(requestId || "N/A").trim()}\n` +
      (saved?._id ? `Ticket ID: ${saved._id}\n` : "") +
      `\nMessage:\n${String(message).trim()}\n`;

    const internalSend = await resend.emails.send({
      from: "MerqNet Support <noreply@supportmerqnet.com>",
      to: [supportTo],
      replyTo: String(email).trim(),
      subject: internalSubject,
      text: internalText,
    });

    const id =
      internalSend?.id ||
      internalSend?.data?.id ||
      (Array.isArray(internalSend?.data) ? internalSend.data[0]?.id : null) ||
      null;

    // ===== 3) Confirmación al usuario (NO BLOQUEA si falla) =====
    try {
      const confirmationSubject = "We received your support request (MerqNet)";
      const confirmationText =
        `Hi${username ? " " + String(username).trim() : ""},\n\n` +
        `Thanks for reaching out to MerqNet Support. We received your message and will reply as soon as possible.\n\n` +
        `Summary:\n` +
        `- Issue Type: ${String(issueType).trim()}\n` +
        `- Request ID: ${String(requestId || "N/A").trim()}\n` +
        `- Subject: ${String(subject).trim()}\n` +
        (saved?._id ? `- Ticket ID: ${saved._id}\n` : "") +
        `\nIf you need to add more details, just reply to this email.\n\n` +
        `— MerqNet Support\n`;

      await resend.emails.send({
        from: "MerqNet Support <noreply@supportmerqnet.com>",
        to: [String(email).trim()],
        replyTo: supportTo,
        subject: confirmationSubject,
        text: confirmationText,
      });
    } catch (confirmErr) {
      console.error("Support confirmation email failed (continuing):", confirmErr?.message || confirmErr);
    }

    return res.status(200).json({
      success: true,
      id,
      ticketId: saved?._id || null,
      ms: Date.now() - startedAt,
    });
  } catch (error) {
    console.error("Support route error:", error);
    return res.status(500).json({ success: false, error: "Email failed" });
  }
});

module.exports = router;