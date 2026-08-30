import { NextResponse } from "next/server";

export const runtime = "nodejs";

function cleanText(value, maxLength = 4000) { return String(value || "").trim().slice(0, maxLength); }

export async function POST(request) {
  try {
    const authorization = request.headers.get("authorization") || "";
    if (!authorization.startsWith("Bearer ")) return NextResponse.json({ success:false, message:"Authentication required." }, { status:401 });

    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
    if (!backendUrl) return NextResponse.json({ success:false, message:"Backend API URL is not configured." }, { status:503 });

    const meResponse = await fetch(`${backendUrl}/api/auth/me`, { headers: { Authorization: authorization, Accept: "application/json" }, cache: "no-store" });
    const me = await meResponse.json().catch(() => ({}));
    const user = me?.user || me?.data?.user || me?.data || null;
    if (!meResponse.ok || user?.platformRole !== "super_admin") return NextResponse.json({ success:false, message:"Only the PoliSync Africa Super Admin can use the AI Personal Assistant." }, { status:403 });

    const body = await request.json();
    const question = cleanText(body?.question, 4000);
    const history = Array.isArray(body?.history) ? body.history : [];
    if (!question) return NextResponse.json({ success:false, message:"Please enter a question for your personal assistant." }, { status:400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ success:false, message:"PoliSync Personal AI is not configured yet." }, { status:503 });
    const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
    const systemPrompt = `You are PoliSync Africa's private Super Admin AI Personal Assistant. The authenticated user is the PoliSync Africa Super Admin. Help with platform operations, organization administration, security, system design, summaries and development planning. Be neutral and factual on political topics. Never invent access to data, never expose secrets, and never claim an action was completed unless a connected tool actually performed it.`;
    const recentHistory = history.slice(-12).map((m) => `${m?.type === "assistant" ? "Assistant" : "User"}: ${cleanText(m?.text,1500)}`).filter(Boolean).join("\n");
    const fullPrompt = recentHistory ? `Recent conversation:\n${recentHistory}\n\nUser's new question:\n${question}` : question;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ systemInstruction:{parts:[{text:systemPrompt}]}, contents:[{role:"user",parts:[{text:fullPrompt}]}] }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ success:false, message:data?.error?.message||"PoliSync Personal AI could not complete the request." }, { status:response.status });
    const answer = data?.candidates?.[0]?.content?.parts?.map((p)=>p?.text||"").join("").trim();
    if (!answer) return NextResponse.json({ success:false, message:"PoliSync Personal AI returned no answer." }, { status:502 });
    return NextResponse.json({ success:true, data:{response:answer,answer}, meta:{provider:"Google Gemini",model} });
  } catch (error) {
    console.error("PoliSync Personal AI route error:", error);
    return NextResponse.json({ success:false, message:"Unable to connect to PoliSync Personal AI." }, { status:500 });
  }
}
