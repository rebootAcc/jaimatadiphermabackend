const express = require("express");

const {
  createPackagingSize,
  deletePackagingSize,
  getPackagingSize,
  updatePackagingSize,
} = require("../controllers/packagingsizeController");

const router = express.Router();

router.post("/create", createPackagingSize);
router.get("/get", getPackagingSize);
router.delete("/delete/:packagingsizeId", deletePackagingSize);
router.put("/update/:packagingsizeId", updatePackagingSize);

module.exports = router;
