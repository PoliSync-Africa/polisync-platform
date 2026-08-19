const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/auth");
const resultsController = require("../controllers/resultsController");

// API Status
router.get("/", (req, res) => { 
  res.json({
    status: "success",
    message: "Election Results API Ready"
  });
});

// Dashboard
router.get("/dashboard", resultsController.dashboard);

// View Results
router.get("/all", resultsController.getResults);

// Secure Submission
router.post(
  "/submit",
  protect,
  authorize("polling_agent", "party_admin", "super_admin"),
  resultsController.submitResult
);

module.exports = router;
