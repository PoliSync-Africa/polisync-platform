module.exports = {
  // Auto selects Gemini when GEMINI_API_KEY is present, otherwise OpenAI when OPENAI_API_KEY is present.
  provider: process.env.AI_PROVIDER || "auto",
  model: process.env.AI_MODEL || process.env.GEMINI_MODEL || "gemini-3.7-flash",
  temperature: 0.2,
  maxTokens: 2000,
};
