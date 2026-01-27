require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * CORS (Railway + Custom Domains)
 *
 * Supports:
 * - FRONTEND_URL (single origin)
 * - CORS_ORIGIN  (single origin)
 * - CORS_ORIGINS (comma-separated list)
 *
 * Allows Railway preview domains: https://*.up.railway.app
 */

function normalizeOrigin(o) {
  if (!o || typeof o !== "string") return "";
  return o.trim().replace(/\/$/, "");
}

const fromSingle =
  normalizeOrigin(process.env.FRONTEND_URL) ||
  normalizeOrigin(process.env.CORS_ORIGIN);

const fromList = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

const allowedOrigins = [
  fromSingle,
  ...fromList, // ✅ FIX REAL (spread)

  // local dev
  "http://localhost:5173",
  "http://localhost:3000",

  // production domains
  "https://app.merqnet.com",
  "https://merqnet.com",
  "https://www.merqnet.com",
].filter(Boolean);

function isRailwayFrontend(origin) {
  try {
    const u = new URL(origin);
    return u.protocol === "https:" && u.hostname.endsWith(".up.railway.app");
  } catch {
    return false;
  }
}

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const clean = normalizeOrigin(origin);

    if (allowedOrigins.includes(clean)) return callback(null, true);
    if (isRailwayFrontend(clean)) return callback(null, true);

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204,
};

// CORS first
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Railway proxy
app.set("trust proxy", 1);

// Mongo
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes (no tocadas)
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"));
app.use("/api/requests", require("./routes/requestRoutes"));
app.use("/api/bids", require("./routes/bidRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/receipts", require("./routes/receiptRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/matches", require("./routes/matchRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

// Root test
app.get("/", (req, res) => {
  res.send("MerqNet API is running.");
});

// CORS error visibility
app.use((err, req, res, next) => {
  if (err && String(err.message || "").toLowerCase().includes("cors")) {
    return res.status(403).json({ error: err.message });
  }
  return next(err);
});

// Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("✅ Allowed Origins:", allowedOrigins);
});
