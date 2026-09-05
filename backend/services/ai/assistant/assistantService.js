const config = require("../config/aiConfig");

const normalizeProvider = () => {
  const requested = String(config.provider || "auto").trim().toLowerCase();
  if (requested !== "auto") return requested;
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "none";
};

const buildPrompt = (question, context = {}) => {
  const role = String(context.role || "user");
  const purpose = String(context.purpose || "general_and_polisync_analysis");
  return `You are PoliSync Africa's AI assistant.\nRole: ${role}\nPurpose: ${purpose}\n\nUser request:\n${question}`;
};

async function askGemini(question, context) {
  const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) throw Object.assign(new Error("Gemini AI is not configured. Add GEMINI_API_KEY to the backend environment."), { status: 503 });

  const model = String(config.model || process.env.GEMINI_MODEL || "gemini-3.7-flash");
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: buildPrompt(question, context) }] }],
      generationConfig: {
        temperature: Number(config.temperature ?? 0.2),
        maxOutputTokens: Number(config.maxTokens ?? 2000),
      },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || `Gemini request failed (${response.status}).`;
    throw Object.assign(new Error(message), { status: response.status >= 400 && response.status < 500 ? 502 : 503 });
  }

  const answer = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
  if (!answer) throw Object.assign(new Error("Gemini returned no text response."), { status: 502 });

  return { answer, provider: "gemini", model };
}

async function askOpenAI(question, context) {
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) throw Object.assign(new Error("OpenAI AI is not configured. Add OPENAI_API_KEY to the backend environment."), { status: 503 });

  const model = String(config.model || process.env.OPENAI_MODEL || "gpt-4o-mini");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You are PoliSync Africa's AI assistant. Provide accurate, concise, useful answers and clearly distinguish facts from uncertainty." },
        { role: "user", content: buildPrompt(question, context) },
      ],
      temperature: Number(config.temperature ?? 0.2),
      max_tokens: Number(config.maxTokens ?? 2000),
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || `OpenAI request failed (${response.status}).`;
    throw Object.assign(new Error(message), { status: response.status >= 400 && response.status < 500 ? 502 : 503 });
  }

  const answer = String(data?.choices?.[0]?.message?.content || "").trim();
  if (!answer) throw Object.assign(new Error("OpenAI returned no text response."), { status: 502 });

  return { answer, provider: "openai", model };
}

async function ask(question, context = {}) {
  const normalizedQuestion = String(question || "").trim();
  if (!normalizedQuestion) throw Object.assign(new Error("A question is required."), { status: 400 });

  const provider = normalizeProvider();
  let response;

  if (provider === "gemini") response = await askGemini(normalizedQuestion, context);
  else if (provider === "openai") response = await askOpenAI(normalizedQuestion, context);
  else throw Object.assign(new Error("No AI provider is configured. Add GEMINI_API_KEY or OPENAI_API_KEY to the backend environment."), { status: 503 });

  return {
    question: normalizedQuestion,
    ...response,
  };
}

module.exports = { ask };
