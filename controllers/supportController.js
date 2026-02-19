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

    // =========================
    // Basic validation
    // =========================
    if (!issueType.trim()) {
      return res.status(400).json({
        ok: false,
        error: "Issue type is required",
      });
    }

    if (!subject.trim()) {
      return res.status(400).json({
        ok: false,
        error: "Subject is required",
      });
    }

    if (!message.trim()) {
      return res.status(400).json({
        ok: false,
        error: "Message is required",
      });
    }

    if (!isEmail(email)) {
      return res.status(400).json({
        ok: false,
        error: "Valid email is required",
      });
    }

    // =========================
    // Ensure required ENV vars
    // =========================
    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS
    ) {
      console.error("Missing SMTP environment variables");
      return res.status(500).json({
        ok: false,
        error: "Email service not configured",
      });
    }

    // =========================
    // Create transport
    // =========================
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // 🔥 REQUIRED
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // true only if using 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10000, // prevent infinite hang
    });

    // =========================
    // Email content
    // =========================
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

    // =========================
    // Send email
    // =========================
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
