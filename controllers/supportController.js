const { Resend } = require("resend");

exports.sendSupportEmail = async (req, res) => {
  try {
    const {
      issueType,
      requestId,
      subject,
      message,
      email,
      username,
    } = req.body;

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: "RESEND_API_KEY missing",
      });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "MerqNet Support <onboarding@resend.dev>", // 🔥 usa esto hasta verificar dominio
      to: [process.env.SUPPORT_TO_EMAIL],
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
    });

    return res.status(200).json({
      ok: true,
      message: "Support request sent successfully",
    });
  } catch (err) {
    console.error("Resend error:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to send support request",
    });
  }
};
