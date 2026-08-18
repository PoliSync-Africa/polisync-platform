module.exports = {
  provider: process.env.AI_PROVIDER || "openai",
  model: process.env.AI_MODEL || "gpt-5.6",
  temperature: 0.2,
  maxTokens: 2000,
};
