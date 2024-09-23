const Category = require("../models/categoryModel");

const generateCategoryId = async () => {
  const category = await Category.find({}, { categoryId: 1, _id: 0 }).sort({
    categoryId: 1,
  });
  const categoryIds = category.map((category) =>
    parseInt(category.categoryId.replace("categoryId", ""), 10)
  );

  let categoryId = 1;
  for (let i = 0; i < categoryIds.length; i++) {
    if (categoryId < categoryIds[i]) {
      break;
    }
    categoryId++;
  }

  return `categoryId${String(categoryId).padStart(4, "0")}`;
};

exports.createCategory = async (req, res) => {
  try {
    const { categoryName } = req.body;

    const categoryId = await generateCategoryId();
    const newCategory = new Category({
      categoryId,
      categoryName,
    });

    await newCategory.save();
    res
      .status(201)
      .json({ message: " category created successfully", newCategory });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        error: "Category Name already exists. Please try another name.",
      });
    }
    console.error("Error creating  category:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { categoryName } = req.body;

    const categoryUpdate = await Category.findOne({ categoryId });
    if (!categoryUpdate) {
      return res.status(404).json({ message: "Brand not found" });
    }

    categoryUpdate.categoryName = categoryName || categoryUpdate.categoryName;

    await categoryUpdate.save();
    res
      .status(200)
      .json({ message: "Category updated successfully", categoryUpdate });
  } catch (error) {
    console.error("Error updating Category:", error.message);
    res.status(500).json({ message: "Error updating Category", error });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Find brand to get public_id
    const categoryDelete = await Category.findOne({ categoryId });
    if (!categoryDelete) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Delete brand from database
    await Category.findOneAndDelete({ categoryId });
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting Category", error });
  }
};
