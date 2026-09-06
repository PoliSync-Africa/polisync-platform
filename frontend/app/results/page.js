"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";

const token = () => typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || localStorage.getItem("token") || sessionStorage.getItem("token") || "";
const api = () => String(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const navigation = [{ section: "ELECTION INTELLIGENCE", items: [
  { label: "Dashboard", href: "/dashboard", key: "overview", icon: "⌂" },
  { label: "Elections", href: "/elections", key: "elections", icon: "◎" },
  { label: "Results", href: "/results", key: "results", icon: "↗" },
  { label: "Profile", href: "/profile", key: "profile", icon: "♙" },
  { label: "Privacy & Security", href: "/settings/security", key: "security", icon: "♢" },
]}];

export default function ResultsPage() {
  const [elections, setElections] = useState([]);
  const [selected, setSelected] = useState("");
  const [results, setResults] = useState([]);
  const [state, setState] = useState({ loading: true, resultsLoading: false, error: "" });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`${api()}/api/elections`, { cache: "no-store", headers: { Accept: "application/json" } });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) throw new Error(data?.message || `Unable to load elections (${res.status}).`);
        const rows = Array.isArray(data.elections) ? data.elections : [];
        if (active) { setElections(rows); setSelected(rows[0]?._id || ""); setState({ loading: false, resultsLoading: false, error: "" }); }
      } catch (e) { if (active) setState({ loading: false, resultsLoading: false, error: e.message || "Unable to load elections." }); }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selected) { setResults([]); return undefined; }
    let active = true;
    (async () => {
      const t = token();
      if (!t) { if (active) setState((s) => ({ ...s, resultsLoading: false, error: "Authentication required. Please sign in again." })); return; }
      setState((s) => ({ ...s, resultsLoading: true, error: "" }));
      try {
        const res = await fetch(`${api()}/api/results/election/${encodeURIComponent(selected)}`, { cache: "no-store", headers: { Accept: "application/json", Authorization: `Bearer ${t}` } });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) throw new Error(data?.message || `Unable to load results (${res.status}).`);
        if (active) { setResults(Array.isArray(data.results) ? data.results : []); setState((s) => ({ ...s, resultsLoading: false, error: "" })); }
      } catch (e) { if (active) { setResults([]); setState((s) => ({ ...s, resultsLoading: false, error: e.message || "Unable to load election results." })); } }
    })();
    return () => { active = false; };
  }, [selected]);

  const election = elections.find((item) => String(item._id) === String(selected));
  return <DashboardShell title="Results" subtitle="Review available election results and verification status." role="user" navigation={navigation} activeSection="results">
    <main className="results-page">
      <section className="hero"><span>ELECTION INTELLIGENCE</span><h2>Election Results</h2><p>Access published result records through the authenticated PoliSync workspace.</p></section>
      {state.error && <div className="error">{state.error}</div>}
      <section className="card controls">
        <div><small>SELECT ELECTION</small><strong>{election?.name || "Choose an election"}</strong></div>
        <select value={selected} onChange={(e) => setSelected(e.target.value)} disabled={state.loading || !elections.length}>
          <option value="">{state.loading ? "Loading elections…" : elections.length ? "Select election" : "No elections available"}</option>
          {elections.map((item) => <option key={item._id} value={item._id}>{item.name || "Untitled election"}{item.year ? ` — ${item.year}` : ""}</option>)}
        </select>
      </section>
      <section className="summary-grid">
        {[['Records', results.length], ['Verified', results.filter((r) => r.verificationStatus === 'verified').length], ['Pending', results.filter((r) => !['verified','rejected','discrepancy','disputed'].includes(r.verificationStatus)).length], ['Discrepancies', results.filter((r) => ['discrepancy','disputed'].includes(r.verificationStatus)).length]].map(([label,value]) => <div className="card metric" key={label}><small>{label}</small><strong>{state.resultsLoading ? '—' : Number(value).toLocaleString()}</strong></div>)}
      </section>
      <section className="card records">
        <div className="heading"><div><small>RESULT RECORDS</small><h3>{election?.name || "Results"}</h3></div><span>{state.resultsLoading ? "Loading…" : `${results.length} record${results.length === 1 ? "" : "s"}`}</span></div>
        {!selected ? <p className="empty">Select an election to view its available result records.</p> : state.resultsLoading ? <p className="empty">Loading election results…</p> : !results.length ? <p className="empty">No result records are available for this election yet.</p> : <div className="table-wrap"><table><thead><tr><th>Station</th><th>Region</th><th>Constituency</th><th>Valid Votes</th><th>Status</th></tr></thead><tbody>{results.map((row) => <tr key={row._id}><td>{row.pollingStationCode || row.pollingStationId?.name || row.pollingStationId || '—'}</td><td>{row.regionId?.name || '—'}</td><td>{row.constituencyId?.name || '—'}</td><td>{Number(row.manualTotals?.totalValidVotes || 0).toLocaleString()}</td><td><span className={`status status-${row.verificationStatus || 'pending'}`}>{row.verificationStatus || 'pending'}</span></td></tr>)}</tbody></table></div>}
      </section>
    </main>
    <style jsx>{`.results-page{min-height:100%;padding:clamp(14px,2.5vw,34px);background:#f4f7f5;box-sizing:border-box}.hero{padding:28px;border-radius:22px;background:linear-gradient(135deg,#04351a,#075f2b);border:1px solid #c9a227;color:#fff}.hero span{color:#c9a227;font-size:10px;font-weight:900;letter-spacing:1.5px}.hero h2{margin:8px 0 5px;font-size:32px}.hero p{margin:0;color:#dce9e1;font-size:12px}.error,.card{margin-top:12px;padding:16px;border-radius:16px;background:#fff;border:1px solid #dce6df}.error{color:#a62c2c;border-color:#efcccc;background:#fff5f5}.controls{display:flex;align-items:center;justify-content:space-between;gap:20px}.controls small,.metric small,.heading small{display:block;color:#89948d;font-size:9px;text-transform:uppercase;letter-spacing:.5px;font-weight:800}.controls strong{display:block;margin-top:6px;color:#075f2b;font-size:16px}.controls select{width:min(360px,100%);padding:11px;border:1px solid #d6e1d9;border-radius:10px;background:#fbfdfb;color:#263b31;box-sizing:border-box}.summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.metric strong{display:block;margin-top:6px;color:#075f2b;font-size:24px}.heading{display:flex;align-items:center;justify-content:space-between;gap:12px}.heading h3{margin:5px 0 0;color:#263b31;font-size:17px}.heading>span{color:#7c8982;font-size:10px}.empty{color:#7c8982;font-size:11px}.table-wrap{margin-top:14px;overflow:auto;border:1px solid #edf1ee;border-radius:12px}table{width:100%;min-width:700px;border-collapse:collapse}th,td{padding:11px 10px;border-bottom:1px solid #edf1ee;text-align:left;font-size:10px}th{background:#f7faf8;color:#6f7b74;font-size:9px;text-transform:uppercase;letter-spacing:.4px}td{color:#344139}.status{display:inline-flex;padding:4px 7px;border-radius:999px;background:#f1f3f2;color:#66736b;font-size:8px;font-weight:800;text-transform:capitalize}.status-verified{background:#eaf5ee;color:#087038}.status-discrepancy,.status-disputed{background:#fff1f1;color:#b42318}.status-rejected{background:#f5eaea;color:#8a2f2f}@media(max-width:760px){.results-page{padding:12px}.hero{border-radius:18px}.hero h2{font-size:27px}.controls{align-items:flex-start;flex-direction:column}.controls select{width:100%}.summary-grid{grid-template-columns:1fr 1fr}}@media(max-width:480px){.summary-grid{grid-template-columns:1fr}.card{padding:14px}}`}</style>
  </DashboardShell>;
}
