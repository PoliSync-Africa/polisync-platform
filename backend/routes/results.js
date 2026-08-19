const express = require("express");
const {
  submitResult,
  getElectionResults,
  verifyResult
} = require("../controllers/resultController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Results routes ready"
  });
});

router.post(
  "/submit",
  protect,
  authorize("polling_station_agent", "constituency_officer"),
  submitResult
);

router.get(
  "/election/:electionId",
  protect,
  getElectionResults
);

router.patch(
  "/verify/:id",
  protect,
  authorize(
    "regional_admin",
    "country_admin",
    "super_admin"
  ),
  verifyResult
);

module.exports = router;
