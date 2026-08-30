const express = require("express");
const { protect } = require("../middleware/auth");
const {
  createPoliticalParty,
} = require("../controllers/partyOrganizationController");

const router = express.Router();

// A certified political-party administrator creates the party here.
// The creator is automatically assigned national_party_admin and
// uses the same /party dashboard as the party itself.
router.post("/", protect, createPoliticalParty);

module.exports = router;
