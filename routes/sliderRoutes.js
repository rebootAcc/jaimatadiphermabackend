const express = require("express");

const sliderController = require("../controllers/sliderController");

const router = express.Router();

router.post("/create", sliderController.createSliders);
router.get("/get", sliderController.getSlider);
router.put("/update/:sliderId", sliderController.updateSlider);
router.get("/get/:sliderId", sliderController.getSliderById);
router.delete("/delete/:sliderId", sliderController.deleteSlider);

router.patch("/setactive/:sliderId", sliderController.setSliderActiveStatus);

module.exports = router;
