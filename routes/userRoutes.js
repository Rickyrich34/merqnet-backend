const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

// PUBLIC
router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);

// PROTECTED
router.get("/profile/:id", protect, userController.getProfile);
router.put("/profile/:id", protect, userController.updateProfile);

module.exports = router;
