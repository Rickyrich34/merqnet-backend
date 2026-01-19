require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;

// MIDDLEWARES
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// MONGO
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));


// ROUTES — ALL YOUR EXISTING FUNCTIONAL ROUTES
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

// 🚫 REMOVED: messageRoutes (NO messaging system active)
// app.use("/api/messages", require("./routes/messageRoutes"));

// ROOT TEST
app.get("/", (req, res) => {
  res.send("MerqNet API is running...");
});

// SERVER
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
