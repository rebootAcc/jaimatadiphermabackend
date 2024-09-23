const Strength = require("../models/strengthModel");

const generateStrengthId = async () => {
  const strength = await Strength.find({}, { strengthId: 1, _id: 0 }).sort({
    strengthId: 1,
  });
  const strengthIds = strength.map((strength) =>
    parseInt(strength.strengthId.replace("strengthId", ""), 10)
  );

  let strengthId = 1;
  for (let i = 0; i < strengthIds.length; i++) {
    if (strengthId < strengthIds[i]) {
      break;
    }
    strengthId++;
  }

  return `strengthId${String(strengthId).padStart(4, "0")}`;
};

exports.createStrength = async (req, res) => {
  try {
    const { strengthName } = req.body;

    const strengthId = await generateStrengthId();
    const newStrength = new Strength({
      strengthId,
      strengthName,
    });

    await newStrength.save();
    res
      .status(201)
      .json({ message: " Strength created successfully", newStrength });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        error: "Strength Name already exists. Please try another name.",
      });
    }
    console.error("Error creating  Strength:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getStrength = async (req, res) => {
  try {
    const strengths = await Strength.find().sort({ createdAt: -1 });
    res.status(200).json(strengths);
  } catch (error) {
    console.error("Error fetching Strengths:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateStrength = async (req, res) => {
  try {
    const { strengthId } = req.params;
    const { strengthName } = req.body;

    const strengthUpdate = await Strength.findOne({ strengthId });
    if (!strengthUpdate) {
      return res.status(404).json({ message: "Strength not found" });
    }

    strengthUpdate.strengthName = strengthName || strengthUpdate.strengthName;

    await strengthUpdate.save();
    res
      .status(200)
      .json({ message: "Strength updated successfully", strengthUpdate });
  } catch (error) {
    console.error("Error updating Strength:", error.message);
    res.status(500).json({ message: "Error updating Strength", error });
  }
};

exports.deleteStrength = async (req, res) => {
  try {
    const { strengthId } = req.params;

    const strengthDelete = await Strength.findOne({ strengthId });
    if (!strengthDelete) {
      return res.status(404).json({ message: "Strength not found" });
    }

    // Delete brand from database
    await Strength.findOneAndDelete({ strengthId });
    res.status(200).json({ message: "Strength deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting Strength", error });
  }
};
