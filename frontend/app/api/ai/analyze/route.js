import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const prompt = String(body?.prompt || "").trim();
    const role = String(body?.role || "user").trim();

    if (!prompt) {
      return NextResponse.json(
        { success: false, message: "Please enter something for PoliSync AI to analyze." },
        { status: 400 }
      );
    }

    if (prompt.length > 10000) {
      return NextResponse.json(
        { success: false, message: "Your AI request is too long." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "PoliSync AI is not configured yet. GEMINI_API_KEY is missing.",
        },
        { status: 503 }
      );
    }

    const systemPrompt = `
You are PoliSync AI, the intelligence assistant for PoliSync Africa — Africa's Political Intelligence Platform.

Your role is: ${role}

You may help with general questions, political research, election intelligence,
election-result analysis, voter-turnout analysis, data analysis, trend identification,
research summaries, reports, and clear explanations.

Rules:
1. Give accurate, useful and understandable answers.
2. Do not invent election results or statistics.
3. Clearly distinguish known information from assumptions.
4. When analysing user-supplied data, use only that information unless broader research is explicitly requested.
5. Do not request or expose passwords, authentication codes, financial credentials, or other sensitive information.
6. Do not claim PoliSync has data that has not actually been supplied.
7. Remain neutral and analytical when discussing elections.
8. Structure longer answers with headings and bullet points where useful.
`;

    // Gemini 2.5 Flash is restricted for new users. Gemini 3.6 Flash is a
    // current stable model and has a documented free tier.
    const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      }
    );

    let data;
    try {
      data = await response.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "PoliSync AI returned an invalid response." },
        { status: 502 }
      );
    }

    if (!response.ok) {
      console.error("PoliSync Gemini API error:", data);
      return NextResponse.json(
        {
          success: false,
          message: data?.error?.message || "PoliSync AI could not complete the analysis.",
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
        { success: false, message: "PoliSync AI returned no analysis." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { analysis: answer, response: answer, answer },
        meta: { provider: "Google Gemini", model, role },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PoliSync AI Analyzer route error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to connect to PoliSync AI. Please try again." },
      { status: 500 }
    );
  }
}
