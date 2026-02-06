require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// ✅ NEW: Stripe webhook handler lives in paymentController (no new webhookRoutes file)
const paymentController = require("./controllers/paymentController");

const app = express();
const PORT = process.env.PORT || 5000;

// Railway proxy support (safe for cookies / headers / https behind proxy)
app.set("trust proxy", 1);

/**
 * CORS
 * - Allows localhost dev (5173/3000)
 * - Allows your Railway frontend domain(s)
 * - Allows custom domains
 * - Echoes the request Origin (so credentials can work)
 *
 * Env options supported:
 * - FRONTEND_URL (single origin)
 * - CORS_ORIGIN  (single origin)
 * - CORS_ORIGINS (comma-separated origins)
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
  ...fromList,

  // Local dev
  "http://localhost:5173",
  "http://localhost:3000",

  // Your known domains (adjust if needed)
  "https://merqnet-frontend-production.up.railway.app",
  "https://app.merqnet.com",
  "https://merqnet.com",
  "https://www.merqnet.com",
].filter(Boolean);

function isRailwayDomain(origin) {
  try {
    const u = new URL(origin);
    return u.protocol === "https:" && u.hostname.endsWith(".up.railway.app");
  } catch {
    return false;
  }
}

// IMPORTANT: CORS must run before routes
const corsOptions = {
  origin: (origin, cb) => {
    // Non-browser requests (curl/postman/server-to-server)
    if (!origin) return cb(null, true);

    const clean = normalizeOrigin(origin);

    // Allow listed origins + any Railway domain
    if (allowedOrigins.includes(clean) || isRailwayDomain(clean)) {
      return cb(null, true);
    }

    // Instead of throwing (which can remove headers),
    // we hard-deny with false.
    return cb(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Stripe-Signature"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Preflight (USE SAME OPTIONS - do NOT use cors() default here)
app.options("*", cors(corsOptions));

/**
 * ✅ STRIPE WEBHOOK
 * MUST be raw body so Stripe signature verification works.
 * This must be defined BEFORE express.json().
 */
app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  paymentController.stripeWebhook

  // Stripe webhook disabled (not required)

);



// Body parsing (for all other routes)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Mongo (support both var names)
const MONGO_URI =
  process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL;

if (!MONGO_URI) {
  console.error(
    "❌ Missing Mongo connection string. Set MONGODB_URI (or MONGO_URI)."
  );
} else {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));
}

// ROUTES — keep existing
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

// ROOT TEST
app.get("/", (req, res) => {
  res.send("MerqNet API is running.");
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
