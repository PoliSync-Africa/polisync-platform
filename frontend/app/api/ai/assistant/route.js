import { NextResponse } from "next/server";

export const runtime = "nodejs";

function cleanText(value, maxLength = 4000) {
  return String(value || "").trim().slice(0, maxLength);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const question = cleanText(body?.question, 4000);
    const role = cleanText(body?.context?.role || "user", 100);
    const userId = cleanText(body?.context?.userId || "", 200);
    const history = Array.isArray(body?.history) ? body.history : [];

    if (!question) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a question for your personal assistant.",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            "PoliSync Personal AI is not configured yet. GEMINI_API_KEY is missing.",
        },
        { status: 503 }
      );
    }

    const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";

    const systemPrompt = `
You are PoliSync Personal AI Assistant, a secure personal assistant built into PoliSync Africa.

USER CONTEXT
- Role: ${role}
- User identifier: ${userId || "not supplied"}

YOUR JOB
Help the signed-in PoliSync user understand and use the platform, organize tasks, explain features, summarize information they provide, and answer general questions.

IMPORTANT BEHAVIOUR
1. Be helpful, concise and conversational.
2. Remember the conversation context supplied in the request and use it naturally.
3. Never invent access to the user's reminders, calendar, notifications, profile, messages, election records, private data or other account information.
4. If the user asks about account data that has not been supplied, clearly say that you do not currently have direct access to that data.
5. Never claim that you completed an action unless the application actually performed that action.
6. Never expose passwords, OTPs, API keys, authentication tokens, financial credentials or other secrets.
7. For political and election topics, remain neutral, factual and analytical.
8. If the user supplies election or political data, analyze only the supplied information unless they explicitly ask for broader research.
9. If a request is ambiguous, ask a short clarifying question instead of guessing.
10. Do not mention internal API keys, environment variables or implementation details unless the user is explicitly asking about development.
11. Format longer answers with short headings or bullet points when useful.
12. The assistant is not an autonomous agent yet: it cannot create reminders, send messages, change account settings or modify records unless a connected application tool explicitly performs that action.

PERSONALIZATION
Address the user naturally and adapt answers to their PoliSync role when that context is relevant. Do not pretend to know personal information that has not been supplied in the request or conversation history.
`;

    const recentHistory = history
      .slice(-12)
      .map((message) => {
        const speaker = message?.type === "assistant" ? "Assistant" : "User";
        const text = cleanText(message?.text, 1500);
        return text ? `${speaker}: ${text}` : "";
      })
      .filter(Boolean)
      .join("\n");

    const fullPrompt = recentHistory
      ? `Recent conversation:\n${recentHistory}\n\nUser's new question:\n${question}`
      : question;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: fullPrompt }],
            },
          ],
        }),
      }
    );

    let data = {};

    try {
      data = await response.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "PoliSync Personal AI returned an invalid response.",
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      console.error("PoliSync Personal AI Gemini error:", data);

      return NextResponse.json(
        {
          success: false,
          message:
            data?.error?.message ||
            "PoliSync Personal AI could not complete the request.",
        },
        { status: response.status }
      );
    }

    const answer = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .join("")
      .trim();

    if (!answer) {
      return NextResponse.json(
        {
          success: false,
          message: "PoliSync Personal AI returned no answer.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          response: answer,
          answer,
        },
        meta: {
          provider: "Google Gemini",
          model,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PoliSync Personal AI route error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to connect to PoliSync Personal AI. Please try again.",
      },
      { status: 500 }
    );
  }
}
