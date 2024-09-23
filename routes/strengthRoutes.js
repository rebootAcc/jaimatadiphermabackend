const express = require("express");

const {
  createStrength,
  deleteStrength,
  getStrength,
  updateStrength,
} = require("../controllers/strengthController");

const router = express.Router();

router.post("/create", createStrength);
router.get("/get", getStrength);
router.delete("/delete/:strengthId", deleteStrength);
router.put("/update/:strengthId", updateStrength);

module.exports = router;
