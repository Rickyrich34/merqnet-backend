console.log("RESEND KEY EXISTS:", !!process.env.RESEND_API_KEY);

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
  console.error("Resend FULL error:", err);
  console.error("Resend RESPONSE:", err?.response?.data);
  console.error("Resend MESSAGE:", err?.message);

  return res.status(500).json({
    ok: false,
    error: err?.response?.data?.message || err?.message || "Failed to send support request",
  });
}

};
