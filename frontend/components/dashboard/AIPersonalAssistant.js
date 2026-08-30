"use client";

import { useEffect, useState } from "react";

export default function AIPersonalAssistant() {
  const [allowed, setAllowed] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("polisync_user") || sessionStorage.getItem("polisync_user");
      const user = raw ? JSON.parse(raw) : null;
      setAllowed(user?.platformRole === "super_admin");
    } catch { setAllowed(false); }
  }, []);

  if (!allowed) return null;

  async function ask(event) {
    event.preventDefault();
    const text = question.trim();
    if (!text || loading) return;
    setLoading(true); setAnswer("");
    try {
      const raw = localStorage.getItem("polisync_user") || sessionStorage.getItem("polisync_user");
      const user = raw ? JSON.parse(raw) : {};
      const response = await fetch("/api/ai/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: text, history, context: { role: "super_admin", userId: user?.id || user?._id || "" } }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) throw new Error(data?.message || "AI Assistant could not respond.");
      const next = data?.data?.answer || data?.data?.response || "";
      setAnswer(next);
      setHistory((items) => [...items.slice(-10), { type: "user", text }, { type: "assistant", text: next }]);
      setQuestion("");
    } catch (error) { setAnswer(error.message || "Unable to connect to the AI Assistant."); }
    finally { setLoading(false); }
  }

  return <section style={{ padding: 18, borderRadius: 18, background: "linear-gradient(135deg,#04351a,#075f2b)", border: "1px solid #c9a227", color: "#fff" }}>
    <span style={{ color: "#e6c85a", fontSize: 10, fontWeight: 900, letterSpacing: 1.4 }}>POLISYNC AFRICA • SUPER ADMIN AI</span>
    <h2 style={{ margin: "7px 0", fontSize: 21 }}>AI Personal Assistant</h2>
    <p style={{ color: "rgba(255,255,255,.75)", fontSize: 12 }}>Private platform-management assistant available only to the PoliSync Africa Super Admin.</p>
    <form onSubmit={ask} style={{ display: "flex", gap: 8, marginTop: 12 }}><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask about platform operations..." style={{ flex: 1, padding: 12, borderRadius: 10, border: 0 }} /><button disabled={loading} style={{ padding: "0 15px", borderRadius: 10, border: "1px solid #c9a227", background: "#c9a227", color: "#04351a", fontWeight: 900 }}>{loading?"...":"Ask"}</button></form>
    {answer && <div style={{ marginTop: 12, padding: 13, borderRadius: 11, background: "rgba(255,255,255,.09)", lineHeight: 1.55, fontSize: 12, whiteSpace: "pre-wrap" }}>{answer}</div>}
  </section>;
}
