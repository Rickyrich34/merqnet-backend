const express = require("express");
const router = express.Router();

const { sendSupportEmail } = require("../controllers/supportController");

router.post("/", sendSupportEmail);

module.exports = router;
