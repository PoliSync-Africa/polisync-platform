"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardShell from "../../../../../components/dashboard/DashboardShell";

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function RegionElectoralDrilldownPage() {
  const params = useParams();
  const regionId = params?.regionId;
  const [region, setRegion] = useState(null);
  const [constituencies, setConstituencies] = useState([]);
  const [stations, setStations] = useState([]);
  const [integrity, setIntegrity] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!regionId) return;
    let cancelled = false;
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    Promise.all([
      fetch(`${API}/api/electoral-geography/regions`, { headers, cache: "no-store" }).then((r) => r.json()),
      fetch(`${API}/api/electoral-geography/constituencies?regionId=${encodeURIComponent(regionId)}`, { headers, cache: "no-store" }).then((r) => r.json()),
      fetch(`${API}/api/electoral-geography/polling-stations?regionId=${encodeURIComponent(regionId)}`, { headers, cache: "no-store" }).then((r) => r.json()),
      fetch(`${API}/api/electoral-geography/integrity`, { headers, cache: "no-store" }).then((r) => r.json()),
    ]).then(([regionsBody, constituencyBody, stationBody, integrityBody]) => {
      if (cancelled) return;
      const found = (regionsBody.data || regionsBody.regions || []).find((r) => String(r._id || r.id) === String(regionId));
      setRegion(found || null);
      setConstituencies(constituencyBody.data || constituencyBody.constituencies || []);
      setStations(stationBody.data || stationBody.pollingStations || []);
      setIntegrity(integrityBody.data || null);
      setStatus("ready");
    }).catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, [regionId]);

  const data = integrity?.details || {};
  const orphanConstituencies = (data.orphanConstituencies || []).filter((x) => String(x.regionId) === String(regionId));
  const orphanStations = (data.orphanPollingStations || []).filter((x) => String(x.regionId) === String(regionId));
  const parentMismatches = (data.inconsistentStationParents || []).filter((x) => String(x.stationRegionId) === String(regionId));
  const duplicateConstituencies = (data.duplicateConstituencyGroups || []).filter((g) => g.records?.some((x) => String(x.regionId) === String(regionId)));
  const duplicateStations = (data.duplicateStationGroups || []).filter((g) => g.records?.some((x) => String(x.regionId) === String(regionId)));
  const issueCount = orphanConstituencies.length + orphanStations.length + parentMismatches.length + duplicateConstituencies.length + duplicateStations.length;

  return <DashboardShell role="super_admin"><main className="drill">
    <a className="back" href="/super-admin/electoral-data-health/regions">← Regional Health Matrix</a>
    {status === "loading" && <div className="state">Loading region records…</div>}
    {status === "error" && <div className="state error">Unable to load this region. Check the Super Admin session and try again.</div>}
    {status === "ready" && <>
      <header><div><div className="eyebrow">REGION {region?.regionNumber ?? "—"}</div><h1>{region?.name || "Region"}</h1><p>Actual constituencies, polling stations and integrity findings for this region.</p></div><span className={`status ${issueCount ? "bad" : "good"}`}>{issueCount ? "Needs Review" : "Healthy"}</span></header>
      <section className="stats"><div><span>Constituencies</span><b>{constituencies.length}</b></div><div><span>Polling Stations</span><b>{stations.length}</b></div><div><span>Integrity Findings</span><b>{issueCount}</b></div></section>
      <section className="panel"><h2>Constituencies</h2>{constituencies.length ? <div className="list">{constituencies.map((c) => <div className="row" key={String(c._id || c.id)}><strong>{c.name}</strong><span>{c.district || "District not recorded"}</span><small>{stations.filter((s) => String(s.constituencyId) === String(c._id || c.id)).length} polling stations</small></div>)}</div> : <p className="empty">No active constituencies returned for this region.</p>}</section>
      <section className="panel"><h2>Polling Stations</h2>{stations.length ? <div className="station-grid">{stations.map((s) => <div className="station" key={String(s._id || s.id)}><strong>{s.name}</strong><span>{s.pollingStationCode || "No EC code"}</span><small>{s.stationType || "Standard station"}</small></div>)}</div> : <p className="empty">No active polling stations returned for this region.</p>}</section>
      <section className="panel"><h2>Integrity Findings</h2>{issueCount === 0 ? <div className="healthy">✓ No region-level integrity findings detected.</div> : <div className="findings">
        {orphanConstituencies.map((x) => <div key={`oc-${x.id}`}><b>Orphan constituency</b><span>{x.name}</span></div>)}
        {orphanStations.map((x) => <div key={`os-${x.id}`}><b>Orphan polling station</b><span>{x.code || x.name}</span></div>)}
        {parentMismatches.map((x) => <div key={`pm-${x.id}`}><b>Parent mismatch</b><span>{x.code || x.id}</span></div>)}
        {duplicateConstituencies.map((x) => <div key={`dc-${x.key}`}><b>Duplicate constituency</b><span>{x.records?.map((r) => r.name).join(" · ")}</span></div>)}
        {duplicateStations.map((x) => <div key={`ds-${x.code}`}><b>Duplicate station code</b><span>{x.code}</span></div>)}
      </div>}</section>
    </>}
    <style jsx>{`.drill{padding:28px;max-width:1300px;margin:0 auto;color:#10251d}.back{color:#116b4f;text-decoration:none;font-weight:800;font-size:13px}.drill header{display:flex;justify-content:space-between;gap:20px;align-items:flex-end;margin:20px 0}.eyebrow{font-size:11px;font-weight:900;letter-spacing:1px;color:#a17a18}.drill h1{font-size:34px;margin:6px 0}.drill header p{margin:0;color:#68766f}.status{padding:8px 12px;border-radius:999px;font-weight:900;font-size:12px}.good{background:#e7f5ed;color:#087443}.bad{background:#fff0e9;color:#a33d16}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:16px}.stats div,.panel{background:#fff;border:1px solid #e3ebe7;border-radius:14px;box-shadow:0 5px 18px rgba(16,37,29,.05)}.stats div{padding:17px}.stats span{display:block;color:#718078;font-size:11px;font-weight:800;text-transform:uppercase}.stats b{font-size:25px;display:block;margin-top:5px}.panel{padding:20px;margin-bottom:16px}.panel h2{font-size:18px;margin:0 0 14px}.list{display:grid;gap:0}.row{display:grid;grid-template-columns:1.5fr 1fr 180px;gap:15px;padding:13px 0;border-top:1px solid #edf1ef;align-items:center}.row span,.row small,.station span,.station small{color:#68766f;font-size:12px}.station-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.station{border:1px solid #e5ece8;border-radius:10px;padding:12px;display:grid;gap:5px}.empty{color:#7a8780}.healthy{padding:13px;background:#eef8f2;color:#087443;border-radius:10px;font-weight:800}.findings{display:grid;gap:8px}.findings div{display:flex;justify-content:space-between;gap:15px;padding:11px 12px;background:#fff7f3;border:1px solid #f0d9cd;border-radius:9px}.findings span{color:#6b756f}.state{padding:40px;text-align:center;background:#fff;border:1px solid #e3ebe7;border-radius:14px}.state.error{color:#a33d16}@media(max-width:760px){.drill{padding:18px}.drill header{display:block}.status{display:inline-flex;margin-top:12px}.stats{grid-template-columns:1fr}.row{grid-template-columns:1fr}.station-grid{grid-template-columns:1fr}.findings div{display:block}.findings span{display:block;margin-top:4px}}`}</style>
  </main></DashboardShell>;
}
