const mongoose = require("mongoose");
const popupSchema = new mongoose.Schema({
  popupId: {
    type: String,
    unique: true,
    required: true,
  },
  popupName: { type: String, required: true },
  popupImage: { type: String, required: true },

  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

popupSchema.pre("save", async function (next) {
  const Popup = mongoose.model("Popups", popupSchema);

  // Check if the current popup is being set as active
  if (this.active) {
    // Deactivate all other popups that are currently active
    await Popup.updateMany({ active: true }, { active: false });
  }

  next(); // Proceed with saving the current popup
});

popupSchema.index({ createdAt: -1, popupId: 1 });

module.exports = mongoose.model("Popups", popupSchema);
