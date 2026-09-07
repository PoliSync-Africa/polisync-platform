"use client";

import { useEffect, useState } from "react";

const token = () => typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || localStorage.getItem("token") || sessionStorage.getItem("token") || "";

async function load(path) {
  const t = token();
  const r = await fetch(path, { cache: "no-store", headers: { Accept: "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.success !== true) throw new Error(j.message || `Request failed (${r.status})`);
  return j;
}

const roleLabel = (role) => ({ regional_party_admin: "Regional Admin", regional_observer_admin: "Regional Observer Admin", constituency_admin: "Constituency Admin", constituency_observer_admin: "Constituency Observer Admin", polling_station_agent: "Polling Station Agent", observer_polling_station_agent: "Observer Polling Station Agent" }[role] || role || "Assigned");
const statusMeta = (status) => ({ verified: ["Verified", "#0b6b35"], pending: ["Pending verification", "#9a6b00"], not_submitted: ["Not submitted", "#6c7770"], rejected: ["Rejected", "#a32121"], discrepancy: ["Discrepancy", "#a34a00"], disputed: ["Disputed", "#a34a00"] }[status] || ["Pending", "#9a6b00"]);

export default function GeographicAssignmentPanel({ electionId, regionId, constituencyId, pollingStationId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!electionId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ electionId, regionId: regionId || "all", constituencyId: constituencyId || "all", pollingStationId: pollingStationId || "all" });
    load(`/api/results/geographic-assignments?${params}`)
      .then((j) => { if (!cancelled) setData(j); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [electionId, regionId, constituencyId, pollingStationId]);

  if (loading) return <section className="assignment-panel"><div className="loading">Loading assigned persons and result status…</div><style jsx>{`.assignment-panel{margin-top:12px}.loading{padding:18px;text-align:center;color:#65736b;font-size:11px;border:1px solid #dfe8e2;border-radius:12px;background:#fff}`}</style></section>;
  if (error) return <section className="assignment-panel"><div className="error">{error}</div><style jsx>{`.assignment-panel{margin-top:12px}.error{padding:12px;border:1px solid #efcccc;border-radius:10px;background:#fff5f5;color:#a32121;font-size:11px}`}</style></section>;
  if (!data) return null;

  const regional = data.assignments?.regional || [];
  const constituency = data.assignments?.constituency || [];
  const stations = data.stations || [];
  const stationOnly = data.assignments?.pollingStation || [];
  const showRegional = regionId === "all" || regional.length > 0;
  const showConstituency = constituencyId === "all" || constituency.length > 0;

  return <section className="assignment-panel">
    <header><div><span>FIELD ASSIGNMENTS & RESULT STATUS</span><h3>Persons assigned to this geographical location</h3><p>Names and telephone numbers are shown with the result status for each region, constituency and polling station in the current selection.</p></div><div className="summary"><b>{data.summary?.verified || 0}</b><small>Verified</small><b>{data.summary?.pending || 0}</b><small>Pending</small></div></header>

    {showRegional && <AssignmentGroup title="Regional assignments" rows={regional} empty="No approved regional person is assigned to this region." />}
    {showConstituency && <AssignmentGroup title="Constituency assignments" rows={constituency} empty="No approved constituency person is assigned to this constituency." />}

    <div className="stations-head"><h4>Polling stations in this location</h4><span>{stations.length} station{stations.length === 1 ? "" : "s"}</span></div>
    <div className="station-list">
      {stations.length === 0 ? <div className="empty">No polling stations found for this selection.</div> : stations.map((station) => {
        const meta = statusMeta(station.result?.status);
        const assigned = station.assignedPersons?.length ? station.assignedPersons : stationOnly.filter((a) => String(a.pollingStation?.id) === String(station.id));
        return <article className="station" key={station.id}>
          <div className="station-title"><div><strong>{station.name}</strong><small>{station.code || "No EC code"}{station.district ? ` • ${station.district}` : ""}</small></div><span style={{ color: meta[1] }}>{meta[0]}</span></div>
          <div className="people">{assigned.length ? assigned.map((a) => <div className="person" key={a.id}><div className="avatar">{String(a.person?.name || "?").slice(0, 1).toUpperCase()}</div><div className="person-main"><b>{a.person?.name || "Unknown"}</b><small>{a.person?.telephone || "Telephone not available"}</small></div><em>{roleLabel(a.role)}</em></div>) : <div className="unassigned">No approved person assigned to this polling station.</div>}</div>
        </article>;
      })}
    </div>

    <style jsx>{`
      .assignment-panel{margin-top:12px;padding:14px;border:1px solid #dce7e0;border-radius:14px;background:#fff;color:#173d28}
      header{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:12px} header span{font-size:9px;font-weight:900;letter-spacing:1.2px;color:#c39b24} h3{margin:4px 0;color:#075f2b;font-size:16px} header p{margin:0;color:#748078;font-size:10px;line-height:1.5;max-width:760px}.summary{display:grid;grid-template-columns:auto auto;gap:2px 7px;min-width:90px;padding:8px 10px;border:1px solid #e1e8e3;border-radius:10px;background:#f7faf8}.summary b{font-size:14px;color:#075f2b}.summary small{font-size:8px;color:#748078;align-self:center}.stations-head{display:flex;justify-content:space-between;align-items:center;margin:14px 0 7px}.stations-head h4{margin:0;font-size:12px;color:#075f2b}.stations-head span{font-size:9px;color:#748078}.station-list{display:grid;gap:8px}.station{border:1px solid #e2e9e4;border-radius:11px;overflow:hidden;background:#fbfcfb}.station-title{display:flex;justify-content:space-between;gap:10px;padding:10px 11px;background:#f4f8f5;border-bottom:1px solid #e5ebe7}.station-title strong,.station-title small{display:block}.station-title strong{font-size:11px}.station-title small{font-size:8px;color:#78857e;margin-top:2px}.station-title>span{font-size:9px;font-weight:900;white-space:nowrap}.people{padding:7px 10px}.person{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #edf1ee}.person:last-child{border-bottom:0}.avatar{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#075f2b;color:#fff;font-size:10px;font-weight:900;flex:none}.person-main{flex:1;min-width:0}.person-main b,.person-main small{display:block}.person-main b{font-size:10px}.person-main small{font-size:9px;color:#748078;margin-top:2px}.person em{font-style:normal;font-size:8px;color:#68756d;padding:4px 7px;border:1px solid #dce5df;border-radius:999px;white-space:nowrap}.assignment-panel>:global(.assignment-group){margin-top:10px}.assignment-panel>:global(.assignment-group h4){margin:0 0 7px;font-size:11px;color:#075f2b}.empty,.unassigned{padding:10px;color:#78857e;font-size:9px}.unassigned{padding:8px 0}.assignment-row{display:flex;align-items:center;gap:9px;padding:9px;border:1px solid #e2e9e4;border-radius:10px;background:#fbfcfb;margin-bottom:6px}.assignment-row .person-main{flex:1}.assignment-row .scope{font-size:8px;color:#68756d;text-align:right}.assignment-row .scope b{display:block;color:#173d28;font-size:9px}.assignment-row .scope small{display:block;margin-top:2px}@media(max-width:650px){header{flex-direction:column}.summary{align-self:stretch;grid-template-columns:auto auto auto auto}.summary small{margin-right:8px}.person{align-items:flex-start}.person em{white-space:normal;text-align:right}.station-title{align-items:flex-start}}
    `}</style>
  </section>;
}

function AssignmentGroup({ title, rows, empty }) {
  return <div className="assignment-group"><h4>{title}</h4>{rows.length ? rows.map((a) => <div className="assignment-row" key={a.id}><div className="avatar">{String(a.person?.name || "?").slice(0,1).toUpperCase()}</div><div className="person-main"><b>{a.person?.name || "Unknown"}</b><small>{a.person?.telephone || "Telephone not available"}</small></div><div className="scope"><b>{roleLabel(a.role)}</b><small>{a.region?.name || a.constituency?.name || "Assigned"}</small></div></div>) : <div className="empty">{empty}</div>}</div>;
}
