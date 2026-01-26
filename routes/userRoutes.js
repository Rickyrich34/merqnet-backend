// backend/routes/userRoutes.js
const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");

// Public
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected (frontend already sends Bearer token)
router.get("/profile/:id", protect, getProfile);
router.put("/profile/:id", protect, updateProfile);

module.exports = router;
