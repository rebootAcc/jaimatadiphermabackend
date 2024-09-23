const mongoose = require("mongoose");

const moleculeSchema = new mongoose.Schema({
  moleculeId: {
    type: String,
    unique: true,
    required: true,
  },
  moleculeName: {
    type: String,
    unique: true,
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

moleculeSchema.index({ createdAt: -1, moleculeId: 1 });

module.exports = mongoose.model("Molecule", moleculeSchema);
