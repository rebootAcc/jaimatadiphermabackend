const express = require("express");

const popupController = require("../controllers/popupController");

const router = express.Router();

router.post("/create", popupController.createPopups);
router.get("/get", popupController.getPopups);
router.put("/update/:popupId", popupController.updatePopup);
router.get("/get/:popupId", popupController.getPopupById);
router.delete("/delete/:popupId", popupController.deletePopup);

router.patch("/setactive/:popupId", popupController.setPopupActiveStatus);

module.exports = router;
