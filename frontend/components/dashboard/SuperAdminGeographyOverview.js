"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import DashboardShell from "./DashboardShell";

const GhanaElectoralMap = dynamic(() => import("./GhanaElectoralMap"), { ssr: false, loading: () => <div className="map-loading">Loading Ghana map…</div> });

async function api(path) {
  const response = await fetch(path, { cache: "no-store", headers: { Accept: "application/json" } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success !== true) throw new Error(data.message || `Unable to load geography (${response.status}).`);
  return data.data;
}

async function geocode(query) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");
  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to locate the selected geography.");
  const data = await response.json();
  const result = data?.results?.[0];
  if (!result) throw new Error("No map location was found for the selected geography.");
  return { lat: Number(result.latitude), lon: Number(result.longitude) };
}

export default function SuperAdminGeographyOverview() {
  const [regions, setRegions] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [stations, setStations] = useState([]);
  const [regionId, setRegionId] = useState("");
  const [constituencyId, setConstituencyId] = useState("");
  const [stationId, setStationId] = useState("");
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [childLoading, setChildLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/electoral-geography/regions")
      .then(setRegions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const selectedRegion = useMemo(() => regions.find((r) => String(r._id) === String(regionId)), [regions, regionId]);
  const selectedConstituency = useMemo(() => constituencies.find((c) => String(c._id) === String(constituencyId)), [constituencies, constituencyId]);
  const selectedStation = useMemo(() => stations.find((s) => String(s._id) === String(stationId)), [stations, stationId]);

  useEffect(() => {
    setConstituencies([]); setStations([]); setConstituencyId(""); setStationId(""); setError("");
    if (!regionId) { setLocations([]); return; }
    setChildLoading(true);
    Promise.all([
      api(`/api/electoral-geography/regions/${encodeURIComponent(regionId)}/constituencies`),
      geocode(`${selectedRegion?.name || "Ghana"}, Ghana`),
    ])
      .then(([data, coords]) => { setConstituencies(data); setLocations([{ id: regionId, ...coords, name: selectedRegion?.name || "Selected Region", level: "region", zoom: 8 }]); })
      .catch((e) => setError(e.message))
      .finally(() => setChildLoading(false));
  }, [regionId]);

  useEffect(() => {
    setStations([]); setStationId(""); setError("");
    if (!constituencyId) return;
    setChildLoading(true);
    Promise.all([
      api(`/api/electoral-geography/constituencies/${encodeURIComponent(constituencyId)}/polling-stations`),
      geocode(`${selectedConstituency?.name || ""}, ${selectedRegion?.name || ""}, Ghana`),
    ])
      .then(([data, coords]) => { setStations(data); setLocations([{ id: constituencyId, ...coords, name: selectedConstituency?.name || "Selected Constituency", level: "constituency", zoom: 11 }]); })
      .catch((e) => setError(e.message))
      .finally(() => setChildLoading(false));
  }, [constituencyId]);

  useEffect(() => {
    if (!stationId || !selectedStation) return;
    setError("");
    setChildLoading(true);
    geocode(`${selectedStation.name}, ${selectedConstituency?.name || ""}, ${selectedRegion?.name || ""}, Ghana`)
      .then((coords) => setLocations([{ id: stationId, ...coords, name: selectedStation.name, code: selectedStation.pollingStationCode, level: "polling_station", zoom: 15 }]))
      .catch((e) => setError(e.message))
      .finally(() => setChildLoading(false));
  }, [stationId]);

  return (
    <DashboardShell role="super_admin" activeSection="geography">
      <main className="page">
        <header className="hero">
          <div><span>POLISYNC AFRICA • GEOGRAPHIC OVERVIEW</span><h1>Ghana Electoral Map</h1><p>Explore the existing Ghana electoral geography directly on the map: regions → constituencies → polling stations.</p></div>
          <div className="ghana-mark">GHANA<br /><small>16 REGIONS</small></div>
        </header>

        {error && <div className="error">{error}</div>}

        <section className="stats">
          <Metric label="Regions" value={loading ? "—" : regions.length} />
          <Metric label="Constituencies" value={regionId ? constituencies.length : "—"} />
          <Metric label="Polling Stations" value={constituencyId ? stations.length : "—"} />
          <Metric label="Map Selection" value={locations[0]?.level?.replace("_", " ") || "Ghana"} />
        </section>

        <section className="workspace">
          <div className="map-panel"><GhanaElectoralMap locations={locations} /></div>
          <aside className="controls">
            <div className="section-label">MAP FILTERS</div>
            <label>Region<select value={regionId} onChange={(e) => setRegionId(e.target.value)} disabled={loading}><option value="">All Ghana</option>{regions.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}</select></label>
            <label>Constituency<select value={constituencyId} onChange={(e) => setConstituencyId(e.target.value)} disabled={!regionId || childLoading}><option value="">{regionId ? "All constituencies" : "Select region first"}</option>{constituencies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></label>
            <label>Polling Station<select value={stationId} onChange={(e) => setStationId(e.target.value)} disabled={!constituencyId || childLoading}><option value="">{constituencyId ? "Select polling station" : "Select constituency first"}</option>{stations.map((s) => <option key={s._id} value={s._id}>{s.name}{s.pollingStationCode ? ` — ${s.pollingStationCode}` : ""}</option>)}</select></label>
            {childLoading && <div className="loading">Updating map…</div>}
            <div className="legend"><strong>Map selection</strong><span><i className="region-dot" /> Region</span><span><i className="const-dot" /> Constituency</span><span><i className="station-dot" /> Polling station</span></div>
            <div className="selection">{selectedStation ? <><strong>{selectedStation.name}</strong><small>{selectedStation.pollingStationCode || "No EC code"}</small><small>Polling station • {selectedStation.sourceYear || "EC dataset"}</small></> : selectedConstituency ? <><strong>{selectedConstituency.name}</strong><small>{selectedRegion?.name || "Ghana"}</small></> : selectedRegion ? <><strong>{selectedRegion.name}</strong><small>{constituencies.length} constituencies loaded</small></> : <><strong>Ghana</strong><small>National electoral geography</small></>}</div>
          </aside>
        </section>

        <section className="data-panel"><div><span className="section-label">EXISTING ELECTORAL DATA</span><h2>{selectedConstituency ? `${selectedConstituency.name} polling stations` : selectedRegion ? `${selectedRegion.name} constituencies` : "Ghana electoral geography"}</h2></div>{selectedConstituency ? <div className="data-grid">{stations.map((s) => <article key={s._id}><strong>{s.name}</strong><span>{s.pollingStationCode || "No code"}</span><small>{s.stationType || "Polling station"}</small></article>)}</div> : selectedRegion ? <div className="data-grid">{constituencies.map((c) => <article key={c._id}><strong>{c.name}</strong><span>Constituency</span></article>)}</div> : <p className="muted">The full Ghana map is displayed above. Select a region, constituency, and polling station to progressively zoom the map and display the selected location.</p>}</section>
        <div className="source">Base map © OpenStreetMap contributors. Electoral records are supplied by PoliSync Africa's existing electoral geography dataset. Location coordinates are resolved for map display when source records do not contain coordinates.</div>
      </main>
      <style jsx>{styles}</style>
    </DashboardShell>
  );
}
function Metric({ label, value }) { return <div className="metric"><span>{label}</span><strong>{value}</strong></div>; }
const styles = `.page{min-height:100%;padding:clamp(14px,2.5vw,32px);background:#f4f7f5;color:#26332b}.hero{display:flex;justify-content:space-between;gap:20px;align-items:center;padding:26px;border-radius:20px;background:linear-gradient(135deg,#04351a,#075f2b);border:1px solid #c9a227;color:#fff}.hero>div:first-child>span{font-size:9px;letter-spacing:1.5px;font-weight:900;color:#d9b83f}.hero h1{margin:7px 0;font-size:30px}.hero p{margin:0;color:#dcefe4;font-size:12px}.ghana-mark{text-align:center;font-weight:900;font-size:20px;line-height:1.1}.ghana-mark small{font-size:8px;color:#d9b83f;letter-spacing:1px}.error{margin-top:12px;padding:12px;border:1px solid #e5bcbc;border-radius:12px;background:#fff5f5;color:#a00000;font-size:11px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:12px 0}.metric{padding:15px;border:1px solid #dce6df;border-radius:13px;background:#fff}.metric span{display:block;color:#7b877f;font-size:9px}.metric strong{display:block;margin-top:4px;color:#075f2b;font-size:21px;text-transform:capitalize}.workspace{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:12px;align-items:start}.map-panel{background:#fff;border:1px solid #dce6df;border-radius:18px;padding:10px}.controls,.data-panel{background:#fff;border:1px solid #dce6df;border-radius:16px;padding:16px}.section-label{font-size:9px;font-weight:900;letter-spacing:1.2px;color:#075f2b}.controls label{display:block;margin-top:14px;color:#536159;font-size:10px;font-weight:800}.controls select{display:block;width:100%;margin-top:6px;padding:11px;border:1px solid #d6e1d9;border-radius:10px;background:#fbfdfb;color:#26332b}.loading{margin-top:10px;padding:9px;background:#f4f8f5;border-radius:8px;color:#075f2b;font-size:10px}.legend{display:grid;gap:7px;margin-top:18px;padding-top:14px;border-top:1px solid #e5ebe7;color:#59665e;font-size:10px}.legend span{display:flex;align-items:center;gap:7px}.legend i{width:9px;height:9px;border-radius:50%;display:inline-block}.region-dot{background:#075f2b}.const-dot{background:#4f8f68}.station-dot{background:#c9a227}.selection{display:grid;gap:4px;margin-top:14px;padding:12px;border-radius:11px;background:#f5faf7;border:1px solid #dce8df}.selection strong{color:#075f2b;font-size:12px}.selection small{color:#718078;font-size:9px}.data-panel{margin-top:12px}.data-panel h2{margin:5px 0 0;color:#075f2b;font-size:18px}.data-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:13px}.data-grid article{padding:11px;border:1px solid #e0e7e2;border-radius:10px;background:#fbfdfb;display:grid;gap:3px}.data-grid strong{font-size:11px;color:#2f3d35}.data-grid span,.data-grid small{font-size:8px;color:#78857d}.muted{color:#718078;font-size:11px}.source{margin-top:10px;color:#7a877f;font-size:8px}@media(max-width:900px){.workspace{grid-template-columns:1fr}.stats{grid-template-columns:repeat(2,1fr)}}@media(max-width:520px){.hero{padding:18px}.hero h1{font-size:23px}.ghana-mark{display:none}.stats{grid-template-columns:1fr 1fr}.data-grid{grid-template-columns:1fr}.map-panel{padding:6px}}`;
