const Slider = require("../models/sliderModel");
const path = require("path");
const fs = require("fs");

const generateSliderId = async () => {
  const slider = await Slider.find({}, { sliderId: 1, _id: 0 }).sort({
    sliderId: 1,
  });
  const sliderIds = slider.map((slider) =>
    parseInt(slider.sliderId.replace("sliderId", ""), 10)
  );

  let sliderId = 1;
  for (let i = 0; i < sliderIds.length; i++) {
    if (sliderId < sliderIds[i]) {
      break;
    }
    sliderId++;
  }

  return `sliderId${String(sliderId).padStart(4, "0")}`;
};

const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 300 });

exports.createSliders = async (req, res) => {
  try {
    const sliderId = await generateSliderId();

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: "No files were uploaded." });
    }

    const sliderImage = req.files.sliderImage;
    const uploadDir = path.join(__dirname, "../upload");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }

    const imagePath = `/upload/${Date.now()}_${sliderImage.name}`;
    const fullImagePath = path.join(
      uploadDir,
      `${Date.now()}_${sliderImage.name}`
    );

    sliderImage.mv(fullImagePath, async (err) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Image upload failed", error: err });
      }

      const slidersData = { ...req.body, sliderId, sliderImage: imagePath };
      const newSlider = new Slider(slidersData);

      await newSlider.save();

      const cacheKeysToInvalidate = cache
        .keys()
        .filter((key) => key.includes("allSliders") || key.includes("page:"));
      cacheKeysToInvalidate.forEach((key) => cache.del(key));

      res.status(201).json({
        message: "Slider Created Successfully",
        data: newSlider,
      });
    });
  } catch (error) {
    console.error("Error creating Slider:", error);
    res.status(500).json({
      message: "Error creating Slider",
      error: error.message,
    });
  }
};

exports.getSlider = async (req, res) => {
  try {
    const isActiveFilter = req.query.active
      ? req.query.active === "true"
      : null;

    const cacheKey =
      isActiveFilter !== null
        ? `allSliders?active=${isActiveFilter}`
        : "allSliders";

    const cachedSliders = cache.get(cacheKey);

    if (cachedSliders) {
      return res.status(200).json(cachedSliders);
    }
    let query = {};
    if (isActiveFilter !== null) {
      query.active = isActiveFilter;
    }
    const result = await Slider.find(query).sort({ createdAt: -1 });

    cache.set(cacheKey, result);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching Slider:", error);
    res.status(500).json({
      message: "Error fetching Slider",
      error: error.message,
    });
  }
};

exports.updateSlider = async (req, res) => {
  try {
    const { sliderId } = req.params;

    const existingSlider = await Slider.findOne({ sliderId });

    if (!existingSlider) {
      return res.status(404).json({ message: "Slider not found" });
    }

    const updatedData = { ...req.body };

    if (req.files && req.files.sliderImage) {
      const sliderImage = req.files.sliderImage;
      const uploadDir = path.join(__dirname, "../upload");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }

      const relativeImagePath = `/upload/${Date.now()}_${sliderImage.name}`;
      const fullImagePath = path.join(
        uploadDir,
        `${Date.now()}_${sliderImage.name}`
      );

      if (
        existingSlider.sliderImage &&
        fs.existsSync(path.join(__dirname, "..", existingSlider.sliderImage))
      ) {
        fs.unlinkSync(path.join(__dirname, "..", existingSlider.sliderImage));
      }

      sliderImage.mv(fullImagePath, (err) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Image upload failed", error: err });
        }
      });

      updatedData.sliderImage = relativeImagePath;
    }

    const updatedSlider = await Slider.findOneAndUpdate(
      { sliderId },
      { $set: updatedData },
      { new: true, runValidators: true }
    );

    const cacheKeysToInvalidate = cache
      .keys()
      .filter((key) => key.includes("allSliders") || key.includes("page:"));
    cacheKeysToInvalidate.forEach((key) => cache.del(key));

    res.status(200).json({
      message: "Slider updated successfully",
      data: updatedSlider,
    });
  } catch (error) {
    console.error("Error updating Slider:", error);
    res.status(500).json({
      message: "Error updating Slider",
      error: error.message,
    });
  }
};

exports.getSliderById = async (req, res) => {
  try {
    const sliderId = req.params.sliderId;
    const slider = await Slider.findOne({ sliderId });

    if (!slider) {
      return res.status(404).json({ message: "Slider not found" });
    }

    res.status(200).json(slider);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching Slider",
      error: error.message,
    });
  }
};

exports.deleteSlider = async (req, res) => {
  try {
    const { sliderId } = req.params;

    const existingSlider = await Slider.findOne({ sliderId });

    if (!existingSlider) {
      return res.status(404).json({ message: "Slider not found" });
    }

    if (existingSlider.sliderImage) {
      const imagePath = path.join(__dirname, "..", existingSlider.sliderImage);

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Slider.findOneAndDelete({ sliderId });
    const cacheKeysToInvalidate = cache
      .keys()
      .filter((key) => key.includes("allSliders") || key.includes("page:"));
    cacheKeysToInvalidate.forEach((key) => cache.del(key));

    res.status(200).json({
      message: "Slider deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting Slider:", error);
    res.status(500).json({
      message: "Error deleting Slider",
      error: error.message,
    });
  }
};

exports.setSliderActiveStatus = async (req, res) => {
  try {
    const { sliderId } = req.params;
    const { active } = req.body;

    if (typeof active !== "boolean") {
      return res
        .status(400)
        .json({ message: "isActive must be a boolean value" });
    }

    const updatedSlider = await Slider.findOneAndUpdate(
      { sliderId },
      { $set: { active: active } },
      { new: true }
    );

    if (!updatedSlider) {
      return res.status(404).json({ message: "Slider not found" });
    }

    const cacheKeysToInvalidate = cache
      .keys()
      .filter((key) => key.includes("allSliders") || key.includes("page:"));
    cacheKeysToInvalidate.forEach((key) => cache.del(key));

    res.status(200).json({
      message: `Slider ${active ? "activated" : "deactivated"} successfully`,
      data: updatedSlider,
    });
  } catch (error) {
    console.error("Error updating Slider status:", error);
    res.status(500).json({
      message: "Error updating Slider status",
      error: error.message,
    });
  }
};
