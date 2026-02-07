const mongoose = require("mongoose");
const Request = require("../models/Request");
const Bid = require("../models/Bid");

/* ===============================
   CREATE REQUEST
================================ */

exports.createRequest = async (req, res) => {
  try {
    const newRequest = new Request(req.body);
    const savedRequest = await newRequest.save();

    res.status(201).json(savedRequest);
  } catch (error) {
    console.error("Error creating request:", error);

    res.status(400).json({
      message: "Request validation failed",
      error,
    });
  }
};

/* ===============================
   BUYER — GET ACTIVE REQUESTS
================================ */

exports.getRequestsByClientId = async (req, res) => {
  try {
    const { clientId } = req.params;

    const requests = await Request.find({
      clientID: clientId,
      status: {
        $nin: ["completed", "closed", "paid", "awarded", "expired", "cancelled"],
      },
    }).sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error("Error loading buyer requests:", error);

    res.status(500).json({
      message: "Error loading buyer requests",
      error: error?.message || String(error),
    });
  }
};

/* ===============================
   SELLER — FILTER REQUESTS
================================ */

function getBidPrice(bid) {
  const candidates = [
    bid?.totalPrice,
    bid?.unitPrice,
    bid?.price,
    bid?.amount,
  ];

  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n)) return n;
  }

  return null;
}

exports.getFilteredRequestsForSeller = async (req, res) => {
  try {
    const { userId } = req.params;
    const { category } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    /* ===============================
       BASE FILTER
    ================================ */

    const filter = {
      clientID: { $ne: new mongoose.Types.ObjectId(userId) },
      status: "open",
    };

    /* ===============================
       CATEGORY MAP
    ================================ */

    const categoryMap = {
      "Construction & Industrial": [
        "Construction & Industrial",
        "Construction",
        "Industrial",
        "Construction/Industrial",
      ],

      "Technology & Electronics": [
        "Technology & Electronics",
        "Technology",
        "Tech",
        "Electronics",
        "Technology/Electronics",
      ],

      "Medical & Laboratory Equipment": [
        "Medical & Laboratory Equipment",
        "Medical",
        "Healthcare",
        "Health",
        "Laboratory",
        "Lab",
        "Medical Equipment",
        "Lab Equipment",
      ],

      "Home & Garden": [
        "Home & Garden",
        "Home",
        "Garden",
        "Home/Garden",
        "Household",
      ],

      "Automotive & Parts": [
        "Automotive & Parts",
        "Automotive",
        "Auto",
        "Car",
        "Cars",
        "Auto Parts",
        "Parts",
      ],

      "Sports & Outdoors": [
        "Sports & Outdoors",
        "Sports",
        "Outdoors",
        "Sporting Goods",
        "Outdoor",
      ],

      "Office & Business Supplies": [
        "Office & Business Supplies",
        "Office",
        "Business",
        "Business Supplies",
        "Office Supplies",
        "Stationery",
      ],

      "Food & Beverage Supplies": [
        "Food & Beverage Supplies",
        "Food",
        "Beverage",
        "Beverages",
        "Drinks",
        "Restaurant",
        "Restaurant Supplies",
      ],

      "Clothing & Textiles": [
        "Clothing & Textiles",
        "Clothing",
        "Textiles",
        "Apparel",
        "Fashion",
        "Ropa",
      ],

      "Beauty & Personal Care": [
        "Beauty & Personal Care",
        "Beauty",
        "Personal Care",
        "Cosmetics",
        "Skincare",
      ],

      "Entertainment & Media": [
        "Entertainment & Media",
        "Entertainment",
        "Media",
        "Music",
        "Movies",
        "Film",
        "TV",
        "Games",
        "Gaming",
      ],

      "Services": [
        "Services",
        "Service",
        "Professional Services",
        "Labor",
        "Repairs",
        "Repair",
      ],

      "Other": ["Other", "Else", "Misc", "Miscellaneous", "General"],
    };

    if (category && category !== "All Categories") {
      if (categoryMap[category]) {
        filter.category = { $in: categoryMap[category] };
      } else {
        filter.category = category;
      }
    }

    /* ===============================
       LOAD REQUESTS
    ================================ */

    const requests = await Request.find(filter)
      .populate("clientID", "fullName email shippingAddresses")
      .sort({ createdAt: -1 });

    /* ===============================
       LOAD ALL BIDS
    ================================ */

    const requestIds = requests.map((r) => r._id);

    const bids = await Bid.find({
      requestId: { $in: requestIds },
    }).select(
      "requestId sellerId totalPrice unitPrice price amount createdAt"
    );

    /* ===============================
       GROUP BY REQUEST
    ================================ */

    const byRequest = new Map();

    for (const b of bids) {
      const rid = String(b.requestId);

      const price = getBidPrice(b);

      if (price == null) continue;

      if (!byRequest.has(rid)) {
        byRequest.set(rid, []);
      }

      // ✅ KEEP FULL BID INFO
      byRequest.get(rid).push({
        _id: String(b._id),
        sellerId: String(b.sellerId),

        totalPrice: b.totalPrice,
        unitPrice: b.unitPrice,
        price: b.price,
        amount: b.amount,

        finalPrice: price,

        createdAt: b.createdAt,
      });
    }

    /* ===============================
       ENRICH REQUESTS
    ================================ */

    const enriched = requests.map((r) => {
      const rid = String(r._id);

      const offers = byRequest.get(rid) || [];

      return {
        ...r.toObject(),
        offers,
      };
    });

    res.json({ requests: enriched });
  } catch (error) {
    console.error("Error loading filtered requests:", error);

    res.status(500).json({
      message: "Error loading filtered requests",
      error: error?.message || String(error),
    });
  }
};

/* ===============================
   GET ONE REQUEST
================================ */

exports.getRequestById = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    res.json(request);
  } catch (error) {
    console.error("Error loading request:", error);

    res.status(500).json({
      message: "Error loading request",
      error: error?.message || String(error),
    });
  }
};

/* ===============================
   DELETE REQUEST
================================ */

exports.deleteRequest = async (req, res) => {
  try {
    await Request.findByIdAndDelete(req.params.id);

    res.json({ message: "Request deleted" });
  } catch (error) {
    console.error("Error deleting request:", error);

    res.status(500).json({
      message: "Error deleting request",
      error: error?.message || String(error),
    });
  }
};
