const express = require("express");
const router = express.Router();

const {
  askAssistant,
  generateBriefing,
} = require("../controllers/aiController");

router.post("/assistant", askAssistant);
router.post("/briefing", generateBriefing);

module.exports = router;
