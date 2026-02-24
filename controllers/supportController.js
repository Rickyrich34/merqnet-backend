// controllers/supportController.js (CommonJS)
// Si tu proyecto usa .cjs, renómbralo a supportController.cjs y queda igual.

const { Resend } = require("resend");

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

    // ✅ Validación mínima (no rompe tu UI)
    if (!String(issueType).trim())
      return res.status(400).json({ ok: false, error: "issueType required" });

    if (!isEmail(email))
      return res.status(400).json({ ok: false, error: "valid email required" });

    if (!String(subject).trim())
      return res.status(400).json({ ok: false, error: "subject required" });

    if (!String(message).trim() || String(message).trim().length < 10)
      return res.status(400).json({ ok: false, error: "message too short" });

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ ok: false, error: "RESEND_API_KEY missing" });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // ✅ Soporte (fallback seguro)
    const supportTo = (process.env.SUPPORT_TO_EMAIL || "help@supportmerqnet.com").trim();

    // =========================
    // 1) EMAIL INTERNO A SOPORTE
    // =========================
    const internalSubject = `[MerqNet Support] ${String(subject).trim()}`;

    const internalText =
`Issue Type: ${String(issueType).trim()}
Username: ${String(username || "N/A").trim()}
Request ID: ${String(requestId || "N/A").trim()}
User Email: ${String(email).trim()}

Message:
${String(message).trim()}
`;

    await resend.emails.send({
      from: "MerqNet Support <onboarding@resend.dev>", // 🔥 hasta verificar dominio
      to: [supportTo],                                 // ✅ llega a soporte
      replyTo: String(email).trim(),                    // ✅ reply directo al usuario
      subject: internalSubject,
      text: internalText,
    });

    // ==========================
    // 2) EMAIL CONFIRMACIÓN USUARIO
    // ==========================
    const confirmationSubject = "We received your support request (MerqNet)";

    const confirmationText =
`Hi${username ? " " + String(username).trim() : ""},

Thanks for reaching out to MerqNet Support. We received your message and will reply as soon as possible.

Summary:
- Issue Type: ${String(issueType).trim()}
- Request ID: ${String(requestId || "N/A").trim()}
- Subject: ${String(subject).trim()}

For reference, here is the message we received:
${String(message).trim()}

If you need to add more details, just reply to this email.

— MerqNet Support
`;

    await resend.emails.send({
      from: "MerqNet Support <onboarding@resend.dev>", // 🔥 hasta verificar dominio
      to: [String(email).trim()],                      // ✅ llega al usuario
      replyTo: supportTo,                              // ✅ si el user responde, llega a soporte
      subject: confirmationSubject,
      text: confirmationText,
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
      error:
        err?.response?.data?.message ||
        err?.message ||
        "Failed to send support request",
    });
  }
};
