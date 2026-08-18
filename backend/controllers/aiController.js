const ai = require("../services/ai");

exports.askAssistant = async (req, res) => {
  const response = await ai.assistantService.ask(req.body.question);

  res.json({
    success: true,
    data: response,
  });
};

exports.generateBriefing = async (req, res) => {
  const briefing =
    await ai.briefingGenerator.generateRegionalBriefing(
      req.body.region
    );

  res.json({
    success: true,
    data: briefing,
  });
};
