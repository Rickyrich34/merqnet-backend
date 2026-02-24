// routes/supportRoutes.js (CommonJS)

const express = require("express");
const router = express.Router();

const { sendSupportEmail } = require("../controllers/supportController.js"); 
// ⚠️ Ajusta el path si tu estructura es distinta

router.post("/", sendSupportEmail);

module.exports = router;
