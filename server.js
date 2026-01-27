require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;

/* ================================
   CORS CONFIG (PRODUCTION SAFE)
================================ */

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://merqnet-frontend-production.up.railway.app"
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow server-to-server or Postman
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("❌ Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* ================================
   MIDDLEWARES
================================ */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================================
   ROUTES
================================ */

// Example:
// app.use("/api/users", require("./routes/users"));
// app.use("/api/payments", require("./routes/payments"));
// app.use("/api/bids", require("./routes/bids"));
// app.use("/api/requests", require("./routes/requests"));

/* ================================
   DATABASE
================================ */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err.message));

/* ================================
   HEALTH CHECK
================================ */

app.get("/", (req, res) => {
  res.json({ status: "OK", service: "MerqNet Backend" });
});

/* ================================
   ERROR HANDLER (CORS + API)
================================ */

app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.message);
  res.status(500).json({
    error: err.message || "Internal Server Error"
  });
});

/* ================================
   START SERVER
================================ */

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("🌍 Allowed origins:");
  allowedOrigins.forEach((o) => console.log("   -", o));
});
