const Molecule = require("../models/moleculeModel");

const generateMoleculeId = async () => {
  const molecule = await Molecule.find({}, { moleculeId: 1, _id: 0 }).sort({
    moleculeId: 1,
  });
  const moleculeIds = molecule.map((molecule) =>
    parseInt(molecule.moleculeId.replace("moleculeId", ""), 10)
  );

  let moleculeId = 1;
  for (let i = 0; i < moleculeIds.length; i++) {
    if (moleculeId < moleculeIds[i]) {
      break;
    }
    moleculeId++;
  }

  return `moleculeId${String(moleculeId).padStart(4, "0")}`;
};

exports.createMolecule = async (req, res) => {
  try {
    const { moleculeName } = req.body;

    const moleculeId = await generateMoleculeId();
    const newMolecule = new Molecule({
      moleculeId,
      moleculeName,
    });

    await newMolecule.save();
    res
      .status(201)
      .json({ message: " Molecule created successfully", newMolecule });
  } catch (error) {
    console.error("Error creating  Molecule:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getMolecules = async (req, res) => {
  try {
    const molecules = await Molecule.find().sort({ createdAt: -1 });
    res.status(200).json(molecules);
  } catch (error) {
    console.error("Error fetching Molecules:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateMolecule = async (req, res) => {
  try {
    const { moleculeId } = req.params;
    const { moleculeName } = req.body;

    const moleculeUpdate = await Molecule.findOne({ moleculeId });
    if (!moleculeUpdate) {
      return res.status(404).json({ message: "Molecule not found" });
    }

    moleculeUpdate.moleculeName = moleculeName || moleculeUpdate.moleculeName;

    await moleculeUpdate.save();
    res
      .status(200)
      .json({ message: "Molecule updated successfully", moleculeUpdate });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        error: "Molecule Name already exists. Please try another name.",
      });
    }
    console.error("Error updating Molecule:", error.message);
    res.status(500).json({ message: "Error updating Molecule", error });
  }
};

exports.deleteMolecule = async (req, res) => {
  try {
    const { moleculeId } = req.params;

    const moleculeDelete = await Molecule.findOne({ moleculeId });
    if (!moleculeDelete) {
      return res.status(404).json({ message: "Molecule not found" });
    }

    await Molecule.findOneAndDelete({ moleculeId });
    res.status(200).json({ message: "Molecule deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting Molecule", error });
  }
};
