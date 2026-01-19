require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/Product");
const { normalize } = require("../utils/normalize");

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const cursor = Product.find({}).cursor();
    let n = 0;
    for await (const p of cursor) {
      p.searchName = normalize(`${p.brand || ""} ${p.name || ""}`);
      await p.save();
      n++;
    }
    console.log("Backfill listo:", n);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
