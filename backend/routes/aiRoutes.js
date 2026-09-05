const express = require("express");
const router = express.Router();

const {
  askAssistant,
  analyze,
  generateBriefing,
} = require("../controllers/aiController");

router.post("/assistant", askAssistant);
router.post("/analyze", analyze);
router.post("/briefing", generateBriefing);

module.exports = router;
