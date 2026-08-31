"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../../../components/dashboard/DashboardShell";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const getToken = () => typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || "";

export default function EC8VerificationPage() {
  const [results, setResults] = useState([]);
  const [totals, setTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/api/results/admin/ec8`, { headers: { Accept: "application/json", Authorization: `Bearer ${getToken()}` } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || `Unable to load EC8 records (${response.status}).`);
      setResults(data.results || []); setTotals(data.totals || {});
    } catch (e) { setError(e.message || "Unable to load EC8 verification."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return <DashboardShell role="super_admin" title="EC8 Verification" subtitle="Review pink-sheet/EC8 extraction and comparison data" activeSection="ec8"><main className="page"><header><div><span>EC8 / PINK-SHEET CONTROL</span><h2>EC8 Verification</h2><p>Only results with a supplied pink-sheet analysis appear here.</p></div><button onClick={load} disabled={loading}>{loading ? "Loading…" : "↻ Refresh"}</button></header><section className="stats"><Stat label="Records" value={totals.total}/><Stat label="Complete" value={totals.complete}/><Stat label="Processing" value={totals.processing}/><Stat label="Matches" value={totals.match}/><Stat label="Discrepancies" value={totals.discrepancy}/></section>{error && <div className="error">{error}</div>}{loading ? <div className="state">Loading EC8 records…</div> : results.length === 0 ? <div className="state">No EC8/pink-sheet records have been supplied yet.</div> : <section className="list">{results.map((r) => { const mismatch=(r.candidateResults||[]).filter(c=>c.comparisonStatus!=="match").length; return <article className="card" key={r._id}><div><span className="kicker">{r.pollingStationCode}</span><h3>{r.organizationId?.name || "Organization"}</h3><p>{r.electionId?.name || "Election"}{r.electionId?.year ? ` • ${r.electionId.year}` : ""} • {r.pollingStationId?.name || "Polling station"}</p></div><div className="metrics"><strong>{r.pinkSheetAnalysis?.status || "unknown"}</strong><span>{mismatch ? `${mismatch} comparison issue(s)` : "All candidate comparisons match"}</span><small>{r.pinkSheetAnalysis?.documentName || "Document name not recorded"}</small></div></article>})}</section>}</main><style jsx>{styles}</style></DashboardShell>;
}
function Stat({label,value}){return <div className="stat"><span>{label}</span><strong>{Number(value||0).toLocaleString()}</strong></div>}
const styles=`.page{min-height:100%;padding:clamp(14px,2.5vw,32px);background:#f5f8f6;color:#26332b;box-sizing:border-box}.page>header{display:flex;justify-content:space-between;gap:15px;align-items:flex-start}.page>header span{color:#c9a227;font-size:9px;font-weight:900;letter-spacing:1.4px}.page h2{margin:6px 0;color:#075f2b;font-size:30px}.page p{margin:0;color:#6f7c74;font-size:11px}.page>header button{border:0;border-radius:8px;background:#075f2b;color:#fff;padding:9px 11px;font-size:9px;font-weight:800}.stats{display:grid;grid-template-columns:repeat(5,1fr);gap:9px;margin:14px 0}.stat{padding:13px;border:1px solid #dce6df;border-radius:11px;background:#fff}.stat span{display:block;color:#7b8780;font-size:8px}.stat strong{display:block;margin-top:4px;color:#075f2b;font-size:20px}.list{display:grid;gap:9px}.card{display:flex;justify-content:space-between;gap:15px;padding:15px;border:1px solid #dce6df;border-radius:13px;background:#fff}.kicker{color:#c9a227;font-size:8px;font-weight:900}.card h3{margin:5px 0 3px;color:#26332b;font-size:14px}.card p{font-size:9px}.metrics{text-align:right}.metrics strong,.metrics span,.metrics small{display:block}.metrics strong{color:#075f2b;font-size:11px}.metrics span{margin-top:4px;color:#6f7c74;font-size:9px}.metrics small{margin-top:5px;color:#98a19c;font-size:8px}.error,.state{padding:13px;border-radius:10px;border:1px solid #dce6df;background:#fff;text-align:center;font-size:9px}.error{background:#fff5f5;color:#a00000;border-color:#efd0d0}@media(max-width:700px){.stats{grid-template-columns:repeat(2,1fr)}.card{display:block}.metrics{text-align:left;margin-top:10px}.page>header{display:block}.page>header button{margin-top:10px}}@media(max-width:480px){.stats{grid-template-columns:1fr}}`;
