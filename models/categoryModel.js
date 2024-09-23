const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  categoryId: {
    type: String,
    unique: true,
    required: true,
  },
  categoryName: {
    type: String,
    unique: true,
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

categorySchema.index({ createdAt: -1, categoryId: 1 });

module.exports = mongoose.model("Category", categorySchema);
