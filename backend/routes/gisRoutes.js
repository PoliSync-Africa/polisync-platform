const express = require("express");

const router = express.Router();

const {
  getGhanaRegions,
  getRegion
} = require("../controllers/gisController");

router.get("/ghana/regions", getGhanaRegions);

router.get("/ghana/regions/:code", getRegion);

module.exports = router;
