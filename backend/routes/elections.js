const express = require("express");
const router = express.Router();

const electionController = require("../controllers/electionController");
const { protect } = require("../middleware/auth");

// Election records are authenticated resources. The controller returns only
// platform elections or organizational elections the current user is assigned
// to through an approved election-duty membership.
router.get("/access", protect, electionController.getElectionAccess);
router.get("/", protect, electionController.getElections);
router.get("/live", protect, electionController.getLiveElections);
router.get("/history", protect, electionController.getElectionHistory);
router.get("/:id", protect, electionController.getElection);

// Super Admin and approved national organization administrators may manage
// elections. The controller scopes organization users to their own organization.
router.post("/create", protect, electionController.createElection);
router.patch("/:id", protect, electionController.updateElection);
router.delete("/:id", protect, electionController.deleteElection);

module.exports = router;
