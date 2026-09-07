const express = require("express");
const router = express.Router();

const electionController = require("../controllers/electionController");
const { protect, authorize } = require("../middleware/auth");

// Public read access to election records.
router.get("/", electionController.getElections);
router.get("/live", electionController.getLiveElections);
router.get("/history", electionController.getElectionHistory);
router.get("/:id", electionController.getElection);

// Super Admin and approved national organization administrators may manage
// elections. The controller scopes organization users to their own organization.
router.post("/create", protect, electionController.createElection);
router.patch("/:id", protect, electionController.updateElection);
router.delete("/:id", protect, electionController.deleteElection);

module.exports = router;
