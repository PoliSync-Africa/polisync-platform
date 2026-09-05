const express = require("express");
const OrganizationMembership = require("../models/OrganizationMembership");
const { submitResult, getResults } = require("../controllers/resultsController");
const { dashboard } = require("../controllers/resultsDashboardController");
const { listVerification, updateVerification, listEc8 } = require("../controllers/resultsAdminController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", (req, res) => res.json({ status: "success", message: "Results routes ready" }));

const requirePollingStationAssignment = async (req, res, next) => {
  try {
    const pollingStationId = String(req.body?.pollingStationId || "").trim();
    if (!pollingStationId) return res.status(400).json({ success: false, message: "Polling station is required." });
    const membership = await OrganizationMembership.findOne({ userId: req.user._id, role: "polling_station_agent", pollingStationId, status: "approved" }).lean();
    if (!membership) return res.status(403).json({ success: false, message: "You are not an approved polling-station agent for this station." });
    req.pollingStationMembership = membership;
    next();
  } catch (error) {
    console.error("Polling-station result authorization error:", error);
    return res.status(500).json({ success: false, message: "Unable to verify polling-station assignment." });
  }
};

router.post("/submit", protect, requirePollingStationAssignment, submitResult);
router.get("/election/:electionId", protect, getResults);
router.get("/dashboard", protect, authorize("super_admin"), dashboard);
router.get("/admin/verification", protect, authorize("super_admin"), listVerification);
router.patch("/admin/verification/:resultId", protect, authorize("super_admin"), updateVerification);
router.get("/admin/ec8", protect, authorize("super_admin"), listEc8);

module.exports = router;
