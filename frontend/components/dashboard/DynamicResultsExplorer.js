"use client";

import { useEffect, useMemo, useState } from "react";

const EMPTY = { filters: { organizations: [], elections: [], electionTypes: [], regions: [], constituencies: [], pollingStations: [] }, summary: {}, national: {}, regional: [], constituency: [], pollingStation: [] };

export default function DynamicResultsExplorer() {
  const [data, setData] = useState(EMPTY);
  const [view, setView] = useState("national");
  const [organizationId, setOrganizationId] = useState("all");
  const [electionType, setElectionType] = useState("all");
  const [electionId, setElectionId] = useState("all");
  const [regionId, setRegionId] = useState("all");
  const [constituencyId, setConstituencyId] = useState("all");
  const [pollingStationId, setPollingStationId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const api = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
      const token = localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || "";
      if (!api) throw new Error("API URL is not configured.");
      const qs = new URLSearchParams({ view, organizationId, electionType, electionId, regionId, constituencyId, pollingStationId });
      const response = await fetch(`${api}/api/results/dashboard?${qs.toString()}`, { headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.message || `Unable to load results (${response.status}).`);
      setData(json);
    } catch (e) {
      setError(e.message || "Unable to load election results.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [view, organizationId, electionType, electionId, regionId, constituencyId, pollingStationId]);

  const elections = data.filters?.elections || [];
  const regions = data.filters?.regions || [];
  const constituencies = useMemo(() => (data.filters?.constituencies || []).filter(c => regionId === "all" || String(c.regionId?._id || c.regionId) === regionId), [data.filters?.constituencies, regionId]);
  const stations = useMemo(() => (data.filters?.pollingStations || []).filter(s => (regionId === "all" || String(s.regionId?._id || s.regionId) === regionId) && (constituencyId === "all" || String(s.constituencyId?._id || s.constituencyId) === constituencyId)), [data.filters?.pollingStations, regionId, constituencyId]);

  const rows = view === "regional" ? data.regional || [] : view === "constituency" ? data.constituency || [] : view === "polling_station" ? data.pollingStation || [] : [];
  const national = Object.entries(data.national || {}).sort((a, b) => b[1] - a[1]);

  const resetGeo = () => { setRegionId("all"); setConstituencyId("all"); setPollingStationId("all"); };

  return <section className="dynamic-results-explorer">
    <div className="explorer-head">
      <div><span className="kicker">RESULTS INTELLIGENCE</span><h3>Election Results Explorer</h3><p>Organization, election and geography are selected from the PoliSync system. Geography is sourced from the EC dataset.</p></div>
      <button type="button" className="refresh" onClick={load} disabled={loading}>{loading ? "Loading…" : "↻ Refresh"}</button>
    </div>

    <div className="filters">
      <Filter label="View"><select value={view} onChange={e => setView(e.target.value)}><option value="national">National</option><option value="regional">Regional</option><option value="constituency">Constituency</option><option value="polling_station">Polling Station</option></select></Filter>
      <Filter label="Organization"><select value={organizationId} onChange={e => { setOrganizationId(e.target.value); setElectionId("all"); }}><option value="all">All organizations</option>{(data.filters?.organizations || []).map(o => <option key={o._id} value={o._id}>{o.name}{o.politicalPartyName ? ` • ${o.politicalPartyName}` : ""}</option>)}</select></Filter>
      <Filter label="Election type"><select value={electionType} onChange={e => { setElectionType(e.target.value); setElectionId("all"); }}><option value="all">All election types</option>{(data.filters?.electionTypes || []).map(t => <option key={t} value={t}>{t}</option>)}</select></Filter>
      <Filter label="Election"><select value={electionId} onChange={e => setElectionId(e.target.value)}><option value="all">All matching elections</option>{elections.map(e => <option key={e._id} value={e._id}>{e.name} • {e.year}</option>)}</select></Filter>
      <Filter label="Region"><select value={regionId} onChange={e => { setRegionId(e.target.value); setConstituencyId("all"); setPollingStationId("all"); }}><option value="all">All EC regions</option>{regions.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}</select></Filter>
      <Filter label="Constituency"><select value={constituencyId} disabled={regionId === "all" && view === "national"} onChange={e => { setConstituencyId(e.target.value); setPollingStationId("all"); }}><option value="all">All EC constituencies</option>{constituencies.map(c => <option key={c._id} value={c._id}>{c.name}{c.constituencyNumber ? ` • ${c.constituencyNumber}` : ""}</option>)}</select></Filter>
      <Filter label="Polling station"><select value={pollingStationId} disabled={constituencyId === "all"} onChange={e => setPollingStationId(e.target.value)}><option value="all">All EC polling stations</option>{stations.map(s => <option key={s._id} value={s._id}>{s.pollingStationCode} • {s.name}</option>)}</select></Filter>
      <button type="button" className="clear" onClick={resetGeo}>Clear geography</button>
    </div>

    {error ? <div className="message error">{error}</div> : loading ? <div className="message">Loading selected results…</div> : <>
      <div className="summary"><Stat label="Submitted stations" value={data.summary?.submittedStations || 0}/><Stat label="Valid votes" value={data.summary?.validVotes || 0}/><Stat label="Verified" value={data.summary?.verified || 0}/><Stat label="Pending" value={data.summary?.pending || 0}/><Stat label="Discrepancy" value={(data.summary?.discrepancy || 0) + (data.summary?.rejected || 0)}/></div>

      {view === "national" ? <ResultTable title="National result" rows={national.map(([name, votes]) => ({ name, submitted: "—", validVotes: votes }))} empty="No candidate result data exists for the selected filters."/> : <ResultTable title={`${view === "regional" ? "Regional" : view === "constituency" ? "Constituency" : "Polling station"} results`} rows={rows.map(r => ({ name: view === "polling_station" ? `${r.pollingStationCode || ""} • ${r.name}` : r.name, submitted: r.submitted, validVotes: r.validVotes }))} empty={`No results exist for the selected ${view.replace("_", " ")} filters yet.`}/>} 
    </>}

    <style jsx>{`
      .dynamic-results-explorer{padding:16px;border-radius:15px;background:rgba(0,0,0,.12);border:1px solid rgba(240,205,97,.45)}
      .explorer-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:14px}.kicker{font-size:8px;font-weight:950;letter-spacing:1.4px;color:#f0cd61}.explorer-head h3{margin:3px 0;color:#fff;font-size:18px}.explorer-head p{margin:4px 0 0;color:#c5d6cb;font-size:10px;line-height:1.5}.refresh,.clear{border:1px solid rgba(240,205,97,.55);border-radius:8px;background:rgba(214,173,53,.08);color:#f0cd61;padding:8px 10px;font-size:9px;font-weight:800;white-space:nowrap}.refresh:disabled{opacity:.6}
      .filters{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:13px}.filters label{display:grid;gap:4px;color:#c5d6cb;font-size:8px;font-weight:850}.filters select{width:100%;min-height:38px;padding:0 8px;border:1px solid rgba(214,173,53,.35);border-radius:8px;background:#fff;color:#173d28;font-size:9px}.clear{align-self:end;min-height:38px;cursor:pointer}
      .summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;margin-bottom:13px}.stat{padding:9px;border:1px solid rgba(214,173,53,.25);border-radius:9px;background:rgba(0,0,0,.12)}.stat span{display:block;color:#c5d6cb;font-size:7px}.stat strong{display:block;margin-top:3px;color:#fff;font-size:14px}
      .result-title{margin:0 0 7px;color:#f0cd61;font-size:10px;font-weight:900}.table{display:grid}.row{display:grid;grid-template-columns:1fr 80px 100px;gap:8px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:9px}.row strong{text-align:right}.row small{text-align:right;color:#c5d6cb}.message{padding:16px;border:1px dashed rgba(214,173,53,.35);border-radius:9px;color:#c5d6cb;text-align:center;font-size:9px}.error{color:#ffd0d0;border-color:rgba(255,120,120,.4)}
      @media(max-width:900px){.filters{grid-template-columns:repeat(2,minmax(0,1fr))}.summary{grid-template-columns:repeat(3,minmax(0,1fr))}}
      @media(max-width:520px){.explorer-head{display:block}.refresh{margin-top:9px}.filters,.summary{grid-template-columns:1fr}.row{grid-template-columns:1fr 65px 75px}}
    `}</style>
  </section>;
}

function Filter({ label, children }) { return <label>{label}{children}</label>; }
function Stat({ label, value }) { return <div className="stat"><span>{label}</span><strong>{Number(value || 0).toLocaleString()}</strong></div>; }
function ResultTable({ title, rows, empty }) { return <div><h4 className="result-title">{title}</h4>{rows.length ? <div className="table"><div className="row"><strong>Name</strong><strong>Stations</strong><strong>Valid votes</strong></div>{rows.map((r, i) => <div className="row" key={`${r.name}-${i}`}><span>{r.name}</span><strong>{r.submitted}</strong><small>{Number(r.validVotes || 0).toLocaleString()}</small></div>)}</div> : <div className="message">{empty}</div>}</div>; }
