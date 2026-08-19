const express = require("express");

const {
  createPollingStation,
  getPollingStations,
  getPollingStation,
  updatePollingStation,
  assignAgents,
  activatePollingStation,
  deactivatePollingStation,
  deletePollingStation
} = require("../controllers/pollingStationController");

const {
  protect,
  authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

// API Status
router.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Polling Station API Ready"
  });
});

// Get polling stations
router.get(
  "/all",
  protect,
  getPollingStations
);

// Get one polling station
router.get(
  "/:id",
  protect,
  getPollingStation
);

// Create polling station
router.post(
  "/create",
  protect,
  authorize(
    "super_admin",
    "country_admin",
    "regional_admin",
    "constituency_officer"
  ),
  createPollingStation
);

// Update polling station
router.patch(
  "/:id",
  protect,
  authorize(
    "super_admin",
    "country_admin",
    "regional_admin",
    "constituency_officer"
  ),
  updatePollingStation
);

// Assign polling station agents
router.patch(
  "/:id/agents",
  protect,
  authorize(
    "super_admin",
    "country_admin",
    "regional_admin",
    "constituency_officer"
  ),
  assignAgents
);

// Activate polling station
router.patch(
  "/:id/activate",
  protect,
  authorize(
    "super_admin",
    "country_admin",
    "regional_admin",
    "constituency_officer"
  ),
  activatePollingStation
);

// Deactivate polling station
router.patch(
  "/:id/deactivate",
  protect,
  authorize(
    "super_admin",
    "country_admin",
    "regional_admin",
    "constituency_officer"
  ),
  deactivatePollingStation
);

// Delete polling station
router.delete(
  "/:id",
  protect,
  authorize(
    "super_admin",
    "country_admin"
  ),
  deletePollingStation
);

module.exports = router;
