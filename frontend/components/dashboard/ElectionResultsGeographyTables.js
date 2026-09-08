"use client";
import { useEffect, useMemo, useState } from "react";

const BASE = String(process.env.NEXT_PUBLIC_API_URL || "https://polisync-platform-1.onrender.com").replace(/\/+$/, "");
const token = () => typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || localStorage.getItem("token") || sessionStorage.getItem("token") || "";
const id = (x) => String(x?._id || x?.id || x || "");
const label = (x) => x?.name || x?.label || id(x) || "Unassigned";
const bucket = () => ({ received: 0, pending: 0, verified: 0, discrepancy: 0, rejected: 0, total: 0 });
const resultStatus = (r) => !r ? "pending" : r.verificationStatus === "verified" ? "verified" : ["discrepancy", "disputed"].includes(r.verificationStatus) ? "discrepancy" : r.verificationStatus === "rejected" ? "rejected" : "received";

async function api(path) {
  const t = token();
  const response = await fetch(`${BASE}${path}`, { cache: "no-store", headers: { Accept: "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success !== true) throw new Error(body.message || `Request failed (${response.status})`);
  return body;
}

export default function ElectionResultsGeographyTables() {
  const [elections, setElections] = useState([]);
  const [electionId, setElectionId] = useState("");
  const [data, setData] = useState(null);
  const [results, setResults] = useState([]);
  const [tab, setTab] = useState("regions");
  const [region, setRegion] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/elections").then((body) => {
      const list = Array.isArray(body.elections) ? body.elections : [];
      setElections(list);
      if (list[0]?._id) setElectionId(String(list[0]._id));
    }).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!electionId) return;
    setLoading(true);
    setError("");
    Promise.all([
      api(`/api/results/dashboard?electionId=${encodeURIComponent(electionId)}&view=national`),
      api(`/api/results/election/${encodeURIComponent(electionId)}`),
    ]).then(([dashboard, resultList]) => {
      setData(dashboard.data || dashboard);
      setResults(Array.isArray(resultList.results) ? resultList.results : Array.isArray(resultList.data) ? resultList.data : []);
    }).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [electionId]);

  const rows = useMemo(() => {
    const regions = data?.filters?.regions || [];
    const constituencies = data?.filters?.constituencies || data?.filters?.constitituencies || [];
    const stations = data?.filters?.pollingStations || [];
    const byStation = new Map(results.map((r) => [id(r.pollingStationId), r]));
    const byConstituency = new Map();
    const byRegion = new Map();
    for (const result of results) {
      const constituencyId = id(result.constituencyId);
      const regionId = id(result.regionId);
      if (!byConstituency.has(constituencyId)) byConstituency.set(constituencyId, bucket());
      if (!byRegion.has(regionId)) byRegion.set(regionId, bucket());
      const status = resultStatus(result);
      byConstituency.get(constituencyId)[status] += 1;
      byConstituency.get(constituencyId).total += 1;
      byRegion.get(regionId)[status] += 1;
      byRegion.get(regionId).total += 1;
    }
    const regionCoverage = data?.coverage?.regions || [];
    const constituencyCoverage = data?.coverage?.constituencies || [];
    return {
      regions: regions.map((item) => {
        const stats = byRegion.get(id(item)) || bucket();
        const coverage = regionCoverage.find((x) => id(x) === id(item)) || {};
        return { ...item, ...stats, stations: Number(coverage.totalPollingStations || 0), constituencies: Number(coverage.totalConstituencies || 0) };
      }),
      constituencies: constituencies.map((item) => {
        const stats = byConstituency.get(id(item)) || bucket();
        const coverage = constituencyCoverage.find((x) => id(x) === id(item)) || {};
        return { ...item, ...stats, stations: Number(coverage.totalPollingStations || 0) };
      }),
      stations: stations.map((item) => ({ ...item, result: byStation.get(id(item)), status: resultStatus(byStation.get(id(item))) })),
    };
  }, [data, results]);

  const filtered = useMemo(() => {
    const text = query.toLowerCase().trim();
    let list = rows[tab] || [];
    if (tab !== "regions" && region !== "all") list = list.filter((item) => id(item.regionId) === region);
    return list.filter((item) => !text || `${label(item)} ${label(item.regionId)} ${label(item.constituencyId)} ${item.pollingStationCode || ""}`.toLowerCase().includes(text));
  }, [rows, tab, region, query]);

  const totals = useMemo(() => rows.stations.reduce((acc, item) => { acc.total += 1; acc[item.status] += 1; return acc; }, bucket()), [rows.stations]);

  return <section className="results-geography-tables">
    <div className="head"><div><span>RESULTS COVERAGE</span><h2>Ghana Results by Electoral Geography</h2><p>All regions, constituencies and polling stations with receipt and verification status.</p></div><select value={electionId} onChange={(event) => setElectionId(event.target.value)}><option value="">Select election</option>{elections.map((election) => <option key={election._id} value={election._id}>{election.name} • {election.year}</option>)}</select></div>
    {error && <div className="error">{error}</div>}
    <div className="summary">{[["Total Stations", totals.total], ["Received", totals.received], ["Pending", totals.pending], ["Verified", totals.verified], ["Discrepancy", totals.discrepancy], ["Rejected", totals.rejected]].map(([title, value]) => <div key={title}><b>{value.toLocaleString()}</b><small>{title}</small></div>)}</div>
    <div className="toolbar"><div className="tabs">{[["regions", "Regions"], ["constituencies", "Constituencies"], ["stations", "Polling Stations"]].map(([key, title]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{title} <em>{(rows[key] || []).length.toLocaleString()}</em></button>)}</div><div className="filters">{tab !== "regions" && <select value={region} onChange={(event) => setRegion(event.target.value)}><option value="all">All regions</option>{(data?.filters?.regions || []).map((item) => <option key={id(item)} value={id(item)}>{label(item)}</option>)}</select>}<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search…" /></div></div>
    <div className="table-wrap">{loading ? <div className="empty">Loading electoral geography…</div> : <table><thead>{tab === "regions" ? <tr><th>#</th><th>Region</th><th>Constituencies</th><th>Stations</th><th>Received</th><th>Pending</th><th>Verified</th><th>Discrepancy</th><th>Rejected</th><th>Coverage</th></tr> : tab === "constituencies" ? <tr><th>#</th><th>Constituency</th><th>Region</th><th>Stations</th><th>Received</th><th>Pending</th><th>Verified</th><th>Discrepancy</th><th>Rejected</th><th>Coverage</th></tr> : <tr><th>#</th><th>Polling Station</th><th>EC Code</th><th>Region</th><th>Constituency</th><th>Status</th><th>Verification</th><th>Valid Votes</th></tr>}</thead><tbody>{filtered.map((item, index) => tab === "regions" ? <tr key={id(item)}><td>{index + 1}</td><td><strong>{label(item)}</strong></td><td>{item.constituencies}</td><td>{item.stations}</td><td><Badge status="received">{item.received}</Badge></td><td>{Math.max(item.stations - item.received, 0)}</td><td><Badge status="verified">{item.verified}</Badge></td><td><Badge status="discrepancy">{item.discrepancy}</Badge></td><td><Badge status="rejected">{item.rejected}</Badge></td><td><Bar value={item.stations ? item.received / item.stations * 100 : 0} /></td></tr> : tab === "constituencies" ? <tr key={id(item)}><td>{index + 1}</td><td><strong>{label(item)}</strong></td><td>{label(item.regionId)}</td><td>{item.stations}</td><td><Badge status="received">{item.received}</Badge></td><td>{Math.max(item.stations - item.received, 0)}</td><td><Badge status="verified">{item.verified}</Badge></td><td><Badge status="discrepancy">{item.discrepancy}</Badge></td><td><Badge status="rejected">{item.rejected}</Badge></td><td><Bar value={item.stations ? item.received / item.stations * 100 : 0} /></td></tr> : <tr key={id(item)}><td>{index + 1}</td><td><strong>{label(item)}</strong></td><td>{item.pollingStationCode || "—"}</td><td>{label(item.regionId)}</td><td>{label(item.constituencyId)}</td><td><Badge status={item.status}>{item.status}</Badge></td><td>{item.result?.verificationStatus || "Awaiting submission"}</td><td>{Number(item.result?.manualTotals?.totalValidVotes || 0).toLocaleString()}</td></tr>)}{!filtered.length && <tr><td colSpan={10}><div className="empty">No matching records.</div></td></tr>}</tbody></table>}</div>
    <p className="note">Official active electoral geography. Pending means no result has been submitted for the selected election.</p>
    <style jsx>{`.results-geography-tables{margin-top:16px;padding:18px;background:#f7fbf8;border:1px solid #dce9e2;border-radius:22px;color:#18372a}.head{display:flex;justify-content:space-between;gap:18px;align-items:end;padding:20px;background:#fff;border:1px solid #dfe9e4;border-radius:17px}.head span{font-size:10px;font-weight:900;letter-spacing:1.5px;color:#087747}.head h2{margin:5px 0;font-size:clamp(20px,3vw,30px)}.head p{margin:0;color:#687870;font-size:12px}.head select{width:280px;height:40px;border:1px solid #d6e2db;border-radius:9px;padding:0 9px}.summary{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:10px}.summary div{padding:12px;background:#fff;border:1px solid #dfe9e4;border-radius:12px}.summary b{display:block;font-size:20px;color:#075d34}.summary small{font-size:9px;color:#718078}.toolbar{display:flex;justify-content:space-between;gap:10px;margin-top:10px;padding:10px;background:#fff;border:1px solid #dfe9e4;border-radius:13px}.tabs{display:flex;gap:5px;flex-wrap:wrap}.tabs button{border:1px solid #d7e2dc;background:#fff;border-radius:8px;padding:8px 10px;font-size:10px;font-weight:800}.tabs .active{background:#075d34;color:#fff}.tabs em{font-style:normal;opacity:.75}.filters{display:flex;gap:7px}.filters select,.filters input{height:36px;border:1px solid #d6e2db;border-radius:8px;padding:0 9px;font-size:10px}.table-wrap{margin-top:10px;overflow:auto;background:#fff;border:1px solid #dfe9e4;border-radius:13px}.table-wrap table{width:100%;min-width:1000px;border-collapse:collapse;font-size:10px}.table-wrap th{position:sticky;top:0;background:#f0f6f2;padding:10px;text-align:left;color:#486257;font-size:9px}.table-wrap td{padding:10px;border-top:1px solid #edf2ef;white-space:nowrap}.status-badge{padding:4px 7px;border-radius:999px;font-size:8px;font-weight:900}.status-badge.received{background:#eaf6ef;color:#087747}.status-badge.verified{background:#e4f5eb;color:#075d34}.status-badge.pending{background:#fff7dc;color:#87630a}.status-badge.discrepancy{background:#fff0ed;color:#a03c2f}.status-badge.rejected{background:#f4e8e8;color:#8e2f2f}.bar{display:inline-block;width:70px;height:6px;background:#e7eee9;border-radius:9px;overflow:hidden}.bar i{display:block;height:100%;background:#087747}.note{font-size:9px;color:#708078}.error{margin-top:10px;padding:10px;background:#fff0ed;color:#9a3328;border-radius:10px;font-size:10px}.empty{padding:32px;text-align:center;color:#718078;font-size:11px}@media(max-width:900px){.head{display:block}.head select{width:100%;margin-top:12px}.summary{grid-template-columns:repeat(3,1fr)}.toolbar{display:block}.filters{margin-top:8px}}@media(max-width:560px){.results-geography-tables{padding:10px}.summary{grid-template-columns:repeat(2,1fr)}.filters{display:grid;grid-template-columns:1fr}.head{padding:14px}}`}</style>
  </section>;
}

function Badge({ status, children }) { return <span className={`status-badge ${status}`}>{children}</span>; }
function Bar({ value }) { const width = Math.min(100, Math.max(0, value)); return <span><span className="bar"><i style={{ width: `${width}%` }} /></span> <small>{Math.round(width)}%</small></span>; }
