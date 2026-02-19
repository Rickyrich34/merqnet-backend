exports.sendSupportEmail = async (req, res) => {
  console.log("Support request received:", req.body);

  return res.json({ ok: true, message: "Test response working" });
};
