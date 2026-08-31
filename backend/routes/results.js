const express = require("express");
const { submitResult, getResults } = require("../controllers/resultsController");
const { dashboard } = require("../controllers/resultsDashboardController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", (req, res) => res.json({ status: "success", message: "Results routes ready" }));

// A polling-station agent submits once. The controller verifies the agent's
// approved OrganizationMembership for the supplied polling station.
router.post("/submit", protect, submitResult);

router.get("/election/:electionId", protect, getResults);
router.get("/dashboard", protect, authorize("super_admin"), dashboard);

module.exports = router;
