"use client";

import { useEffect, useState } from "react";

const getToken = () => typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || localStorage.getItem("token") || sessionStorage.getItem("token") || "";
async function api(path) {
  const token = getToken();
  const response = await fetch(path, { cache: "no-store", headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success !== true) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}

const roleLabel = (role) => ({ regional_party_admin: "Regional Admin", regional_observer_admin: "Regional Observer Admin", constituency_admin: "Constituency Admin", constituency_observer_admin: "Constituency Observer Admin", polling_station_agent: "Polling Station Agent", observer_polling_station_agent: "Observer Polling Station Agent" }[role] || role || "Assigned");
const statusLabel = (status) => ({ verified: "Verified", pending: "Pending verification", not_submitted: "Not submitted", rejected: "Rejected", discrepancy: "Discrepancy", disputed: "Disputed" }[status] || "Pending");

export default function ElectionGeographyAssignmentsView({ title = "Election Operations by Geography" }) {
  const [elections, setElections] = useState([]), [regions, setRegions] = useState([]), [constituencies, setConstituencies] = useState([]);
  const [electionId, setElectionId] = useState(""), [regionId, setRegionId] = useState("all"), [constituencyId, setConstituencyId] = useState("all"), [pollingStationId, setPollingStationId] = useState("all");
  const [data, setData] = useState(null), [error, setError] = useState(""), [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([api("/api/elections"), api("/api/electoral-geography/regions")]).then(([e, g]) => {
      const list = e.elections || [];
      setElections(list);
      if (list[0]?._id) setElectionId(String(list[0]._id));
      setRegions(g.data || []);
    }).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    setConstituencies([]); setConstituencyId("all"); setPollingStationId("all");
    if (regionId === "all") return;
    api(`/api/electoral-geography/regions/${encodeURIComponent(regionId)}/constituencies`).then((j) => setConstituencies(j.data || [])).catch((e) => setError(e.message));
  }, [regionId]);

  useEffect(() => {
    setPollingStationId("all");
  }, [constituencyId]);

  useEffect(() => {
    if (!electionId) return;
    setLoading(true); setError("");
    const params = new URLSearchParams({ electionId, regionId, constituencyId, pollingStationId });
    api(`/api/results/geographic-assignments?${params}`).then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [electionId, regionId, constituencyId, pollingStationId]);

  const regional = data?.assignments?.regional || [], constituency = data?.assignments?.constituency || [], stations = data?.stations || [];
  return <section className="geo-assignments">
    <header><div><span>ASSIGNMENTS + RESULTS STATUS</span><h2>{title}</h2><p>Select an election and geographic level to see the people assigned there, their telephone numbers, and the current result status of every polling station underneath it.</p></div>{data?.summary && <div className="metrics"><b>{data.summary.verified}</b><small>Verified</small><b>{data.summary.pending}</b><small>Pending</small><b>{data.summary.submitted}</b><small>Submitted</small></div>}</header>
    {error && <div className="error">{error}</div>}
    <div className="filters">
      <label>Election<select value={electionId} onChange={(e) => setElectionId(e.target.value)}><option value="">Select election</option>{elections.map((e) => <option key={e._id} value={e._id}>{e.name} • {e.year} • {e.type}</option>)}</select></label>
      <label>Region<select value={regionId} onChange={(e) => setRegionId(e.target.value)}><option value="all">National — all regions</option>{regions.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}</select></label>
      <label>Constituency<select value={constituencyId} disabled={regionId === "all"} onChange={(e) => setConstituencyId(e.target.value)}><option value="all">All constituencies</option>{constituencies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></label>
      <label>Polling station<select value={pollingStationId} disabled={constituencyId === "all"} onChange={(e) => setPollingStationId(e.target.value)}><option value="all">All polling stations</option>{stations.map((s) => <option key={s.id} value={s.id}>{s.code} • {s.name}</option>)}</select></label>
    </div>

    {(regionId !== "all" || regional.length) && <AssignmentTable title="Regional persons assigned" rows={regional} empty="No approved regional assignment for this region." />}
    {(constituencyId !== "all" || constituency.length) && <AssignmentTable title="Constituency persons assigned" rows={constituency} empty="No approved constituency assignment for this constituency." />}

    <div className="station-header"><h3>Polling stations and result status</h3><span>{stations.length} station{stations.length === 1 ? "" : "s"}</span></div>
    <div className="stations">{loading ? <div className="empty">Loading assignments and result status…</div> : stations.length === 0 ? <div className="empty">No polling stations found for this geographic selection.</div> : stations.map((station) => {
      const assigned = station.assignedPersons || [];
      return <article className="station" key={station.id}>
        <div className="station-top"><div><strong>{station.name}</strong><small>{station.code || "No EC code"}{station.district ? ` • ${station.district}` : ""}</small></div><span className={`result-status ${station.result?.status || "not_submitted"}`}>{statusLabel(station.result?.status)}</span></div>
        <div className="station-people">{assigned.length ? assigned.map((a) => <div className="person" key={a.id}><div className="avatar">{String(a.person?.name || "?").slice(0,1).toUpperCase()}</div><div className="person-copy"><b>{a.person?.name || "Unknown"}</b><a href={a.person?.telephone ? `tel:${a.person.telephone}` : undefined}>{a.person?.telephone || "Telephone not available"}</a></div><em>{roleLabel(a.role)}</em></div>) : <div className="unassigned">No approved person assigned to this polling station.</div>}</div>
      </article>;
    })}</div>
    <style jsx>{`
      .geo-assignments{margin-top:14px;padding:16px;border:1px solid #dce7e0;border-radius:16px;background:#fff;color:#173d28}.geo-assignments header{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.geo-assignments header span{font-size:9px;letter-spacing:1.3px;font-weight:900;color:#c49a20}.geo-assignments h2{font-size:18px;color:#075f2b;margin:4px 0}.geo-assignments header p{font-size:10px;color:#748078;margin:0;line-height:1.5;max-width:780px}.metrics{display:grid;grid-template-columns:auto auto;gap:2px 7px;padding:9px 11px;border:1px solid #e1e8e3;border-radius:10px;background:#f7faf8;min-width:105px}.metrics b{font-size:14px;color:#075f2b}.metrics small{font-size:8px;color:#748078}.filters{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin:14px 0}.filters label{display:grid;gap:5px;font-size:9px;font-weight:800;color:#647168}.filters select{min-height:40px;border:1px solid #d6e1d9;border-radius:9px;background:#fff;color:#173d28;padding:0 9px;font-size:10px}.filters select:disabled{background:#f2f5f3;color:#9aa49e}.error{margin:9px 0;padding:10px;border:1px solid #efcccc;border-radius:9px;background:#fff5f5;color:#a32121;font-size:10px}.station-header{display:flex;justify-content:space-between;align-items:center;margin:14px 0 7px}.station-header h3{margin:0;font-size:13px;color:#075f2b}.station-header span{font-size:9px;color:#748078}.stations{display:grid;gap:8px}.station{border:1px solid #e0e8e3;border-radius:11px;background:#fbfcfb;overflow:hidden}.station-top{display:flex;justify-content:space-between;gap:12px;padding:10px 11px;background:#f4f8f5;border-bottom:1px solid #e4ebe6}.station-top strong,.station-top small{display:block}.station-top strong{font-size:11px}.station-top small{font-size:8px;color:#77847c;margin-top:2px}.result-status{font-size:9px;font-weight:900;white-space:nowrap;align-self:center}.result-status.verified{color:#0b6b35}.result-status.pending{color:#9a6b00}.result-status.not_submitted{color:#6c7770}.result-status.rejected{color:#a32121}.result-status.discrepancy,.result-status.disputed{color:#a34a00}.station-people{padding:7px 10px}.person{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #edf1ee}.person:last-child{border-bottom:0}.avatar{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#075f2b;color:#fff;font-size:10px;font-weight:900;flex:none}.person-copy{flex:1;min-width:0}.person-copy b,.person-copy a{display:block}.person-copy b{font-size:10px}.person-copy a{font-size:9px;color:#075f2b;text-decoration:none;margin-top:2px}.person em{font-style:normal;font-size:8px;color:#68756d;border:1px solid #dce5df;border-radius:999px;padding:4px 7px;white-space:nowrap}.unassigned,.empty{padding:11px;color:#78857e;font-size:9px}.geo-assignments :global(.assignment-group){margin-top:10px}.geo-assignments :global(.assignment-group h4){margin:0 0 7px;font-size:11px;color:#075f2b}.geo-assignments :global(.assignment-row){display:flex;align-items:center;gap:9px;padding:9px;border:1px solid #e2e9e4;border-radius:10px;background:#fbfcfb;margin-bottom:6px}.geo-assignments :global(.assignment-row .person-main){flex:1}.geo-assignments :global(.assignment-row .scope){font-size:8px;color:#68756d;text-align:right}.geo-assignments :global(.assignment-row .scope b){display:block;color:#173d28;font-size:9px}.geo-assignments :global(.assignment-row .scope small){display:block;margin-top:2px}.geo-assignments :global(.assignment-row .avatar){width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#075f2b;color:#fff;font-size:10px;font-weight:900}.geo-assignments :global(.assignment-row .person-main b),.geo-assignments :global(.assignment-row .person-main small){display:block}.geo-assignments :global(.assignment-row .person-main b){font-size:10px}.geo-assignments :global(.assignment-row .person-main small){font-size:9px;color:#075f2b;margin-top:2px}@media(max-width:850px){.filters{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.geo-assignments header{flex-direction:column}.metrics{width:100%;box-sizing:border-box;grid-template-columns:repeat(6,auto)}.filters{grid-template-columns:1fr}.station-top{align-items:flex-start}.person{align-items:flex-start}.person em{white-space:normal;text-align:right}}
    `}</style>
  </section>;
}

function AssignmentTable({ title, rows, empty }) {
  return <div className="assignment-group"><h4>{title}</h4>{rows.length ? rows.map((a) => <div className="assignment-row" key={a.id}><div className="avatar">{String(a.person?.name || "?").slice(0,1).toUpperCase()}</div><div className="person-main"><b>{a.person?.name || "Unknown"}</b><small>{a.person?.telephone || "Telephone not available"}</small></div><div className="scope"><b>{roleLabel(a.role)}</b><small>{a.region?.name || a.constituency?.name || "Assigned"}</small></div></div>) : <div className="empty">{empty}</div>}</div>;
}
