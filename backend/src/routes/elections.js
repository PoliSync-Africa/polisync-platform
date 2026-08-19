const express = require("express");
const {
  createElection,
  getElections,
  getElectionById,
  updateElectionStatus
} = require("../controllers/electionController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Status check
router.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Election routes ready"
  });
});

// List all elections
router.get("/all", protect, getElections);

// Get a single election
router.get("/:id", protect, getElectionById);

// Create a new election
router.post(
  "/create",
  protect,
  authorize("super_admin", "country_admin"),
  createElection
);

// Update election status
router.patch(
  "/:id/status",
  protect,
  authorize("super_admin", "country_admin"),
  updateElectionStatus
);

module.exports = router;
