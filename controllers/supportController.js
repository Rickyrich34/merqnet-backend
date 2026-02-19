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

    // Validaciones básicas
    if (!issueType.trim())
      return res.status(400).json({ ok: false, error: "Issue type required" });

    if (!subject.trim())
      return res.status(400).json({ ok: false, error: "Subject required" });

    if (!message.trim())
      return res.status(400).json({ ok: false, error: "Message required" });

    if (!isEmail(email))
      return res.status(400).json({ ok: false, error: "Valid email required" });

    // Transport seguro
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10000, // 🔥 evita colgado infinito
    });

    const mailOptions = {
      from: `"MerqNet Support" <${process.env.SMTP_USER}>`,
      to: process.env.SUPPORT_TO_EMAIL || process.env.SMTP_USER,
      replyTo: email,
      subject: `[MerqNet Support] ${subject}`,
      text: `
Issue Type: ${issueType}
Username: ${username || "N/A"}
Request ID: ${requestId || "N/A"}
Email: ${email}

Message:
${message}
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      ok: true,
      message: "Support request sent successfully",
    });
  } catch (err) {
    console.error("Support email error:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to send support request",
    });
  }
};
