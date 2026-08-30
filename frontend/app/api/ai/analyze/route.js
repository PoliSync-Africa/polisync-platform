import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();

    const prompt = String(body?.prompt || "").trim();
    const role = String(body?.role || "user").trim();

    if (!prompt) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter something for PoliSync AI to analyze.",
        },
        { status: 400 }
      );
    }

    if (prompt.length > 10000) {
      return NextResponse.json(
        {
          success: false,
          message: "Your AI request is too long.",
        },
        { status: 400 }
      );
    }

    /*
     * ----------------------------------------------------------
     * OPENAI CONFIGURATION
     * ----------------------------------------------------------
     */

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            "PoliSync AI is not configured yet. OPENAI_API_KEY is missing.",
        },
        { status: 503 }
      );
    }

    /*
     * ----------------------------------------------------------
     * POLISYNC AI SYSTEM INSTRUCTIONS
     * ----------------------------------------------------------
     */

    const systemPrompt = `
You are PoliSync AI, the intelligence assistant for
PoliSync Africa — Africa's Political Intelligence Platform.

Your role is:
${role}

You may help with:

- General questions
- Political research
- Election intelligence
- Election-result analysis
- Voter-turnout analysis
- Data analysis
- Trend identification
- Research summaries
- Reports
- Clear explanations

Important rules:

1. Give accurate, useful and understandable answers.
2. Do not invent election results or statistics.
3. Clearly distinguish known information from assumptions.
4. When analysing data supplied by the user, use only the
   information provided unless the user explicitly asks for
   broader research.
5. Do not request or expose passwords, authentication codes,
   financial credentials or other sensitive information.
6. Do not claim that PoliSync has data that has not actually
   been supplied to you.
7. For election information, remain neutral and analytical.
8. Structure longer answers with headings and bullet points
   where useful.
`;

    /*
     * ----------------------------------------------------------
     * OPENAI REQUEST
     * ----------------------------------------------------------
     */

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },

        body: JSON.stringify({
          model:
            process.env.OPENAI_MODEL || "gpt-4o-mini",

          temperature: 0.2,

          messages: [
            {
              role: "system",
              content: systemPrompt,
            },

            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      }
    );

    /*
     * ----------------------------------------------------------
     * READ OPENAI RESPONSE
     * ----------------------------------------------------------
     */

    let data;

    try {
      data = await response.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "PoliSync AI returned an invalid response.",
        },
        { status: 502 }
      );
    }

    /*
     * ----------------------------------------------------------
     * OPENAI ERROR
     * ----------------------------------------------------------
     */

    if (!response.ok) {
      console.error(
        "PoliSync OpenAI API error:",
        data
      );

      return NextResponse.json(
        {
          success: false,
          message:
            data?.error?.message ||
            "PoliSync AI could not complete the analysis.",
        },
        { status: response.status }
      );
    }

    /*
     * ----------------------------------------------------------
     * EXTRACT ANSWER
     * ----------------------------------------------------------
     */

    const answer =
      data?.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return NextResponse.json(
        {
          success: false,
          message:
            "PoliSync AI returned no analysis.",
        },
        { status: 502 }
      );
    }

    /*
     * ----------------------------------------------------------
     * SUCCESS
     * ----------------------------------------------------------
     */

    return NextResponse.json(
      {
        success: true,

        data: {
          analysis: answer,
          response: answer,
          answer,
        },

        meta: {
          provider: "OpenAI",
          model:
            process.env.OPENAI_MODEL ||
            "gpt-4o-mini",
          role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "PoliSync AI Analyzer route error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to connect to PoliSync AI. Please try again.",
      },
      { status: 500 }
    );
  }
}
