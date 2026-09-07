const express = require("express");
const controller = require("../controllers/electoralGeographyController");

const router = express.Router();

// Electoral geography is public reference data. Write/sync operations remain protected elsewhere.
router.get("/summary", controller.summary);
router.get("/regions", controller.regions);
router.get("/regions/:regionId/constituencies", controller.constituencies);
router.get("/constituencies/:regionId", controller.constituencies);
router.get("/constituencies/:constituencyId/polling-stations", controller.pollingStations);
router.get("/polling-stations", controller.pollingStations);
router.get("/polling-stations/:stationId", controller.station);
router.get("/search", controller.search);

module.exports = router;
