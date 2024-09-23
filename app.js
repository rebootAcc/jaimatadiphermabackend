const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const MongoDbConnect = require("./connection");
require("dotenv").config();
const dotenv = require("dotenv");
const fileUpload = require("express-fileupload");

const port = 6000;
MongoDbConnect();
dotenv.config();

const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const moleculeRoutes = require("./routes/moleculeRoutes");
const strengthRoutes = require("./routes/strengthRoutes");
const packagingsizeRoutes = require("./routes/packagingsizeRoutes");
const productRoutes = require("./routes/productRoutes");
const sliderRoutes = require("./routes/sliderRoutes");
const popupRoutes = require("./routes/popupRoute");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(fileUpload());
app.use("/upload", express.static(path.join(__dirname, "upload")));

app.get("/api/image/:filename", (req, res) => {
  const filename = req.params.filename;
  res.sendFile(path.join(__dirname, "upload", filename));
});

app.use("/api", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/molecules", moleculeRoutes);
app.use("/api/strengths", strengthRoutes);
app.use("/api/packagingsize", packagingsizeRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sliders", sliderRoutes);
app.use("/api/popups", popupRoutes);

app.listen(port, () => {
  console.log(`Port starts on  ${port}`);
});
