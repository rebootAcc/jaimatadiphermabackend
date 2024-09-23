const mongoose = require("mongoose");
const popupSchema = new mongoose.Schema({
  popupId: {
    type: String,
    unique: true,
    required: true,
  },
  popupName: { type: String, required: true },
  popupImage: { type: String, required: true },

  active: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

popupSchema.index({ createdAt: -1, popupId: 1 });

module.exports = mongoose.model("Popups", popupSchema);
