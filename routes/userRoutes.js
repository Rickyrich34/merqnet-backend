const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");

// PUBLIC
router.post("/register", registerUser);
router.post("/login", loginUser);

// PROTECTED
router.get("/:id", protect, getProfile);
router.put("/:id", protect, updateProfile);

module.exports = router;
