const express = require("express");

const router = express.Router();

const {
  protect,
  authorize
} = require("../middleware/authMiddleware");

const resultsController = require("../controllers/resultController");

// API Status
router.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Election Results API Ready"
  });
});

// Dashboard
router.get(
  "/dashboard",
  protect,
  resultsController.dashboard
);

// View All Results
router.get(
  "/all",
  protect,
  resultsController.getResults
);

// View Results for One Election
router.get(
  "/election/:electionId",
  protect,
  resultsController.getElectionResults
);

// Secure Submission
router.post(
  "/submit",
  protect,
  authorize(
    "polling_station_agent",
    "party_admin",
    "regional_admin",
    "country_admin",
    "super_admin"
  ),
  resultsController.submitResult
);

// Verify Result
router.patch(
  "/verify/:id",
  protect,
  authorize(
    "regional_admin",
    "country_admin",
    "super_admin"
  ),
  resultsController.verifyResult
);

module.exports = router;
