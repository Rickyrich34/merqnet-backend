const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// ✅ Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "secretkey", {
    expiresIn: "7d",
  });
};

// ✅ Password strength validation (backend enforcement)
function isStrongPassword(password) {
  const s = String(password || "");
  const hasMin = s.length >= 8;
  const hasUpper = /[A-Z]/.test(s);
  const hasLower = /[a-z]/.test(s);
  const hasNumber = /[0-9]/.test(s);
  const hasSymbol = /[^A-Za-z0-9]/.test(s);
  return hasMin && hasUpper && hasLower && hasNumber && hasSymbol;
}

// ============================
// ✅ REGISTER USER
// ============================
exports.registerUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      acceptsInternationalTrade,
      shippingAddresses,
      profileImage,
    } = req.body;

    // ✅ Enforce strong password on backend
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be 8+ chars and include uppercase, lowercase, a number, and a symbol.",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = await User.create({
      fullName,
      email,
      phone,
      password,
      acceptsInternationalTrade,
      shippingAddresses,
      profileImage,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: newUser,
      token: generateToken(newUser._id),
    });
  } catch (err) {
    console.error("Error registering user:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ============================
// ✅ LOGIN USER
// ============================
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    return res.status(200).json({
      message: "Login successful",
      userId: user._id,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
      },
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("Error logging in:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ============================
// ✅ GET PROFILE
// ============================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching profile:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ============================
// ✅ UPDATE PROFILE
// ============================
exports.updateProfile = async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updated,
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
