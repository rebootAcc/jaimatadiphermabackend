// routes/categoryRoutes.js

const express = require("express");

const {
  createMolecule,
  deleteMolecule,
  getMolecules,
  updateMolecule,
} = require("../controllers/moleculeController");

const router = express.Router();

router.post("/create", createMolecule);
router.get("/get", getMolecules);
router.delete("/delete/:moleculeId", deleteMolecule);
router.put("/update/:moleculeId", updateMolecule);

module.exports = router;
