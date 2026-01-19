const Request = require("../models/Request");

// CREATE REQUEST
exports.createRequest = async (req, res) => {
  try {
    const newRequest = new Request(req.body);
    const savedRequest = await newRequest.save();
    res.status(201).json(savedRequest);
  } catch (error) {
    console.error("Error creating request:", error);
    res.status(400).json({ message: "Request validation failed", error });
  }
};

// BUYER — GET REQUESTS BY CLIENT ID
exports.getRequestsByClientId = async (req, res) => {
  try {
    const { clientId } = req.params;

    const requests = await Request.find({ clientID: clientId }).sort({
      createdAt: -1,
    });

    res.json(requests);
  } catch (error) {
    console.error("Error loading buyer requests:", error);
    res.status(500).json({ message: "Error loading buyer requests" });
  }
};

// SELLER — FILTER REQUESTS (SUPPORTS ?category=... + FULL LEGACY CATEGORY MAPPING)
exports.getFilteredRequestsForSeller = async (req, res) => {
  try {
    const { userId } = req.params;
    const { category } = req.query;

    const filter = {
      clientID: { $ne: userId }, // exclude seller’s own requests
    };

    // ✅ Full legacy category mapping (backwards compatible)
    // Official dropdown value -> acceptable DB values (official + legacy aliases)
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
      // If the selected category has aliases, match any of them.
      if (categoryMap[category]) {
        filter.category = { $in: categoryMap[category] };
      } else {
        // Otherwise match exactly
        filter.category = category;
      }
    }

    const requests = await Request.find(filter)
      .populate("clientID", "fullName email shippingAddresses")
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error("Error loading filtered requests:", error);
    res.status(500).json({ message: "Error loading filtered requests" });
  }
};

// GET ONE REQUEST
exports.getRequestById = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: "Error loading request" });
  }
};

// DELETE REQUEST
exports.deleteRequest = async (req, res) => {
  try {
    await Request.findByIdAndDelete(req.params.id);
    res.json({ message: "Request deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting request" });
  }
};
