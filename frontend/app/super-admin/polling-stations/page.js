"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import superAdminNavigation from "../../../components/dashboard/superAdminNavigation";

const apiBase = () => String(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const getToken = () => typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || localStorage.getItem("token") || sessionStorage.getItem("token") || localStorage.getItem("authToken") || sessionStorage.getItem("authToken") || localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || "";

async function request(path) {
  const token = getToken();
  if (!token) throw new Error("Authentication required. Please log in again.");
  const response = await fetch(`${apiBase()}${path}`, { cache: "no-store", headers: { Accept: "application/json", Authorization: `Bearer ${token}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success !== true) throw new Error(data.message || `Unable to load polling station data (${response.status}).`);
  return Array.isArray(data.data) ? data.data : [];
}

export default function PollingStationsPage() {
  const [regions, setRegions] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [stations, setStations] = useState([]);
  const [regionId, setRegionId] = useState("");
  const [constituencyId, setConstituencyId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadRegions = async () => {
    setLoading(true); setError("");
    try { setRegions(await request("/api/electoral-geography/regions")); }
    catch (e) { setError(e.message || "Unable to load regions."); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadRegions(); }, []);

  useEffect(() => {
    setConstituencies([]); setConstituencyId(""); setStations([]); setSearch(""); setError("");
    if (!regionId) return;
    request(`/api/electoral-geography/regions/${encodeURIComponent(regionId)}/constituencies`)
      .then(setConstituencies).catch((e) => setError(e.message || "Unable to load constituencies."));
  }, [regionId]);

  useEffect(() => {
    setStations([]); setSearch(""); setError("");
    if (!constituencyId) return;
    setStationsLoading(true);
    request(`/api/electoral-geography/constituencies/${encodeURIComponent(constituencyId)}/polling-stations`)
      .then(setStations).catch((e) => setError(e.message || "Unable to load polling stations."))
      .finally(() => setStationsLoading(false));
  }, [constituencyId]);

  const visibleStations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stations;
    return stations.filter((s) => [s.name, s.pollingStationCode, s.district, s.stationType].some((v) => String(v || "").toLowerCase().includes(q)));
  }, [stations, search]);

  const selectedRegion = regions.find((r) => String(r._id) === String(regionId));
  const selectedConstituency = constituencies.find((c) => String(c._id) === String(constituencyId));

  return (
    <DashboardShell role="super_admin" navigation={superAdminNavigation} activeSection="polling-stations" title="Polling Stations" subtitle="Official electoral polling-station directory">
      <main className="page">
        <section className="hero">
          <div><span>POLISYNC AFRICA • SUPER ADMIN</span><h2>Polling Stations</h2><p>Browse the official electoral hierarchy: region → constituency → polling station.</p></div>
          <button type="button" onClick={() => { if (constituencyId) { setStationsLoading(true); request(`/api/electoral-geography/constituencies/${encodeURIComponent(constituencyId)}/polling-stations`).then(setStations).catch((e) => setError(e.message || "Unable to refresh stations.")).finally(() => setStationsLoading(false)); } else { loadRegions(); } }} disabled={loading || stationsLoading}>↻ Refresh</button>
        </section>

        {error && <div className="error">{error}</div>}

        <section className="metrics">
          <Metric label="Regions" value={regions.length} />
          <Metric label="Constituencies" value={constituencies.length} />
          <Metric label="Polling Stations" value={stations.length} />
          <Metric label="Displayed" value={visibleStations.length} />
        </section>

        <section className="filters">
          <label><span>Region</span><select value={regionId} onChange={(e) => setRegionId(e.target.value)} disabled={loading}><option value="">Select region</option>{regions.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}</select></label>
          <label><span>Constituency</span><select value={constituencyId} onChange={(e) => setConstituencyId(e.target.value)} disabled={!regionId || constituencies.length === 0}><option value="">Select constituency</option>{constituencies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></label>
          <label><span>Search</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Station name or EC code" disabled={!constituencyId} /></label>
        </section>

        <section className="directory">
          <header><div><span>OFFICIAL DIRECTORY</span><h3>{selectedConstituency ? `${selectedConstituency.name} • ${selectedRegion?.name || ""}` : "Polling Stations"}</h3></div>{stationsLoading && <small>Loading…</small>}</header>
          {!constituencyId ? <div className="empty">Select a region, then a constituency, to load its polling stations.</div> : stationsLoading ? <div className="empty">Loading polling stations…</div> : visibleStations.length === 0 ? <div className="empty">No polling stations are available for this constituency.</div> : <div className="station-grid">{visibleStations.map((s) => <article className="station" key={s._id || s.pollingStationCode}><div className="station-title"><strong>{s.name}</strong><b>{s.pollingStationCode || "No code"}</b></div><span>{s.district || "District not provided"}</span><small>{formatType(s.stationType)} • {s.sourceYear || "EC dataset"}</small></article>)}</div>}
        </section>
      </main>
      <style jsx>{styles}</style>
    </DashboardShell>
  );
}

function Metric({ label, value }) { return <div className="metric"><span>{label}</span><strong>{Number(value || 0).toLocaleString()}</strong></div>; }
function formatType(value) { return String(value || "ordinary").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }

const styles = `.page{min-height:100%;padding:clamp(16px,2.5vw,32px);background:#f4f7f5;box-sizing:border-box;color:#1f2d25}.hero{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:14px;padding:24px;border:1px solid #dce6df;border-radius:20px;background:#fff}.hero span,.directory header span{color:#c9a227;font-size:9px;font-weight:900;letter-spacing:1.5px}.hero h2{margin:5px 0;color:#075f2b;font-size:30px}.hero p{margin:0;color:#6f7c74;font-size:13px}.hero button{min-height:42px;padding:9px 16px;border:0;border-radius:10px;background:#075f2b;color:#fff;font-size:13px;font-weight:800;cursor:pointer}.hero button:disabled{opacity:.55}.error{margin-bottom:12px;padding:13px 15px;border:1px solid #efcccc;border-radius:12px;background:#fff5f5;color:#a00000;font-size:12px}.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:12px}.metric{padding:14px 15px;border:1px solid #dce6df;border-radius:13px;background:#fff}.metric span{display:block;color:#7b877f;font-size:10px}.metric strong{display:block;margin-top:4px;color:#075f2b;font-size:22px}.filters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:12px;padding:15px;border:1px solid #dce6df;border-radius:15px;background:#fff}.filters label>span{display:block;margin-bottom:6px;color:#68756d;font-size:10px;font-weight:850;text-transform:uppercase}.filters select,.filters input{width:100%;height:44px;box-sizing:border-box;padding:0 12px;border:1px solid #d6e1d9;border-radius:10px;background:#fbfdfb;color:#304139;font-size:13px;outline:0}.directory{border:1px solid #dce6df;border-radius:16px;background:#fff;overflow:hidden}.directory header{display:flex;align-items:center;justify-content:space-between;padding:15px 17px;border-bottom:1px solid #edf1ee;background:#f7faf8}.directory h3{margin:4px 0 0;color:#075f2b;font-size:20px}.directory header small{color:#7b877f}.empty{padding:44px 18px;text-align:center;color:#7b877f;font-size:13px}.station-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:12px}.station{padding:13px;border:1px solid #e0e7e2;border-radius:12px;background:#fbfdfb;display:grid;gap:7px;transition:transform 160ms ease,box-shadow 160ms ease,border-color 160ms ease}.station:hover{transform:translateY(-2px);border-color:#c9a227;box-shadow:0 8px 20px rgba(16,59,34,.08)}.station-title{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.station strong{color:#075f2b;font-size:13px;line-height:1.35}.station b{padding:3px 6px;border-radius:6px;background:#f6efcf;color:#806718;font-size:9px;white-space:nowrap}.station span{color:#536159;font-size:11px}.station small{color:#849088;font-size:9px}@media(max-width:850px){.metrics{grid-template-columns:repeat(2,1fr)}.filters{grid-template-columns:1fr 1fr}.filters label:last-child{grid-column:1/-1}.station-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:520px){.page{padding:14px}.hero{display:block;padding:18px}.hero button{margin-top:13px}.metrics{grid-template-columns:1fr 1fr}.filters{grid-template-columns:1fr}.filters label:last-child{grid-column:auto}.station-grid{grid-template-columns:1fr}}`;
