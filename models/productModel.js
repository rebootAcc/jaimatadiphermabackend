const mongoose = require("mongoose");
const productSchema = new mongoose.Schema({
  productId: {
    type: String,
    unique: true,
    required: true,
  },
  brandName: {
    type: String,
    required: true,
  },
  productImage: { type: String, required: true },
  categoryName: {
    type: String,
    required: true,
  },
  moleculeName: {
    type: String,
    required: true,
  },
  productPrice: { type: String, required: true },
  strengthName: {
    type: String,
    required: true,
  },
  packagingsizeName: {
    type: String,
    required: true,
  },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

productSchema.index({ createdAt: -1, productId: 1 });

module.exports = mongoose.model("Products", productSchema);
