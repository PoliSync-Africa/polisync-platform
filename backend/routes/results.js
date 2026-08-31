const express = require("express");
const OrganizationMembership = require("../models/OrganizationMembership");
const { submitResult, getResults } = require("../controllers/resultsController");
const { dashboard } = require("../controllers/resultsDashboardController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", (req, res) => res.json({ status: "success", message: "Results routes ready" }));

// The platform role is "user" for polling-station agents. Their actual
// organizational role lives in OrganizationMembership, so resolve that role
// before the legacy controller checks req.user.role.
const markPollingStationAgent = async (req, res, next) => {
  try {
    const pollingStationId = req.body?.pollingStationId;
    if (!pollingStationId) return res.status(400).json({ success: false, message: "Polling station is required." });

    const membership = await OrganizationMembership.findOne({
      userId: req.user._id,
      role: "polling_station_agent",
      pollingStationId,
      status: "approved",
    }).lean();

    if (!membership) return res.status(403).json({ success: false, message: "You are not an approved polling-station agent for this station." });

    req.user.role = "polling_station_agent";
    next();
  } catch (error) {
    console.error("Polling-station result authorization error:", error);
    return res.status(500).json({ success: false, message: "Unable to verify polling-station assignment." });
  }
};

router.post("/submit", protect, markPollingStationAgent, submitResult);
router.get("/election/:electionId", protect, getResults);
router.get("/dashboard", protect, authorize("super_admin"), dashboard);

module.exports = router;
