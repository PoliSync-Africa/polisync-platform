const express = require("express");

const router = express.Router();

const {
  getStationProfile
} = require("../controllers/pollingStationController");

router.get("/:id", getStationProfile);

module.exports = router;
