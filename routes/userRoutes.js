const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
} = require("../controllers/userController");

// ✅ REGISTER
router.post("/register", registerUser);

// ✅ LOGIN
router.post("/login", loginUser);

// ✅ GET PROFILE (PROTECTED)
router.get("/profile/:id", getProfile);

// ✅ UPDATE PROFILE (PROTECTED)
router.put("/profile/:id", updateProfile);

module.exports = router;
