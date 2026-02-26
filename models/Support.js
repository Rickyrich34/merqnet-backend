const mongoose = require("mongoose");

const supportSchema = new mongoose.Schema(
  {
    issueType: String,
    requestId: String,
    subject: String,
    message: String,
    email: String,
    username: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Support", supportSchema);