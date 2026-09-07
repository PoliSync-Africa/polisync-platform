"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";

const Map = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then((m) => m.CircleMarker), { ssr: false });
const Recenter = dynamic(() => import("./ResultsMapRecenter"), { ssr: false });

const GHANA = [7.9465, -1.0232];
const getToken = () => typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || localStorage.getItem("token") || sessionStorage.getItem("token") || "";
const api = (path) => fetch(path, { cache: "no-store", headers: { Accept: "application/json", ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) } }).then(async (r) => { const j = await r.json().catch(() => ({})); if (!r.ok || j.success !== true) throw new Error(j.message || `Request failed (${r.status}).`); return j; });
const coords = (item) => { if (!item) return null; const lat = Number(item.latitude ?? item.lat ?? item.location?.latitude); const lon = Number(item.longitude ?? item.lon ?? item.lng ?? item.location?.longitude); return Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : null; };

export default function ElectionResultsMapExplorer({ title = "Election Results", superAdmin = false }) {
  const [elections, setElections] = useState([]); const [electionId, setElectionId] = useState("");
  const [regions, setRegions] = useState([]); const [constituencies, setConstituencies] = useState([]); const [stations, setStations] = useState([]);
  const [regionId, setRegionId] = useState("all"); const [constituencyId, setConstituencyId] = useState("all"); const [stationId, setStationId] = useState("all");
  const [results, setResults] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const [focus, setFocus] = useState({ center: GHANA, zoom: 6 });

  useEffect(() => { Promise.all([api("/api/elections"), api("/api/electoral-geography/regions")]).then(([e, g]) => { const es = e.elections || []; setElections(es); if (es[0]?._id) setElectionId(String(es[0]._id)); setRegions(g.data || []); }).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  useEffect(() => { if (regionId === "all") { setConstituencies([]); setStations([]); return; } api(`/api/electoral-geography/regions/${encodeURIComponent(regionId)}/constituencies`).then(j => setConstituencies(j.data || [])).catch(e => setError(e.message)); setConstituencyId("all"); setStationId("all"); }, [regionId]);
  useEffect(() => { if (constituencyId === "all") { setStations([]); return; } api(`/api/electoral-geography/constituencies/${encodeURIComponent(constituencyId)}/polling-stations`).then(j => setStations(j.data || [])).catch(e => setError(e.message)); setStationId("all"); }, [constituencyId]);
  useEffect(() => { if (!electionId) return; setLoading(true); api(`/api/results/election/${encodeURIComponent(electionId)}`).then(j => setResults(j.results || [])).catch(e => setError(e.message)).finally(() => setLoading(false)); }, [electionId]);

  const selectedRegion = useMemo(() => regions.find(r => String(r._id) === regionId), [regions, regionId]);
  const selectedConstituency = useMemo(() => constituencies.find(c => String(c._id) === constituencyId), [constituencies, constituencyId]);
  const selectedStation = useMemo(() => stations.find(s => String(s._id) === stationId), [stations, stationId]);
  const selectedResults = useMemo(() => results.filter(r => (regionId === "all" || String(r.regionId?._id || r.regionId) === regionId) && (constituencyId === "all" || String(r.constituencyId?._id || r.constituencyId) === constituencyId) && (stationId === "all" || String(r.pollingStationId?._id || r.pollingStationId) === stationId)), [results, regionId, constituencyId, stationId]);
  const nationalValid = results.reduce((n, r) => n + Number(r.manualTotals?.totalValidVotes || 0), 0);
  const submittedNational = results.length;
  const geoStationCount = stationId !== "all" ? 1 : constituencyId !== "all" ? stations.length : regionId !== "all" ? (results.length ? new Set(results.map(r => r.pollingStationCode).filter(Boolean)).size : 0) : null;

  const selectRegion = (value) => { setRegionId(value); const r = regions.find(x => String(x._id) === value); const c = coords(r); if (c) setFocus({ center: c, zoom: 8 }); else if (value === "all") setFocus({ center: GHANA, zoom: 6 }); };
  const selectConstituency = (value) => { setConstituencyId(value); const c = constituencies.find(x => String(x._id) === value); const p = coords(c); if (p) setFocus({ center: p, zoom: 11 }); };
  const selectStation = (value) => { setStationId(value); const s = stations.find(x => String(x._id) === value); const p = coords(s); if (p) setFocus({ center: p, zoom: 14 }); };

  return <section className="results-map-explorer">
    <div className="head"><div><span>RESULTS GEOGRAPHY</span><h2>{title}</h2><p>Select National → Region → Constituency → Polling Station and view the corresponding results on the Ghana map.</p></div></div>
    {error && <div className="error">{error}</div>}
    <div className="filters">
      <label>Election<select value={electionId} onChange={e => setElectionId(e.target.value)}><option value="">Select election</option>{elections.map(e => <option key={e._id} value={e._id}>{e.name} • {e.year} • {e.type}</option>)}</select></label>
      <label>Geographic view<select value={regionId} onChange={e => selectRegion(e.target.value)}><option value="all">National — Ghana</option>{regions.map(r => <option key={r._id} value={r._id}>Regional — {r.name}</option>)}</select></label>
      <label>Constituency<select value={constituencyId} disabled={regionId === "all"} onChange={e => selectConstituency(e.target.value)}><option value="all">All constituencies</option>{constituencies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></label>
      <label>Polling station<select value={stationId} disabled={constituencyId === "all"} onChange={e => selectStation(e.target.value)}><option value="all">All polling stations</option>{stations.map(s => <option key={s._id} value={s._id}>{s.pollingStationCode} • {s.name}</option>)}</select></label>
    </div>
    <div className="map-wrap"><Map center={focus.center} zoom={focus.zoom} scrollWheelZoom className="map"><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Recenter center={focus.center} zoom={focus.zoom}/>{selectedRegion && <CircleMarker center={coords(selectedRegion) || GHANA} radius={15}><Popup><b>{selectedRegion.name}</b><br/>Region selected</Popup></CircleMarker>}{selectedConstituency && <CircleMarker center={coords(selectedConstituency) || GHANA} radius={11}><Popup><b>{selectedConstituency.name}</b><br/>Constituency selected<br/>Polling stations: {stations.length.toLocaleString()}</Popup></CircleMarker>}{selectedStation && coords(selectedStation) && <Marker position={coords(selectedStation)}><Popup><b>{selectedStation.name}</b><br/>{selectedStation.pollingStationCode || "No EC code"}</Popup></Marker>}</Map></div>
    <div className="stats"><Stat label="National polling stations" value="40,648"/><Stat label="Selected constituency stations" value={constituencyId === "all" ? "—" : stations.length}/><Stat label="Selected region stations" value={regionId === "all" ? "—" : (regionId !== "all" && constituencyId === "all" ? stations.length : "See constituency")}/><Stat label="Submitted result stations" value={selectedResults.length}/><Stat label="Valid votes" value={selectedResults.reduce((n,r)=>n+Number(r.manualTotals?.totalValidVotes||0),0)}/></div>
    <div className="details"><div><b>National</b><span>Ghana • {nationalValid.toLocaleString()} valid votes • {submittedNational.toLocaleString()} submitted stations</span></div>{selectedRegion && <div><b>{selectedRegion.name}</b><span>{regionId !== "all" ? `${(constituencyId === "all" ? stations.length : stations.length).toLocaleString()} selected polling stations` : ""}</span></div>}{selectedConstituency && <div><b>{selectedConstituency.name}</b><span>{stations.length.toLocaleString()} polling stations</span></div>}{selectedStation && <div><b>{selectedStation.name}</b><span>{selectedStation.pollingStationCode || "No EC code"}</span></div>}</div>
    <style jsx>{`.results-map-explorer{padding:16px;border-radius:16px;background:#fff;border:1px solid #dce6df;color:#193127}.head span{color:#c9a227;font-size:9px;font-weight:900;letter-spacing:1.4px}.head h2{margin:4px 0;color:#075f2b;font-size:22px}.head p{margin:0;color:#6f7c74;font-size:11px}.filters{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin:14px 0}.filters label{display:grid;gap:5px;color:#647168;font-size:9px;font-weight:800}.filters select{width:100%;min-height:40px;border:1px solid #d6e1d9;border-radius:9px;background:#fff;color:#173d28;padding:0 8px;font-size:10px}.map-wrap{height:480px;border-radius:14px;overflow:hidden;border:1px solid #dce6df}.map{height:100%;width:100%}.stats{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:10px}.stats>div{padding:11px;border:1px solid #e0e7e2;border-radius:11px;background:#f9fbfa}.stats small{display:block;color:#77847c;font-size:8px}.stats strong{display:block;margin-top:4px;color:#075f2b;font-size:18px}.details{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}.details>div{padding:11px;border-radius:11px;background:#f3f7f4;border-left:3px solid #c9a227}.details b{display:block;color:#075f2b;font-size:10px}.details span{display:block;margin-top:4px;color:#68756d;font-size:9px}.error{padding:10px;margin-top:10px;background:#fff5f5;border:1px solid #edcaca;color:#a00000;border-radius:10px;font-size:10px}@media(max-width:850px){.filters{grid-template-columns:repeat(2,1fr)}.stats{grid-template-columns:repeat(3,1fr)}.details{grid-template-columns:repeat(2,1fr)}}@media(max-width:520px){.filters,.stats,.details{grid-template-columns:1fr}.map-wrap{height:380px}}`}</style>
  </section>;
}
function Stat({label,value}){return <div><small>{label}</small><strong>{typeof value === "number" ? value.toLocaleString() : value}</strong></div>;}
