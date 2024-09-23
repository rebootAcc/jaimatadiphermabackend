const express = require("express");

const productController = require("../controllers/productController");

const router = express.Router();

router.post("/create", productController.createProducts);
router.get("/get", productController.getProducts);
router.get("/search", productController.searchProducts);
router.put("/update/:productId", productController.updateProduct);
router.get("/get/:productId", productController.getProductById);
router.delete("/delete/:productId", productController.deleteProduct);

router.patch("/setactive/:productId", productController.setProductActiveStatus);

module.exports = router;
