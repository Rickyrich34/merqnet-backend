// controllers/matchController.js
const Product = require("../models/Product");
const Request = require("../models/Request");

// 🔥 función para comparar nombres
function similarity(a, b) {
  if (!a || !b) return 0;
  a = a.toLowerCase();
  b = b.toLowerCase();
  if (a === b) return 1; // match perfecto

  let count = 0;
  const minLen = Math.min(a.length, b.length);

  for (let i = 0; i < minLen; i++) {
    if (a[i] === b[i]) count++;
  }

  return count / minLen;
}

exports.getMatches = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const products = await Product.find({ owner: sellerId });
    const requests = await Request.find();

    const results = [];

    for (const reqItem of requests) {
      for (const prodItem of products) {
        let score = 0;

        // ✅ Misma categoría (LO MÁS IMPORTANTE)
        if (
          reqItem.category?.toLowerCase().trim() ===
          prodItem.category?.toLowerCase().trim()
        ) {
          score += 50;
        }

        // ✅ Misma condición
        if (
          reqItem.condition?.toLowerCase().trim() ===
          prodItem.condition?.toLowerCase().trim()
        ) {
          score += 20;
        }

        // ✅ Cantidad suficiente
        if (prodItem.quantity >= reqItem.quantity) {
          score += 30;
        } else {
          // ✅ Si el vendedor tiene al menos el 70%
          const pct = prodItem.quantity / reqItem.quantity;
          if (pct >= 0.7) score += 10;
        }

        // ✅ Similaridad del nombre
        const nameSim = similarity(reqItem.productName, prodItem.brand);

        if (nameSim >= 0.8) score += 40;
        else if (nameSim >= 0.5) score += 20;

        // ✅ Si no hay score, no se añade
        if (score > 0) {
          results.push({
            requestId: reqItem._id,
            productId: prodItem._id,
            buyer: reqItem.clientID,
            productName: prodItem.brand,
            requestName: reqItem.productName,
            reqQuantity: reqItem.quantity,
            sellerQuantity: prodItem.quantity,
            condition: prodItem.condition,
            category: prodItem.category,
            score,
          });
        }
      }
    }

    // ✅ ORDENADO: mejores matches primero
    results.sort((a, b) => b.score - a.score);

    res.json(results);

  } catch (error) {
    console.error("MATCH ERROR:", error);
    res.status(500).json({ error: "Server error" });
  }
};
