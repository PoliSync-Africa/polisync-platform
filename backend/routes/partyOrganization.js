const express = require("express");
const { protect } = require("../middleware/auth");
const {
  createPoliticalParty,
  getMyPartyDashboard,
} = require("../controllers/partyOrganizationController");

const router = express.Router();

router.post("/", protect, createPoliticalParty);
router.get("/me/dashboard", protect, getMyPartyDashboard);

module.exports = router;
