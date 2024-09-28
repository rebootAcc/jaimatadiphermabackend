const Popups = require("../models/popupModel");
const path = require("path");
const fs = require("fs");

const generatePopupId = async () => {
  const popup = await Popups.find({}, { popupId: 1, _id: 0 }).sort({
    popupId: 1,
  });
  const popupIds = popup.map((popup) =>
    parseInt(popup.popupId.replace("popupId", ""), 10)
  );

  let popupId = 1;
  for (let i = 0; i < popupIds.length; i++) {
    if (popupId < popupIds[i]) {
      break;
    }
    popupId++;
  }

  return `popupId${String(popupId).padStart(4, "0")}`;
};

const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 300 });

exports.createPopups = async (req, res) => {
  try {
    const popupId = await generatePopupId();

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: "No files were uploaded." });
    }

    const popupImage = req.files.popupImage;
    const uploadDir = path.join(__dirname, "../upload");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }

    const imagePath = `/upload/${Date.now()}_${popupImage.name}`;
    const fullImagePath = path.join(
      uploadDir,
      `${Date.now()}_${popupImage.name}`
    );

    popupImage.mv(fullImagePath, async (err) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Image upload failed", error: err });
      }

      const popupsData = { ...req.body, popupId, popupImage: imagePath };

      const newPopup = new Popups(popupsData);

      await newPopup.save();

      const cacheKeysToInvalidate = cache
        .keys()
        .filter((key) => key.includes("allPopups") || key.includes("page:"));
      cacheKeysToInvalidate.forEach((key) => cache.del(key));

      res.status(201).json({
        message: "Popup Created Successfully",
        data: newPopup,
      });
    });
  } catch (error) {
    console.error("Error creating Popup:", error);
    res.status(500).json({
      message: "Error creating Popup",
      error: error.message,
    });
  }
};

exports.getPopups = async (req, res) => {
  try {
    const isActiveFilter = req.query.active
      ? req.query.active === "true"
      : null;

    const cacheKey =
      isActiveFilter !== null
        ? `allPopups?active=${isActiveFilter}`
        : "allPopups";

    const cachedResult = cache.get(cacheKey);

    if (cachedResult) {
      return res.status(200).json(cachedResult);
    }
    let query = {};
    if (isActiveFilter !== null) {
      query.active = isActiveFilter;
    }

    const result = await Popups.find(query).sort({ createdAt: -1 });

    cache.set(cacheKey, result);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching Popup:", error);
    res.status(500).json({
      message: "Error fetching Popup",
      error: error.message,
    });
  }
};

exports.updatePopup = async (req, res) => {
  try {
    const { popupId } = req.params;

    const existingPopup = await Popups.findOne({ popupId });

    if (!existingPopup) {
      return res.status(404).json({ message: "Popup not found" });
    }

    const updatedData = { ...req.body };

    if (req.files && req.files.popupImage) {
      const popupImage = req.files.popupImage;
      const uploadDir = path.join(__dirname, "../upload");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }

      const relativeImagePath = `/upload/${Date.now()}_${popupImage.name}`;
      const fullImagePath = path.join(
        uploadDir,
        `${Date.now()}_${popupImage.name}`
      );

      if (
        existingPopup.popupImage &&
        fs.existsSync(path.join(__dirname, "..", existingPopup.popupImage))
      ) {
        fs.unlinkSync(path.join(__dirname, "..", existingPopup.popupImage));
      }

      popupImage.mv(fullImagePath, (err) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Image upload failed", error: err });
        }
      });

      updatedData.popupImage = relativeImagePath;
    }

    const updatedPopup = await Popups.findOneAndUpdate(
      { popupId },
      { $set: updatedData },
      { new: true, runValidators: true }
    );

    const cacheKeysToInvalidate = cache
      .keys()
      .filter((key) => key.includes("allPopups") || key.includes("page:"));
    cacheKeysToInvalidate.forEach((key) => cache.del(key));

    res.status(200).json({
      message: "Popup updated successfully",
      data: updatedPopup,
    });
  } catch (error) {
    console.error("Error updating Popup:", error);
    res.status(500).json({
      message: "Error updating Popup",
      error: error.message,
    });
  }
};

exports.getPopupById = async (req, res) => {
  try {
    const popupId = req.params.popupId;
    const popup = await Popups.findOne({ popupId });

    if (!popup) {
      return res.status(404).json({ message: "Popup not found" });
    }

    res.status(200).json(popup);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching Popup",
      error: error.message,
    });
  }
};

exports.deletePopup = async (req, res) => {
  try {
    const { popupId } = req.params;

    const existingPopup = await Popups.findOne({ popupId });

    if (!existingPopup) {
      return res.status(404).json({ message: "Popup not found" });
    }

    if (existingPopup.popupImage) {
      const imagePath = path.join(__dirname, "..", existingPopup.popupImage);

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Popups.findOneAndDelete({ popupId });
    const cacheKeysToInvalidate = cache
      .keys()
      .filter((key) => key.includes("allPopups") || key.includes("page:"));
    cacheKeysToInvalidate.forEach((key) => cache.del(key));

    res.status(200).json({
      message: "Popup deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting Popup:", error);
    res.status(500).json({
      message: "Error deleting Popup",
      error: error.message,
    });
  }
};

exports.setPopupActiveStatus = async (req, res) => {
  try {
    const { popupId } = req.params;
    const { active } = req.body;

    if (typeof active !== "boolean") {
      return res
        .status(400)
        .json({ message: "Active must be a boolean value" });
    }

    // If the new status is 'active', set all other popups to 'inactive'
    if (active) {
      await Popups.updateMany({ active: true }, { $set: { active: false } });
    }

    const updatedPopup = await Popups.findOneAndUpdate(
      { popupId },
      { $set: { active: active } },
      { new: true }
    );

    if (!updatedPopup) {
      return res.status(404).json({ message: "Popup not found" });
    }

    // Clear relevant cache
    const cacheKeysToInvalidate = cache
      .keys()
      .filter((key) => key.includes("allPopups") || key.includes("page:"));
    cacheKeysToInvalidate.forEach((key) => cache.del(key));

    res.status(200).json({
      message: `Popup ${active ? "activated" : "deactivated"} successfully`,
      data: updatedPopup,
    });
  } catch (error) {
    console.error("Error updating Popup status:", error);
    res.status(500).json({
      message: "Error updating Popup status",
      error: error.message,
    });
  }
};
