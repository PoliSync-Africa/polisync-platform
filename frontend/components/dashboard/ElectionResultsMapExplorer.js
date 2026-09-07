"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const Map = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then((m) => m.CircleMarker), { ssr: false });
const Tooltip = dynamic(() => import("react-leaflet").then((m) => m.Tooltip), { ssr: false });
const Recenter = dynamic(() => import("./ResultsMapRecenter"), { ssr: false });

const GHANA = [7.9465, -1.0232];
const getToken = () => typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || localStorage.getItem("token") || sessionStorage.getItem("token") || "";
const coords = (x) => {
  if (!x) return null;
  const lat = Number(x.latitude ?? x.lat ?? x.location?.latitude);
  const lon = Number(x.longitude ?? x.lon ?? x.lng ?? x.location?.longitude);
  return Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : null;
};
const fmt = (n) => Number(n || 0).toLocaleString();
const icons = { level: "⌁", organization: "♟", type: "▤", election: "◇", region: "⌖", constituency: "◆", station: "⚑" };

async function api(path) {
  const token = getToken();
  const response = await fetch(path, { cache: "no-store", headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.success !== true) throw new Error(json.message || `Request failed (${response.status})`);
  return json;
}

export default function ElectionResultsMapExplorer({ title = "Election Results" }) {
  const [elections, setElections] = useState([]);
  const [electionId, setElectionId] = useState("");
  const [regions, setRegions] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [stations, setStations] = useState([]);
  const [regionId, setRegionId] = useState("all");
  const [constituencyId, setConstituencyId] = useState("all");
  const [stationId, setStationId] = useState("all");
  const [data, setData] = useState(null);
  const [focus, setFocus] = useState({ center: GHANA, zoom: 6 });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([api("/api/elections"), api("/api/electoral-geography/regions")])
      .then(([electionResponse, geographyResponse]) => {
        const list = electionResponse.elections || [];
        setElections(list);
        if (list[0]?._id) setElectionId(String(list[0]._id));
        setRegions(geographyResponse.data || []);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    setConstituencies([]);
    setStations([]);
    setConstituencyId("all");
    setStationId("all");
    if (regionId === "all") {
      setFocus({ center: GHANA, zoom: 6 });
      return;
    }
    api(`/api/electoral-geography/regions/${encodeURIComponent(regionId)}/constituencies`)
      .then((j) => setConstituencies(j.data || []))
      .catch((e) => setError(e.message));
    api(`/api/electoral-geography/polling-stations?regionId=${encodeURIComponent(regionId)}`)
      .then((j) => setStations(j.data || []))
      .catch((e) => setError(e.message));
    const point = coords(regions.find((x) => String(x._id) === regionId));
    if (point) setFocus({ center: point, zoom: 8 });
  }, [regionId, regions]);

  useEffect(() => {
    setStationId("all");
    if (constituencyId === "all") return;
    api(`/api/electoral-geography/constituencies/${encodeURIComponent(constituencyId)}/polling-stations`)
      .then((j) => setStations(j.data || []))
      .catch((e) => setError(e.message));
    const point = coords(constituencies.find((x) => String(x._id) === constituencyId));
    if (point) setFocus({ center: point, zoom: 11 });
  }, [constituencyId, constituencies]);

  useEffect(() => {
    if (!electionId) return;
    setLoading(true);
    setError("");
    const view = stationId !== "all" ? "polling_station" : constituencyId !== "all" ? "constituency" : regionId !== "all" ? "regional" : "national";
    api(`/api/results/dashboard?${new URLSearchParams({ view, electionId, regionId, constituencyId, pollingStationId: stationId })}`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [electionId, regionId, constituencyId, stationId]);

  const selectedRegion = regions.find((r) => String(r._id) === regionId);
  const selectedConstituency = constituencies.find((c) => String(c._id) === constituencyId);
  const selectedStation = stations.find((s) => String(s._id) === stationId);
  const coverage = data?.coverage || { national: {}, regions: [], constituencies: [] };
  const regionCoverage = coverage.regions?.find((r) => String(r._id) === regionId);
  const constituencyCoverage = coverage.constituencies?.find((c) => String(c._id) === constituencyId);
  const election = elections.find((e) => String(e._id) === String(electionId));
  const electionTypes = useMemo(() => [...new Set(elections.map((e) => e.type).filter(Boolean))], [elections]);
  const regionPoints = useMemo(() => regions.filter((r) => coords(r)), [regions]);
  const partyRows = data?.presidentialSummary || [];
  const seats = data?.parliamentarySummary?.seatsByParty || {};
  const partyMeta = new Map((election?.parties || []).map((p) => [p.name, p]));
  const reset = () => { setRegionId("all"); setConstituencyId("all"); setStationId("all"); };

  return (
    <section className="results-map-explorer">
      <header className="explorer-hero">
        <div className="hero-mark">▥</div>
        <div className="hero-copy">
          <span className="eyebrow">RESULTS INTELLIGENCE</span>
          <h2>{title} Explorer</h2>
          <p>Explore verified election results across Ghana, from the national view down to polling stations.</p>
        </div>
        <div className="live-badge"><i /> <strong>Live Data</strong><small>{loading ? "Updating…" : "Ready to explore"}</small></div>
      </header>

      {error && <div className="error"><strong>Unable to load results</strong><span>{error}</span></div>}

      <section className="filter-panel">
        <div className="filter-heading">
          <div className="filter-title"><span className="filter-symbol">⌯</span><div><h3>Filter Results</h3><p>Select the criteria below to explore election results</p></div></div>
          <button type="button" className="reset" onClick={reset}>↻ <span>Reset Filters</span></button>
        </div>
        <div className="filters">
          <Filter icon="level" label="View Level"><select value={stationId !== "all" ? "Polling Station" : constituencyId !== "all" ? "Constituency" : regionId !== "all" ? "Regional" : "National"} onChange={(e) => e.target.value === "National" && reset()}><option>National</option><option>Regional</option><option>Constituency</option><option>Polling Station</option></select></Filter>
          <Filter icon="organization" label="Organization"><select><option>All organizations</option><option>Political parties</option><option>Observer organizations</option><option>Public / EC data</option></select></Filter>
          <Filter icon="type" label="Election Type"><select value={election?.type || ""} onChange={(e) => { const found = elections.find((v) => v.type === e.target.value); if (found) setElectionId(String(found._id)); }}><option value="">All election types</option>{electionTypes.map((x) => <option key={x}>{x}</option>)}</select></Filter>
          <Filter icon="election" label="Election"><select value={electionId} onChange={(e) => setElectionId(e.target.value)}><option value="">Select election</option>{elections.map((e) => <option key={e._id} value={e._id}>{e.name} • {e.year}</option>)}</select></Filter>
          <Filter icon="region" label="Region"><select value={regionId} onChange={(e) => setRegionId(e.target.value)}><option value="all">All EC regions</option>{regions.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}</select></Filter>
          <Filter icon="constituency" label="Constituency"><select value={constituencyId} disabled={regionId === "all"} onChange={(e) => setConstituencyId(e.target.value)}><option value="all">All EC constituencies</option>{constituencies.map((c) => <option key={c._id} value={c._id}>{c.name}{c.constituencyNumber ? ` • ${c.constituencyNumber}` : ""}</option>)}</select></Filter>
          <Filter icon="station" label="Polling Station"><select value={stationId} disabled={constituencyId === "all"} onChange={(e) => { setStationId(e.target.value); const point = coords(stations.find((x) => String(x._id) === e.target.value)); if (point) setFocus({ center: point, zoom: 15 }); }}><option value="all">All EC polling stations</option>{stations.map((s) => <option key={s._id} value={s._id}>{s.pollingStationCode} • {s.name}</option>)}</select></Filter>
          <Filter icon="election" label="Election Date"><select><option>All dates</option>{elections.map((e) => <option key={`date-${e._id}`}>{e.date ? new Date(e.date).toLocaleDateString() : e.year || "—"}</option>)}</select></Filter>
        </div>
        <div className="trusted"><div className="trusted-icon">✓</div><div><strong>Trusted Data</strong><p>Election results are sourced from the Electoral Commission (EC) dataset and verified through PoliSync.</p></div><div className="brand"><span>▥</span><strong>PoliSync</strong><small>Transparent Elections.<br />Stronger Democracies.</small></div></div>
      </section>

      <section className="map-card">
        <div className="map-header"><div><span className="map-kicker">GHANA ELECTORAL GEOGRAPHY</span><h3>{selectedRegion?.name || "Ghana"}</h3><p>{selectedConstituency?.name || (selectedRegion ? "Regional overview" : "16-region national overview")}{selectedStation ? ` • ${selectedStation.name}` : ""}</p></div><span className="map-status"><i /> Interactive map</span></div>
        <div className="map-wrap">
          <Map center={focus.center} zoom={focus.zoom} scrollWheelZoom className="map">
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Recenter center={focus.center} zoom={focus.zoom} />
            {regionId === "all" && regionPoints.map((region) => <CircleMarker key={region._id} center={coords(region)} radius={6} pathOptions={{ color: "#087747", weight: 2, fillColor: "#ffffff", fillOpacity: 1 }}><Tooltip direction="top" offset={[0, -5]}>{region.name}</Tooltip><Popup><b>{region.name}</b><br />Select this region from the filter to drill down.</Popup></CircleMarker>)}
            {selectedRegion && coords(selectedRegion) && <CircleMarker center={coords(selectedRegion)} radius={18} pathOptions={{ color: "#075d34", weight: 4, fillColor: "#21bb67", fillOpacity: .85 }}><Popup><b>{selectedRegion.name}</b><br />Stations: {fmt(regionCoverage?.totalPollingStations)}<br />Received: {fmt(regionCoverage?.received)}<br />Pending: {fmt(regionCoverage?.awaitingPending)}</Popup></CircleMarker>}
            {selectedConstituency && coords(selectedConstituency) && <CircleMarker center={coords(selectedConstituency)} radius={13} pathOptions={{ color: "#0b5b3b", weight: 3, fillColor: "#f2c94c", fillOpacity: .9 }}><Popup><b>{selectedConstituency.name}</b><br />Stations: {fmt(constituencyCoverage?.totalPollingStations)}<br />Received: {fmt(constituencyCoverage?.received)}<br />Pending: {fmt(constituencyCoverage?.awaitingPending)}</Popup></CircleMarker>}
            {selectedStation && coords(selectedStation) && <Marker position={coords(selectedStation)}><Popup><b>{selectedStation.name}</b><br />{selectedStation.pollingStationCode || "No EC code"}</Popup></Marker>}
          </Map>
          <div className="map-overlay"><strong>Ghana</strong><span>{regions.length || 16} regions</span><small>Use the filters to drill down</small></div>
        </div>
      </section>

      <div className="coverage"><Coverage title="National" c={coverage.national} />{selectedRegion && <Coverage title={selectedRegion.name} c={regionCoverage} />}{selectedConstituency && <Coverage title={selectedConstituency.name} c={constituencyCoverage} />}</div>

      {election?.type === "Presidential" && <section className="result-card"><h3>Presidential Results Summary</h3><div className="levels"><Level label="Total Polling Stations" total={coverage.national?.totalPollingStations} received={coverage.national?.received} pending={coverage.national?.awaitingPending} /><Level label="Total Constituencies" total={coverage.national?.totalConstituencies} received={coverage.national?.receivedConstituencies} pending={coverage.national?.awaitingPendingConstituencies} /><Level label="Total Regions" total={coverage.national?.totalRegions} received={coverage.national?.receivedRegions} pending={coverage.national?.awaitingPendingRegions} /></div><div className="party-list">{partyRows.map((p) => <div className="party" key={p.party}>{partyMeta.get(p.party)?.logoUrl ? <img src={partyMeta.get(p.party).logoUrl} alt="" /> : <div className="logo">{p.party.slice(0, 2)}</div>}<div><b>{p.party}</b><small>{fmt(p.votes)} votes</small></div><strong>{p.percentage}%</strong></div>)}</div></section>}
      {election?.type === "Parliamentary" && <section className="result-card"><h3>Parliamentary Results</h3><p className="muted">Constituency winners by party across the selected election.</p><div className="party-seats">{Object.entries(seats).sort((a, b) => b[1] - a[1]).map(([p, v]) => <div key={p}><b>{p}</b><strong>{fmt(v)}</strong><small>constituency seats</small></div>)}</div></section>}
      {loading && <div className="loading"><span />Loading election results…</div>}

      <style jsx>{`\
.results-map-explorer{padding:clamp(12px,2.5vw,28px);border-radius:24px;background:linear-gradient(180deg,#f5fbf7,#eff7f3);border:1px solid #d7e7de;color:#163428;box-shadow:0 16px 45px rgba(10,73,42,.08)}
.explorer-hero{position:relative;overflow:hidden;display:flex;align-items:center;gap:18px;padding:24px 26px;border-radius:20px;background:linear-gradient(115deg,#075d34,#087747 58%,#0b5b3b);color:#fff;box-shadow:0 14px 30px rgba(4,83,44,.18)}
.explorer-hero:after{content:"";position:absolute;right:-70px;top:-110px;width:300px;height:300px;border:48px solid rgba(255,255,255,.045);border-radius:50%}.hero-mark{width:62px;height:62px;flex:0 0 62px;border-radius:18px;display:grid;place-items:center;background:rgba(255,255,255,.13);font-size:28px}.hero-copy{flex:1;min-width:0;position:relative;z-index:1}.eyebrow,.map-kicker{display:block;color:#9be4ba;font-size:10px;font-weight:900;letter-spacing:1.8px}.hero-copy h2{margin:5px 0 7px;color:#fff;font-size:clamp(25px,4vw,38px);line-height:1.05}.hero-copy p{margin:0;max-width:700px;color:rgba(255,255,255,.78);font-size:13px;line-height:1.55}.live-badge{position:relative;z-index:2;min-width:132px;padding:12px 14px;border-radius:14px;background:#fff;color:#0a5c36;display:grid;gap:2px;box-shadow:0 8px 20px rgba(0,0,0,.08)}.live-badge i,.map-status i{display:inline-block;width:8px;height:8px;border-radius:50%;background:#20bb67;box-shadow:0 0 0 4px rgba(32,187,103,.14);margin-right:6px}.live-badge small{color:#6c7e74;font-size:9px}.filter-panel{margin-top:16px;padding:20px;border-radius:20px;background:#fff;border:1px solid #dfeae4;box-shadow:0 10px 25px rgba(15,65,43,.05)}.filter-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}.filter-title{display:flex;align-items:center;gap:12px}.filter-symbol{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:#eaf7f0;color:#087747;font-size:24px}.filter-title h3{margin:0;color:#102d22;font-size:20px}.filter-title p{margin:3px 0 0;color:#73837a;font-size:11px}.reset{border:1px solid #d7e5de;background:#fff;color:#075d34;border-radius:12px;padding:10px 13px;font-weight:800;cursor:pointer}.filters{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.filter{display:flex;align-items:center;gap:11px;padding:12px;border:1px solid #e1e9e5;border-radius:14px;background:#fbfdfc;min-width:0}.field-icon{width:38px;height:38px;flex:0 0 38px;border-radius:50%;display:grid;place-items:center;background:#eff9f4;color:#087747;font-size:18px}.field-body{display:grid;gap:6px;min-width:0;flex:1}.field-body>b{font-size:11px;color:#20392e}.field-body select{width:100%;min-height:38px;border:1px solid #dbe6e0;border-radius:9px;background:#fff;color:#1a392b;padding:0 10px;font-size:11px;outline:none}.field-body select:focus{border-color:#087747;box-shadow:0 0 0 3px rgba(8,119,71,.1)}.field-body select:disabled{background:#f1f4f2;color:#a1aaa5}.trusted{display:flex;align-items:center;gap:12px;margin-top:14px;padding:13px 15px;border:1px solid #cfe9dc;border-radius:14px;background:#f2fbf6}.trusted-icon{width:36px;height:36px;flex:0 0 36px;border-radius:50%;display:grid;place-items:center;background:#27b86a;color:#fff;font-weight:900}.trusted strong{display:block;color:#174d35;font-size:12px}.trusted p{margin:3px 0 0;color:#718178;font-size:9px;line-height:1.4}.brand{margin-left:auto;padding-left:18px;border-left:1px solid #d1e6da;display:grid;grid-template-columns:auto auto;column-gap:7px;align-items:center}.brand span{grid-row:1 / span 2;color:#16a55d;font-size:26px}.brand strong{color:#173f2d;font-size:15px}.brand small{color:#7c8b83;font-size:7px;line-height:1.25}.map-card{margin-top:16px;padding:14px;border-radius:20px;background:#fff;border:1px solid #dfeae4;box-shadow:0 10px 25px rgba(15,65,43,.05)}.map-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 4px 12px}.map-header h3{margin:3px 0 2px;color:#12382a;font-size:20px}.map-header p{margin:0;color:#75837b;font-size:10px}.map-status{white-space:nowrap;padding:8px 10px;border-radius:20px;background:#eff9f4;color:#17623f;font-size:9px;font-weight:800}.map-wrap{position:relative;height:clamp(360px,58vw,560px);border-radius:16px;overflow:hidden;border:1px solid #dce7e1;background:#e9f1ed}.map{height:100%;width:100%}.map-overlay{position:absolute;z-index:500;left:12px;bottom:12px;padding:9px 11px;border-radius:11px;background:rgba(255,255,255,.93);border:1px solid #dce8e1;box-shadow:0 5px 16px rgba(0,0,0,.08);display:grid;gap:1px}.map-overlay strong{font-size:12px;color:#12432e}.map-overlay span,.map-overlay small{font-size:8px;color:#738179}.coverage{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px}.coverage-card,.result-card{border:1px solid #dfe8e3;border-radius:14px;padding:13px;background:#fff}.coverage-card h4{margin:0 0 7px;color:#075d34;font-size:12px}.coverage-card p{margin:4px 0;color:#748178;font-size:9px}.coverage-card b{color:#183b2c}.result-card{margin-top:12px}.result-card h3{margin:0 0 10px;color:#075d34;font-size:16px}.muted{font-size:9px;color:#78867f}.levels{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.level{padding:11px;border-radius:11px;background:#f3f8f5}.level b,.level strong,.level small{display:block}.level b{color:#075d34;font-size:10px}.level strong{margin-top:4px;font-size:20px}.level small{margin-top:3px;color:#78867f;font-size:8px}.party-list{display:grid;gap:6px;margin-top:10px}.party{display:flex;align-items:center;gap:9px;padding:8px;border-bottom:1px solid #edf1ee}.party img,.logo{width:32px;height:32px;border-radius:50%;object-fit:contain}.logo{display:grid;place-items:center;background:#075d34;color:#fff;font-size:9px;font-weight:900}.party>div:nth-child(2){flex:1}.party b,.party small{display:block}.party small{color:#7c8982;font-size:8px}.party>strong{color:#075d34}.party-seats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.party-seats>div{padding:12px;border-radius:10px;background:#f3f8f5}.party-seats b,.party-seats strong,.party-seats small{display:block}.party-seats strong{margin-top:3px;color:#075d34;font-size:22px}.party-seats small{font-size:8px;color:#7c8982}.error{margin-top:12px;padding:11px;border-radius:11px;background:#fff6f6;border:1px solid #eccaca;color:#a00;font-size:10px;display:grid;gap:2px}.error span{color:#9d5c5c}.loading{margin-top:10px;padding:10px;text-align:center;color:#5f7168;font-size:10px}.loading span{display:inline-block;width:9px;height:9px;border:2px solid #9ed4b8;border-top-color:#087747;border-radius:50%;margin-right:7px;vertical-align:-1px;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:760px){.explorer-hero{padding:19px;gap:12px}.hero-mark{width:48px;height:48px;flex-basis:48px;border-radius:14px;font-size:22px}.hero-copy p{font-size:11px}.live-badge{min-width:100px;padding:9px}.live-badge strong{font-size:10px}.live-badge small{font-size:7px}.filter-panel{padding:14px}.filters{grid-template-columns:1fr}.trusted{align-items:flex-start}.brand{display:none}.coverage{grid-template-columns:1fr}.levels{grid-template-columns:1fr 1fr}.party-seats{grid-template-columns:1fr 1fr}.map-header{align-items:flex-start}.map-header h3{font-size:17px}.map-wrap{height:390px}}@media(max-width:480px){.results-map-explorer{padding:8px;border-radius:17px}.explorer-hero{display:grid;grid-template-columns:auto 1fr;align-items:start;padding:16px;border-radius:16px}.live-badge{grid-column:1 / -1;width:100%;display:flex;align-items:center;gap:7px}.live-badge small{margin-left:auto}.filter-heading{align-items:flex-start}.filter-title h3{font-size:17px}.filter-title p{font-size:9px}.reset{padding:8px 9px}.reset span{display:none}.filter{padding:9px}.map-card{padding:9px}.map-status{font-size:7px}.map-wrap{height:330px}.map-overlay{left:8px;bottom:8px}.levels,.party-seats{grid-template-columns:1fr}.result-card{padding:11px}}`}</style>
    </section>
  );
}

function Filter({ icon, label, children }) { return <label className="filter"><span className="field-icon">{icons[icon]}</span><span className="field-body"><b>{label}</b>{children}</span></label>; }
function Coverage({ title, c = {} }) { return <div className="coverage-card"><h4>{title}</h4><p><b>{fmt(c?.totalPollingStations)}</b> total polling stations</p><p>Received <b>{fmt(c?.received)}</b> • Awaiting/Pending <b>{fmt(c?.awaitingPending)}</b></p>{c?.totalConstituencies !== undefined && <p><b>{fmt(c.totalConstituencies)}</b> constituencies • {fmt(c.receivedConstituencies)} received • {fmt(c.awaitingPendingConstituencies)} pending</p>}</div>; }
function Level({ label, total, received, pending }) { return <div className="level"><b>{label}</b><strong>{fmt(total)}</strong><small>Received: {fmt(received)} • Awaiting/Pending: {fmt(pending)}</small></div>; }
