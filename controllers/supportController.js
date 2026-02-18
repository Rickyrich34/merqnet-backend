// controllers/supportController.cjs
const nodemailer = require("nodemailer");

function isEmail(s = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim());
}

exports.sendSupportEmail = async (req, res) => {
  try {
    const {
      issueType = "",
      requestId = "",
      subject = "",
      message = "",
      email = "",
      username = "",
    } = req.body || {};

    // Validación mínima
    if (!issueType.trim()) return res.status(400).json({ ok: false, error: "issueType required" });
    if (!subject.trim()) return res.status(400).json({ ok: false, error: "subject required" });
    if (!message.trim()) return res.status(400).json({ ok: false, error: "message required" });
    if (!isEmail(email)) return res.status(400).json({ ok: false, error: "valid email required" });

    const to = process.env.SUPPORT_TO_EMAIL || "help@supportmerqnet.com";

    // Transport: SMTP (recomendado)
    // Usa tu buzón real (help@supportmerqnet.com) y su contraseña/app password.
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false, // true si usas 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const text = [
      `Issue Type: ${issueType}`,
      `Username: ${username || "(not provided)"}`,
      `Request ID: ${requestId || "(not provided)"}`,
      `From Email: ${email}`,
      "",
      "Message:",
      message,
      "",
      `Sent from: ${req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown"}`,
      `User-Agent: ${req.headers["user-agent"] || "unknown"}`,
    ].join("\n");

    const mailSubject = `[MerqNet Support] ${subject}`;

    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER, // ej: help@supportmerqnet.com
      to,
      replyTo: email, // para que al responder vaya al usuario
      subject: mailSubject,
      text,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("Support email error:", err);
    return res.status(500).json({ ok: false, error: "failed_to_send" });
  }
};
