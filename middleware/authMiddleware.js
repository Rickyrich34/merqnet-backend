// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const token = authHeader.split(" ")[1];

    // ✅ IMPORTANT: Must match the same fallback used in userController.generateToken
    const jwtSecret = process.env.JWT_SECRET || "secretkey";

    const decoded = jwt.verify(token, jwtSecret);

    const user = await User.findById(decoded.id).select(
      "_id email cards stripeCustomerId"
    );

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = { id: user._id };
    req.userDoc = user;

    next();
  } catch (err) {
    console.error("AUTH ERROR:", err.message);
    return res.status(401).json({ message: "Token failed" });
  }
};

module.exports = { protect };
