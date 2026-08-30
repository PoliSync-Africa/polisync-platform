const express = require("express");
const { protect } = require("../middleware/auth");
const controller = require("../controllers/electoralGeographyController");

const router = express.Router();

// Public electoral geography is readable by authenticated platform users.
router.get("/summary", protect, controller.summary);
router.get("/regions", protect, controller.regions);
router.get("/regions/:regionId/constituencies", protect, controller.constituencies);
router.get("/constituencies/:regionId", protect, controller.constituencies);
router.get("/constituencies/:constituencyId/polling-stations", protect, controller.pollingStations);
router.get("/polling-stations", protect, controller.pollingStations);
router.get("/polling-stations/:stationId", protect, controller.station);
router.get("/search", protect, controller.search);

module.exports = router;
