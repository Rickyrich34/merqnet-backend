const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

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

    await resend.emails.send({
      from: "MerqNet Support <support@merqnet.com>",
      to: process.env.SUPPORT_TO_EMAIL,
      reply_to: email,
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
