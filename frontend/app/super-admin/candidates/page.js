"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const getToken = () => typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || "";

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [totals, setTotals] = useState({});
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/api/organizations/admin/candidates`, { headers: { Accept: "application/json", Authorization: `Bearer ${getToken()}` } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || `Unable to load candidates (${response.status}).`);
      setCandidates(Array.isArray(data.candidates) ? data.candidates : []); setTotals(data.totals || {});
    } catch (e) { setError(e.message || "Unable to load candidates."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => candidates.filter((item) => {
    const text = `${item.name || ""} ${item.candidate?.fullName || ""} ${item.candidateParty || ""} ${item.region || ""} ${item.constituency || ""}`.toLowerCase();
    return (!query.trim() || text.includes(query.trim().toLowerCase())) && (type === "all" || item.organizationType === type);
  }), [candidates, query, type]);

  return <DashboardShell role="super_admin" title="Candidates" subtitle="Candidate records imported from PoliSync accounts and official registrations" activeSection="candidates"><main className="page"><header className="hero"><div><span>CANDIDATE MANAGEMENT</span><h2>Candidates</h2><p>Candidate records are read from the organization/candidate data model. No demo candidates are shown.</p></div><button onClick={load} disabled={loading}>{loading ? "Loading…" : "↻ Refresh"}</button></header><section className="stats"><Stat label="Total" value={totals.total}/><Stat label="Parliamentary" value={totals.parliamentary}/><Stat label="Presidential" value={totals.presidential}/><Stat label="Verified" value={totals.verified}/><Stat label="Pending" value={totals.pending}/></section><section className="filters"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search candidate, party, region or constituency…"/><select value={type} onChange={(e) => setType(e.target.value)}><option value="all">All candidate types</option><option value="parliamentary_candidate">Parliamentary</option><option value="presidential_candidate">Presidential</option></select></section>{error && <div className="error">{error}</div>}{loading ? <div className="state">Loading candidates…</div> : filtered.length === 0 ? <div className="state">No candidate records match the selected filters.</div> : <section className="card"><div className="table-wrap"><table><thead><tr><th>Candidate</th><th>Type</th><th>Party</th><th>Region</th><th>Constituency</th><th>Registration</th></tr></thead><tbody>{filtered.map((item) => <tr key={item._id}><td><strong>{item.candidate?.fullName || item.name}</strong><small>{item.candidate?.username || item.candidate?.registrationReference || item.slug}</small></td><td>{item.organizationType === "presidential_candidate" ? "Presidential" : "Parliamentary"}</td><td>{item.candidateParty || (item.candidateIsIndependent ? "Independent" : "—")}</td><td>{item.region || "—"}</td><td>{item.constituency || "—"}</td><td><span className={`badge ${item.candidate?.registrationStatus || "not_verified"}`}>{item.candidate?.registrationStatus || "not_verified"}</span></td></tr>)}</tbody></table></div></section>}</main><style jsx>{styles}</style></DashboardShell>;
}
function Stat({label,value}){return <div className="stat"><span>{label}</span><strong>{Number(value||0).toLocaleString()}</strong></div>}
const styles=`.page{min-height:100%;padding:clamp(14px,2.5vw,32px);background:#f5f8f6;box-sizing:border-box;color:#26332b}.hero{display:flex;justify-content:space-between;gap:15px;align-items:flex-start;margin-bottom:18px}.hero span{color:#c9a227;font-size:9px;font-weight:900;letter-spacing:1.4px}.hero h2{margin:5px 0;color:#075f2b;font-size:30px}.hero p{margin:0;color:#6f7c74;font-size:12px}.hero button{border:0;border-radius:9px;background:#075f2b;color:#fff;padding:10px 13px;font-size:10px;font-weight:800}.hero button:disabled{opacity:.6}.stats{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:12px}.stat{padding:14px;border:1px solid #dce6df;border-radius:12px;background:#fff}.stat span{display:block;color:#7b8780;font-size:9px}.stat strong{display:block;margin-top:5px;color:#075f2b;font-size:22px}.filters{display:grid;grid-template-columns:1fr 220px;gap:9px;margin-bottom:12px}.filters input,.filters select{min-height:42px;padding:0 11px;border:1px solid #dce6df;border-radius:9px;background:#fff;font-size:11px}.card{border:1px solid #dce6df;border-radius:15px;background:#fff;overflow:hidden}.table-wrap{overflow:auto}table{width:100%;min-width:850px;border-collapse:collapse}th,td{padding:12px;border-bottom:1px solid #edf1ee;text-align:left;font-size:10px}th{background:#f7faf8;color:#7b8780;font-size:8px;text-transform:uppercase}td strong,td small{display:block}td small{margin-top:3px;color:#98a19c;font-size:8px}.badge{display:inline-block;padding:5px 8px;border-radius:999px;background:#eef3ef;color:#53635a;font-size:8px;font-weight:850}.badge.verified{background:#eaf6ee;color:#075f2b}.badge.pending{background:#fff7df;color:#96720b}.badge.rejected{background:#fff0f0;color:#a00000}.error,.state{padding:14px;border-radius:11px;border:1px solid #dce6df;background:#fff;text-align:center;font-size:10px}.error{color:#a00000;background:#fff5f5;border-color:#efd0d0}@media(max-width:800px){.stats{grid-template-columns:repeat(2,1fr)}.filters{grid-template-columns:1fr}.hero{display:block}.hero button{margin-top:10px}}@media(max-width:520px){.stats{grid-template-columns:1fr}}`;
