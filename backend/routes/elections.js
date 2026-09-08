const express = require("express");
const router = express.Router();
const electionController = require("../controllers/electionController");
const electionCandidateController = require("../controllers/electionCandidateController");
const { protect } = require("../middleware/auth");
const { synchronizeAllElectionGeography } = require("../services/electionGeographySyncService");

const syncGeography = async (req, res, next) => {
  try {
    await synchronizeAllElectionGeography();
    next();
  } catch (error) {
    next(error);
  }
};

router.get("/access", protect, electionController.getElectionAccess);
router.get("/parties", protect, electionController.getPoliticalParties);
router.post("/parties", protect, electionController.createPoliticalParty);
router.patch("/parties/:partyId/logo", protect, electionController.updatePoliticalPartyLogo);
router.get("/", protect, syncGeography, electionController.getElections);
router.get("/live", protect, syncGeography, electionController.getLiveElections);
router.get("/history", protect, syncGeography, electionController.getElectionHistory);
router.get("/:id", protect, syncGeography, electionController.getElection);
router.post("/create", protect, electionController.createElection);
router.patch("/:id/candidates", protect, electionCandidateController.updateCandidates);
router.patch("/:id", protect, electionController.updateElection);
router.delete("/:id", protect, electionController.deleteElection);

module.exports = router;
