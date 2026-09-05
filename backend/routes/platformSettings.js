const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const { getSettings, updateSettings } = require("../controllers/platformSettingsController");

router.use(protect, authorize("super_admin"));
router.get("/", getSettings);
router.patch("/", updateSettings);

module.exports = router;
