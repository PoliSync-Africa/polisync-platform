import { NextResponse } from "next/server";

export const runtime = "nodejs";

function jsonResponse(payload, status = 200) {
  return NextResponse.json(payload, { status });
}

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return jsonResponse({ success: false, message: "GEMINI_API_KEY is not configured." }, 503);

    const form = await request.formData();
    const file = form.get("pinkSheet");
    const manual = JSON.parse(String(form.get("manualResults") || "{}"));

    if (!file || typeof file.arrayBuffer !== "function") {
      return jsonResponse({ success: false, message: "Please attach a pink sheet before verification." }, 400);
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      return jsonResponse({ success: false, message: "Use a JPG, PNG, WEBP image or PDF pink sheet." }, 400);
    }
    if (file.size > 15 * 1024 * 1024) {
      return jsonResponse({ success: false, message: "Pink sheet must be 15 MB or smaller." }, 400);
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const base64 = bytes.toString("base64");
    const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";

    const prompt = `You are the PoliSync election-document verification engine. Examine the attached EC pink sheet and extract only figures that are actually visible. Do not guess unreadable handwriting. Compare it with the MANUALLY TYPED result supplied below.

MANUAL RESULT:
${JSON.stringify(manual, null, 2)}

Return ONLY valid JSON with this shape:
{
  "status":"match|discrepancy|unreadable",
  "confidence":0.0,
  "candidates":[{"candidateId":"...","candidateName":"...","pinkSheetVotes":0,"comparisonStatus":"match|discrepancy|unreadable"}],
  "totals":{"totalValidVotes":0,"rejectedVotes":0,"totalBallots":0},
  "discrepancies":[{"field":"...","manual":0,"pinkSheet":0,"reason":"..."}],
  "summary":"..."
}

Rules: preserve the manual values exactly; never change them. If a value cannot be read confidently, mark it unreadable instead of guessing. Candidate matching may use candidate name or candidateId supplied in the manual result.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { mimeType: file.type, data: base64 } },
            ],
          }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error("Gemini pink-sheet verification error:", data);
      return jsonResponse({ success: false, message: data?.error?.message || "Pink-sheet analysis failed." }, response.status);
    }

    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim();
    if (!text) return jsonResponse({ success: false, message: "The document could not be analyzed." }, 502);

    let analysis;
    try { analysis = JSON.parse(text); }
    catch { return jsonResponse({ success: false, message: "The AI returned an invalid verification result." }, 502); }

    // The uploaded file is intentionally never persisted by this route.
    return jsonResponse({
      success: true,
      analysis: {
        ...analysis,
        supplied: true,
        status: analysis.status || "unreadable",
        documentName: file.name || "pink-sheet",
      },
      persistedDocument: false,
    });
  } catch (error) {
    console.error("verify-pink-sheet:", error);
    return jsonResponse({ success: false, message: "Unable to analyze the pink sheet." }, 500);
  }
}
