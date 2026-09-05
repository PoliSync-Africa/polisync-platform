const ai = require("../services/ai");

const getPrompt = (body = {}) => String(body.prompt || body.question || "").trim();

exports.askAssistant = async (req, res) => {
  try {
    const question = getPrompt(req.body);
    if (!question) return res.status(400).json({ success: false, message: "A question is required." });

    const response = await ai.assistantService.ask(question, {
      role: req.body?.role || "user",
      purpose: req.body?.purpose || "general_and_polisync_analysis",
    });

    return res.json({ success: true, data: response });
  } catch (error) {
    console.error("AI assistant error:", error);
    return res.status(error.status || 500).json({ success: false, message: error.message || "AI assistant is unavailable." });
  }
};

exports.analyze = async (req, res) => {
  try {
    const prompt = getPrompt(req.body);
    if (!prompt) return res.status(400).json({ success: false, message: "An analysis prompt is required." });

    const response = await ai.assistantService.ask(prompt, {
      role: req.body?.role || "user",
      purpose: req.body?.purpose || "general_and_polisync_analysis",
    });

    return res.json({ success: true, data: { analysis: response.answer, ...response } });
  } catch (error) {
    console.error("AI analyzer error:", error);
    return res.status(error.status || 500).json({ success: false, message: error.message || "AI analyzer is unavailable." });
  }
};

exports.generateBriefing = async (req, res) => {
  try {
    const briefing = await ai.briefingGenerator.generateRegionalBriefing(req.body?.region);
    return res.json({ success: true, data: briefing });
  } catch (error) {
    console.error("AI briefing error:", error);
    return res.status(error.status || 500).json({ success: false, message: error.message || "AI briefing service is unavailable." });
  }
};
