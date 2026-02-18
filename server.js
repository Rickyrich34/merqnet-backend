require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const supportRoutes = require("./routes/supportRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

/* ===============================
   BASIC SETUP
================================ */

app.set("trust proxy", 1);

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/api/support", supportRoutes);

/* ===============================
   MONGO
================================ */

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  process.env.MONGO_URL;

if (!MONGO_URI) {
  console.error("❌ Missing Mongo connection string");
} else {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("✅ Mongo connected"))
    .catch((err) => console.error("❌ Mongo error:", err));
}

/* ===============================
   DEBUG ROUTE LOADING
================================ */

console.log("🚀 SERVER STARTING...");
console.log("📦 LOADING ROUTES...");

/* ===============================
   ROUTES (WITH LOGGING)
================================ */

try {
  console.log("➡️ users");
  app.use("/api/users", require("./routes/userRoutes"));
} catch (e) {
  console.error("❌ users route failed:", e);
}

try {
  console.log("➡️ products");
  app.use("/api/products", require("./routes/productRoutes"));
} catch (e) {
  console.error("❌ products route failed:", e);
}

try {
  console.log("➡️ profile");
  app.use("/api/profile", require("./routes/profileRoutes"));
} catch (e) {
  console.error("❌ profile route failed:", e);
}

try {
  console.log("➡️ requests");
  app.use("/api/requests", require("./routes/requestRoutes"));
} catch (e) {
  console.error("❌ requests route failed:", e);
}

try {
  console.log("➡️ bids");
  app.use("/api/bids", require("./routes/bidRoutes"));
} catch (e) {
  console.error("❌ bids route failed:", e);
}

try {
  console.log("➡️ payments");
  app.use("/api/payments", require("./routes/paymentRoutes"));
} catch (e) {
  console.error("❌ payments route failed:", e);
}

try {
  console.log("➡️ receipts");
  app.use("/api/receipts", require("./routes/receiptRoutes"));
} catch (e) {
  console.error("❌ receipts route failed:", e);
}

try {
  console.log("➡️ dashboard");
  app.use("/api/dashboard", require("./routes/dashboardRoutes"));
} catch (e) {
  console.error("❌ dashboard route failed:", e);
}

try {
  console.log("➡️ matches");
  app.use("/api/matches", require("./routes/matchRoutes"));
} catch (e) {
  console.error("❌ matches route failed:", e);
}

try {
  console.log("➡️ messages");
  app.use("/api/messages", require("./routes/messageRoutes"));
} catch (e) {
  console.error("❌ messages route failed:", e);
}

try {
  console.log("➡️ notifications");
  app.use("/api/notifications", require("./routes/notificationRoutes"));
} catch (e) {
  console.error("❌ notifications route failed:", e);
}

/* ===============================
   TEST + FALLBACK
================================ */

app.get("/", (req, res) => {
  res.send("MerqNet API is running.");
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* ===============================
   START SERVER
================================ */

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
