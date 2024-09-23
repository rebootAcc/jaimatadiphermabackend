const express = require("express");

const {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} = require("../controllers/categoryController");

const router = express.Router();

router.post("/create", createCategory);
router.get("/get", getCategories);
router.delete("/delete/:categoryId", deleteCategory);
router.put("/update/:categoryId", updateCategory);

module.exports = router;
