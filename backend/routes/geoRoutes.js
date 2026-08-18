
const express = require("express");

const router = express.Router();

const {
  getRegions,
  getChildren,
  createGeoUnit
} = require("../controllers/geoController");

router.post("/", createGeoUnit);

router.get("/regions/:countryId", getRegions);

router.get("/children/:parentId", getChildren);

module.exports = router;
