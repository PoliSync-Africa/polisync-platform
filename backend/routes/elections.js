const express = require("express");
const router = express.Router();
const electionController = require("../controllers/electionController");
const { protect } = require("../middleware/auth");

router.get("/access", protect, electionController.getElectionAccess);
router.get("/parties", protect, electionController.getPoliticalParties);
router.post("/parties", protect, electionController.createPoliticalParty);
router.patch("/parties/:partyId/logo", protect, electionController.updatePoliticalPartyLogo);
router.get("/", protect, electionController.getElections);
router.get("/live", protect, electionController.getLiveElections);
router.get("/history", protect, electionController.getElectionHistory);
router.get("/:id", protect, electionController.getElection);
router.post("/create", protect, electionController.createElection);
router.patch("/:id", protect, electionController.updateElection);
router.delete("/:id", protect, electionController.deleteElection);

module.exports = router;
