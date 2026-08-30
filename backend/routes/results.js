const express = require("express");
const { submitResult, getResults, dashboard } = require("../controllers/resultsController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", (req, res) => res.json({ status: "success", message: "Results routes ready" }));

// A polling-station agent submits once. The server resolves the station's
// constituency, region and party organization from trusted assignments.
router.post("/submit", protect, authorize("polling_station_agent"), submitResult);

router.get("/election/:electionId", protect, getResults);
router.get("/dashboard", protect, dashboard);

module.exports = router;
