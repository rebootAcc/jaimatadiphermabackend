const mongoose = require("mongoose");
const sliderSchema = new mongoose.Schema({
  sliderId: {
    type: String,
    unique: true,
    required: true,
  },
  sliderName: { type: String, required: true },
  sliderImage: { type: String, required: true },

  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

sliderSchema.index({ createdAt: -1, sliderId: 1 });

module.exports = mongoose.model("Slider", sliderSchema);
