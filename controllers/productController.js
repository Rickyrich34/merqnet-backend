const Product = require("../models/Product.js");

// CREATE PRODUCT (modelo MERQNET oficial)
exports.createProduct = async (req, res) => {
  try {
    console.log("RECIBIDO EN BACKEND:", req.body);

    const {
      productName,
      category,
      quantity,
      condition,
      sizeWeight,  // opcional
      description,
      unitPrice,
      wholeLotPrice,
      clientID,
    } = req.body;

    // VALIDACIÓN (sizeWeight es OPCIONAL)
    if (
      !productName ||
      !category ||
      !quantity ||
      !condition ||
      !description ||
      !unitPrice ||
      !wholeLotPrice ||
      !clientID
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // CREAR PRODUCTO
    const newProduct = new Product({
      productName,
      category,
      quantity,
      condition,
      sizeWeight, // si viene, se guarda; si no, queda undefined
      description,
      unitPrice,
      wholeLotPrice,
      clientID,
    });

    const savedProduct = await newProduct.save();

    return res.status(201).json({
      message: "Product created successfully",
      product: savedProduct,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// GET ALL PRODUCTS (solo los del vendedor si manda clientID)
exports.getProducts = async (req, res) => {
  try {
    const { clientID } = req.query;

    // Si viene clientID → filtramos
    const filter = clientID ? { clientID } : {};

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET PRODUCT BY ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE PRODUCT
exports.deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Product not found" });

    res.status(200).json({ message: "Product deleted" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Server error" });
  }
};
