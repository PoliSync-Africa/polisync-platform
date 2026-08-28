const express = require("express");
const {
  submitResult,
  getResults,
  dashboard,
} = require("../controllers/resultsController");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Results routes ready",
  });
});

router.post(
  "/submit",
  protect,
  authorize("polling_station_agent", "constituency_officer"),
  submitResult
);

// NOTE: the original route filtered results by :electionId, but the
// Result model only stores electionYear/electionType (no electionId),
// and there is no verifyResult handler yet. Wired to the closest
// existing controller functions so this router loads without
// crashing; a real per-election filter and a verify/approve workflow
// still need to be implemented against the Result model.
router.get("/election/:electionId", protect, getResults);

router.get("/dashboard", protect, dashboard);

module.exports = router;
