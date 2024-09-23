const mongoose = require("mongoose");

const packagingsizeSchema = new mongoose.Schema({
  packagingsizeId: {
    type: String,
    unique: true,
    required: true,
  },
  packagingsizeName: {
    type: String,
    unique: true,
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

packagingsizeSchema.index({ createdAt: -1, packagingsizeId: 1 });

module.exports = mongoose.model("PackagingSize", packagingsizeSchema);
