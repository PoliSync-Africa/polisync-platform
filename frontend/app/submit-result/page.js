"use client";

import { useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import SupportBubble from "../components/SupportBubble";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export default function SubmitResultPage() {
  const [electionId, setElectionId] = useState("");
  const [pollingStationId, setPollingStationId] = useState("");
  const [candidatesText, setCandidatesText] = useState("");
  const [validVotes, setValidVotes] = useState("");
  const [rejectedVotes, setRejectedVotes] = useState("0");
  const [totalBallots, setTotalBallots] = useState("");
  const [pinkFile, setPinkFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const candidates = useMemo(() => {
    return candidatesText.split("\n").map((line) => {
      const [candidateId, candidateName, votes] = line.split("|");
      return { candidateId: (candidateId || "").trim(), candidateName: (candidateName || "").trim(), manualVotes: Number(votes || 0) };
    }).filter((c) => c.candidateId && c.candidateName);
  }, [candidatesText]);

  const manual = useMemo(() => ({
    electionId,
    pollingStationId,
    candidateResults: candidates,
    manualTotals: { totalValidVotes: Number(validVotes || 0), rejectedVotes: Number(rejectedVotes || 0), totalBallots: Number(totalBallots || 0) },
  }), [electionId, pollingStationId, candidates, validVotes, rejectedVotes, totalBallots]);

  function token() {
    return localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || "";
  }

  async function analyzePinkSheet() {
    if (!pinkFile) return setMessage("Add a pink sheet before running the intelligence check.");
    setMessage("Analyzing pink sheet… the uploaded document is processed transiently and is not saved by default.");
    const form = new FormData();
    form.append("pinkSheet", pinkFile);
    form.append("manualResults", JSON.stringify(manual));
    const response = await fetch("/api/ai/verify-pink-sheet", { method: "POST", body: form });
    const data = await response.json();
    if (!response.ok || !data.success) return setMessage(data.message || "Pink-sheet analysis failed.");
    setAnalysis(data.analysis);
    setMessage(data.analysis.status === "match" ? "🟢 Manual result matches the pink sheet." : "🟡 Discrepancy or unreadable value detected. Review before submission.");
  }

  async function submit() {
    if (!electionId || !pollingStationId || !candidates.length) return setMessage("Enter the election, polling station and candidate results.");
    if (Number(validVotes) !== candidates.reduce((s, c) => s + c.manualVotes, 0)) return setMessage("Candidate votes must equal total valid votes.");
    if (Number(validVotes) + Number(rejectedVotes || 0) !== Number(totalBallots)) return setMessage("Valid + rejected ballots must equal total ballots.");
    setSubmitting(true);
    setMessage("Submitting one official result to the PoliSync results pipeline…");
    try {
      if (!API) throw new Error("NEXT_PUBLIC_API_URL is not configured.");
      const response = await fetch(`${API}/api/results/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ ...manual, pinkSheetAnalysis: analysis ? { ...analysis, supplied: true, extractedCandidates: analysis.candidates || [], extractedTotals: analysis.totals || {}, confidence: analysis.confidence, status: analysis.status, documentName: pinkFile?.name || "" } : { supplied: false, status: "not_supplied" } }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Submission failed.");
      setMessage(data.result?.verificationStatus === "verified" ? "🟢 Submitted and verified. Automatically propagated to constituency, region and party." : "✅ Submitted. The receiving dashboards now have the manual result and verification state.");
    } catch (error) { setMessage(error.message); }
    finally { setSubmitting(false); }
  }

  function printPdf(scope = "Polling Station") {
    const rows = candidates.map((c) => `<tr><td>${escapeHtml(c.candidateName)}</td><td>${c.manualVotes}</td><td>${analysis?.candidates?.find(x => String(x.candidateId || x.candidateName).toLowerCase() === String(c.candidateId || c.candidateName).toLowerCase())?.pinkSheetVotes ?? "—"}</td></tr>`).join("");
    const image = pinkFile && pinkFile.type.startsWith("image/") ? `<img src="${URL.createObjectURL(pinkFile)}" style="max-width:100%;max-height:900px;display:block;margin:20px auto" />` : "";
    const html = `<!doctype html><html><head><title>PoliSync Result — ${scope}</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#123}h1{color:#0B3D2E}table{border-collapse:collapse;width:100%;margin:20px 0}th,td{border:1px solid #aaa;padding:10px;text-align:left}th{background:#eee}.meta{line-height:1.7}.status{font-size:20px;font-weight:bold}</style></head><body><h1>POLISYNC AFRICA — ELECTION RESULT REPORT</h1><div class="meta"><b>Scope:</b> ${scope}<br/><b>Election ID:</b> ${escapeHtml(electionId)}<br/><b>Polling Station:</b> ${escapeHtml(pollingStationId)}<br/><b>Generated:</b> ${new Date().toLocaleString()}</div><h2>Manual Result</h2><table><thead><tr><th>Candidate</th><th>Manual votes</th><th>Pink-sheet extracted votes</th></tr></thead><tbody>${rows}</tbody></table><p><b>Total valid:</b> ${validVotes} &nbsp; <b>Rejected:</b> ${rejectedVotes} &nbsp; <b>Total ballots:</b> ${totalBallots}</p><p class="status">Verification: ${analysis?.status === "match" ? "🟢 VERIFIED — MATCH" : analysis ? "🟡 WARNING — REVIEW DISCREPANCY" : "PENDING PINK-SHEET CHECK"}</p><p>${escapeHtml(analysis?.summary || "No pink-sheet analysis supplied.")}</p>${image}<script>window.onload=()=>window.print()</script></body></html>`;
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  }

  return <div style={{ display: "flex", background: "#071D17", minHeight: "100vh", color: "#F5F7F6" }}><Sidebar /><div style={{ flex: 1 }}><Topbar /><main style={{ padding: 30, maxWidth: 1100 }}><h1 style={{ fontSize: 38, color: "#D4AF37", marginBottom: 8 }}>Smart EC8 Result Submission</h1><p style={{ fontSize: 18 }}>Enter the official figures first. Add the pink sheet second. The intelligence check keeps both sources separate.</p>

<section style={card}><h2>1. Manual result — agent entry</h2><input style={input} placeholder="Election ID" value={electionId} onChange={e => setElectionId(e.target.value)} /><input style={input} placeholder="Polling Station ID" value={pollingStationId} onChange={e => setPollingStationId(e.target.value)} /><textarea style={{ ...input, minHeight: 130 }} placeholder={'One candidate per line: candidateId|candidate name|votes'} value={candidatesText} onChange={e => setCandidatesText(e.target.value)} /><div style={grid}><input style={input} type="number" placeholder="Total valid votes" value={validVotes} onChange={e => setValidVotes(e.target.value)} /><input style={input} type="number" placeholder="Rejected votes" value={rejectedVotes} onChange={e => setRejectedVotes(e.target.value)} /><input style={input} type="number" placeholder="Total ballots" value={totalBallots} onChange={e => setTotalBallots(e.target.value)} /></div></section>

<section style={card}><h2>2. Add pink sheet before final submission</h2><p style={{ opacity: .8 }}>The document is not saved by default. It is sent for transient analysis only.</p><div style={grid}><label style={upload}>📷 <b>Camera</b><input hidden type="file" accept="image/*" capture="environment" onChange={e => setPinkFile(e.target.files?.[0] || null)} /></label><label style={upload}>🖼️ <b>Gallery</b><input hidden type="file" accept="image/*" onChange={e => setPinkFile(e.target.files?.[0] || null)} /></label><label style={upload}>📁 <b>Files</b><input hidden type="file" accept="image/*,.pdf" onChange={e => setPinkFile(e.target.files?.[0] || null)} /></label></div>{pinkFile && <p>Selected: <b>{pinkFile.name}</b> ({Math.round(pinkFile.size / 1024)} KB)</p>}<button style={goldButton} onClick={analyzePinkSheet} disabled={!pinkFile}>Run Intelligence Check</button></section>

{analysis && <section style={{ ...card, border: `2px solid ${analysis.status === "match" ? "#35B66F" : "#E2B93B"}` }}><h2>{analysis.status === "match" ? "🟢 VERIFIED" : "🟡 WARNING — REVIEW"}</h2><p>{analysis.summary}</p><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th>Candidate</th><th>Manual</th><th>Pink sheet</th><th>Check</th></tr></thead><tbody>{candidates.map(c => { const p = analysis.candidates?.find(x => String(x.candidateId || x.candidateName).toLowerCase() === String(c.candidateId || c.candidateName).toLowerCase()); return <tr key={c.candidateId}><td>{c.candidateName}</td><td>{c.manualVotes}</td><td>{p?.pinkSheetVotes ?? "Unreadable"}</td><td>{p?.comparisonStatus === "match" ? "🟢" : "🟡"}</td></tr>; })}</tbody></table></section>}

<section style={card}><h2>3. Final submission & document reports</h2><button style={goldButton} onClick={submit} disabled={submitting}>{submitting ? "Submitting…" : "Submit Official Result Once"}</button><div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}><button style={darkButton} onClick={() => printPdf("Polling Station")}>Save / Download Polling Station PDF</button><button style={darkButton} onClick={() => printPdf("Constituency")}>Save / Download Constituency PDF</button><button style={darkButton} onClick={() => printPdf("Region")}>Save / Download Region PDF</button></div><p aria-live="polite" style={{ marginTop: 16, fontWeight: 600 }}>{message}</p></section>
</main><SupportBubble /></div></div>;
}

function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c])); }

const card = { background: "#0D2B23", borderRadius: 20, padding: 24, marginTop: 22, border: "1px solid #31584B" };
const input = { width: "100%", boxSizing: "border-box", padding: 15, marginTop: 10, borderRadius: 10, border: "1px solid #5A7A70", background: "#071D17", color: "#fff", fontSize: 16 };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginTop: 10 };
const upload = { minHeight: 70, border: "1px dashed #D4AF37", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", padding: 10 };
const goldButton = { marginTop: 16, padding: "15px 22px", border: 0, borderRadius: 10, background: "#D4AF37", color: "#071D17", fontWeight: 800, fontSize: 16, cursor: "pointer" };
const darkButton = { padding: "13px 16px", borderRadius: 10, border: "1px solid #D4AF37", background: "transparent", color: "#F5F7F6", fontWeight: 700, cursor: "pointer" };
