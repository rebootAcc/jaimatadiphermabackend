const Products = require("../models/productModel");
const path = require("path");
const fs = require("fs");

const generateProductId = async () => {
  const product = await Products.find({}, { productId: 1, _id: 0 }).sort({
    productId: 1,
  });
  const productIds = product.map((product) =>
    parseInt(product.productId.replace("productId", ""), 10)
  );

  let productId = 1;
  for (let i = 0; i < productIds.length; i++) {
    if (productId < productIds[i]) {
      break;
    }
    productId++;
  }

  return `productId${String(productId).padStart(4, "0")}`;
};

const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 300 });

exports.createProducts = async (req, res) => {
  try {
    const productId = await generateProductId();

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: "No files were uploaded." });
    }

    const productImage = req.files.productImage;
    const uploadDir = path.join(__dirname, "../upload");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }

    const imagePath = `/upload/${Date.now()}_${productImage.name}`;
    const fullImagePath = path.join(
      uploadDir,
      `${Date.now()}_${productImage.name}`
    );

    productImage.mv(fullImagePath, async (err) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Image upload failed", error: err });
      }

      const productsData = { ...req.body, productId, productImage: imagePath };
      const newProduct = new Products(productsData);

      await newProduct.save();

      const cacheKeysToInvalidate = cache
        .keys()
        .filter((key) => key.includes("allProducts") || key.includes("page:"));
      cacheKeysToInvalidate.forEach((key) => cache.del(key));

      res.status(201).json({
        message: "Product Created Successfully",
        data: newProduct,
      });
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      message: "Error creating product",
      error: error.message,
    });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const match = {};

    if (req.query.active) {
      match.active = req.query.active === "true";
    }

    if (req.query.category) {
      match.categoryName = req.query.category;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      match.$or = [{ brandName: searchRegex }, { moleculeName: searchRegex }];
    }

    let cacheKey = `page:${page}-limit:${limit}`;
    if (req.query.active) {
      cacheKey += `-active:${req.query.active}`;
    }
    if (req.query.category) {
      cacheKey += `-category:${req.query.category}`;
    }
    if (req.query.search) {
      cacheKey += `-search:${req.query.search}`;
    }

    const cachedProducts = cache.get(cacheKey);
    if (cachedProducts) {
      return res.status(200).json(cachedProducts);
    }

    const totalDocuments = await Products.countDocuments(match);

    const pipeline = [{ $match: match }];
    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const products = await Products.aggregate(pipeline);

    const totalPages = Math.ceil(totalDocuments / limit);

    const result = {
      page,
      totalPages,
      totalDocuments,
      data: products,
    };

    cache.set(cacheKey, result);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching Products:", error);
    res.status(500).json({
      message: "Error fetching Products",
      error: error.message,
    });
  }
};
exports.searchProducts = async (req, res) => {
  try {
    const searchQuery = req.query.query;

    if (!searchQuery) {
      return res.status(400).json({ message: "Query parameter is required" });
    }

    // Create a regex pattern that matches any string containing each character of the searchQuery in order
    const fuzzyRegex = new RegExp(searchQuery.split("").join(".*"), "i");

    const products = await Products.aggregate([
      {
        $match: {
          $or: [{ brandName: fuzzyRegex }, { moleculeName: fuzzyRegex }],
        },
      },
      {
        $group: {
          _id: "$moleculeName",
          moleculeName: { $first: "$moleculeName" },
          brandName: { $first: "$brandName" },
        },
      },
      {
        $limit: 30,
      },
    ]);

    res.status(200).json(products);
  } catch (error) {
    console.error("Error searching Products:", error);
    res.status(500).json({
      message: "Error searching Products",
      error: error.message,
    });
  }
};

exports.getRandomSuggestions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 30;

    const randomProducts = await Products.aggregate([
      {
        $sample: { size: limit },
      },
      {
        $group: {
          _id: "$moleculeName",
          moleculeName: { $first: "$moleculeName" },
          brandName: { $first: "$brandName" },
        },
      },
    ]);

    res.status(200).json(randomProducts);
  } catch (error) {
    console.error("Error fetching random suggestions:", error);
    res.status(500).json({
      message: "Error fetching random suggestions",
      error: error.message,
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const existingProduct = await Products.findOne({ productId });

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const updatedData = { ...req.body };

    if (req.files && req.files.productImage) {
      const productImage = req.files.productImage;
      const uploadDir = path.join(__dirname, "../upload");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }

      const relativeImagePath = `/upload/${Date.now()}_${productImage.name}`;
      const fullImagePath = path.join(
        uploadDir,
        `${Date.now()}_${productImage.name}`
      );

      if (
        existingProduct.productImage &&
        fs.existsSync(path.join(__dirname, "..", existingProduct.productImage))
      ) {
        fs.unlinkSync(path.join(__dirname, "..", existingProduct.productImage));
      }

      productImage.mv(fullImagePath, (err) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Image upload failed", error: err });
        }
      });

      updatedData.productImage = relativeImagePath;
    }

    const updatedProduct = await Products.findOneAndUpdate(
      { productId },
      { $set: updatedData },
      { new: true, runValidators: true }
    );

    const cacheKeysToInvalidate = cache
      .keys()
      .filter((key) => key.includes("allProducts") || key.includes("page:"));
    cacheKeysToInvalidate.forEach((key) => cache.del(key));

    res.status(200).json({
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      message: "Error updating product",
      error: error.message,
    });
  }
};
exports.setProductActiveStatus = async (req, res) => {
  try {
    const { productId } = req.params;
    const { active } = req.body;

    if (typeof active !== "boolean") {
      return res
        .status(400)
        .json({ message: "isActive must be a boolean value" });
    }

    const updatedProduct = await Products.findOneAndUpdate(
      { productId },
      { $set: { active: active } },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const cacheKeysToInvalidate = cache
      .keys()
      .filter((key) => key.includes("allProducts") || key.includes("page:"));
    cacheKeysToInvalidate.forEach((key) => cache.del(key));

    res.status(200).json({
      message: `Product ${active ? "activated" : "deactivated"} successfully`,
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product status:", error);
    res.status(500).json({
      message: "Error updating product status",
      error: error.message,
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await Products.findOne({ productId });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching product",
      error: error.message,
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const existingProduct = await Products.findOne({ productId });

    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (existingProduct.productImage) {
      const imagePath = path.join(
        __dirname,
        "..",
        existingProduct.productImage
      );

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Products.findOneAndDelete({ productId });
    const cacheKeysToInvalidate = cache
      .keys()
      .filter((key) => key.includes("allProducts") || key.includes("page:"));
    cacheKeysToInvalidate.forEach((key) => cache.del(key));

    res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      message: "Error deleting product",
      error: error.message,
    });
  }
};
