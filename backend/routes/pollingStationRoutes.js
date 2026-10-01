const express = require("express");
const { protect } = require("../middleware/auth");
const { getStationProfile } = require("../controllers/pollingStationController");

const router = express.Router();

router.use(protect);
router.get("/:id", getStationProfile);

module.exports = router;
