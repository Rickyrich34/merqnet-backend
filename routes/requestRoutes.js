const express = require("express");
const router = express.Router();

const {
  createRequest,
  getRequestsByClientId,
  getFilteredRequestsForSeller,
  getRequestById,
  deleteRequest,
} = require("../controllers/requestController");

// CREATE REQUEST
router.post("/", createRequest);

// GET ALL REQUESTS FOR ONE BUYER
router.get("/buyer/:clientId", getRequestsByClientId);

// NEW — FILTERED REQUESTS FOR SELLERS (USED BY SellerDashboard.jsx)
router.get("/filtered/:userId", getFilteredRequestsForSeller);

// GET SINGLE REQUEST
router.get("/:id", getRequestById);

// DELETE REQUEST
router.delete("/:id", deleteRequest);

module.exports = router;
