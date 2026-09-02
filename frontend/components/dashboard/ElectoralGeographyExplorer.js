"use client";

import { useEffect, useState } from "react";
import DashboardShell from "./DashboardShell";
import AIAnalyzer from "./AIAnalyzer";

const getToken = () => typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || localStorage.getItem("token") || sessionStorage.getItem("token") || localStorage.getItem("authToken") || sessionStorage.getItem("authToken") || localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || "";

async function request(path) {
  const token = getToken();
  if (!token) throw new Error("Authentication required. Please log in again.");
  const response = await fetch(path, { method: "GET", cache: "no-store", headers: { Accept: "application/json", Authorization: `Bearer ${token}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success !== true) throw new Error(data.message || `Unable to load electoral geography (${response.status}).`);
  return Array.isArray(data.data) ? data.data : [];
}

export default function ElectoralGeographyExplorer({ mode = "regions" }) {
  const [regions, setRegions] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [stations, setStations] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedConstituency, setSelectedConstituency] = useState("");
  const [loading, setLoading] = useState(true);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    request("/api/electoral-geography/regions")
      .then((data) => { if (!cancelled) setRegions(data); })
      .catch((e) => { if (!cancelled) setError(e.message || "Unable to load regions."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setConstituencies([]); setSelectedConstituency(""); setStations([]); setError("");
    if (!selectedRegion) return;
    request(`/api/electoral-geography/regions/${encodeURIComponent(selectedRegion)}/constituencies`)
      .then((data) => { if (!cancelled) setConstituencies(data); })
      .catch((e) => { if (!cancelled) setError(e.message || "Unable to load constituencies."); });
    return () => { cancelled = true; };
  }, [selectedRegion]);

  useEffect(() => {
    let cancelled = false;
    setStations([]); setError("");
    if (!selectedConstituency) return;
    setStationsLoading(true);
    request(`/api/electoral-geography/constituencies/${encodeURIComponent(selectedConstituency)}/polling-stations`)
      .then((data) => { if (!cancelled) setStations(data); })
      .catch((e) => { if (!cancelled) setError(e.message || "Unable to load polling stations."); })
      .finally(() => { if (!cancelled) setStationsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedConstituency]);

  return <DashboardShell role="party" navigation={[{section:"PARTY GEOGRAPHY",items:[{label:"Regions",href:"/party/regions",key:"regions",icon:"◎"},{label:"Constituencies",href:"/party/constituencies",key:"constituencies",icon:"▦"},{label:"Polling Stations",href:"/party/polling-stations",key:"stations",icon:"▣"},{label:"AI Analyzer",href:"#ai-analyzer",key:"ai",icon:"✦"}]}]} activeSection={mode}>
    <main style={{padding:20,background:"#f4f7f5",minHeight:"100vh"}}>
      <section style={hero}><span>CONNECTED ELECTORAL GEOGRAPHY</span><h1>Regions → Constituencies → Polling Stations</h1><p>Live electoral geography is loaded through the PoliSync application API.</p></section>
      {error && <div style={errorBox}>{error}</div>}
      <section style={grid}><Metric title="Regions" value={loading?"—":regions.length}/><Metric title="Loaded Constituencies" value={constituencies.length}/><Metric title="Loaded Polling Stations" value={stations.length}/></section>
      <section style={panel}><h2>Region</h2><select style={select} value={selectedRegion} onChange={e=>setSelectedRegion(e.target.value)} disabled={loading}><option value="">Select region</option>{regions.map(r=><option key={r._id} value={r._id}>{r.name}</option>)}</select><h2 style={{marginTop:20}}>Constituency</h2><select style={select} value={selectedConstituency} onChange={e=>setSelectedConstituency(e.target.value)} disabled={!selectedRegion||constituencies.length===0}><option value="">Select constituency</option>{constituencies.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}</select></section>
      <section style={panel}><h2>Polling stations {selectedConstituency?`(${stations.length})`:""}</h2>{!selectedConstituency?<p style={{color:"#7b877f"}}>Select a constituency to load its polling stations.</p>:stationsLoading?<p style={{color:"#7b877f"}}>Loading polling stations…</p>:stations.length===0?<p style={{color:"#a00000"}}>No polling stations were returned for this constituency.</p>:<div style={stationGrid}>{stations.map(s=><article key={s._id||s.pollingStationCode} style={station}><strong>{s.name}</strong><span>{s.pollingStationCode||"No code"}</span><small>{s.stationType||"Polling station"} • {s.sourceYear||"EC dataset"}</small></article>)}</div>}</section>
      <section id="ai-analyzer" style={{...panel,border:"1px solid #c9a227"}}><AIAnalyzer role="party"/></section>
    </main>
  </DashboardShell>;
}
const hero={padding:28,borderRadius:22,background:"linear-gradient(135deg,#04351a,#075f2b)",border:"1px solid #c9a227",color:"#fff"};
const grid={display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:10,margin:"12px 0"};
const panel={padding:18,borderRadius:16,background:"#fff",border:"1px solid #dce6df",marginBottom:12};
const select={width:"100%",padding:13,border:"1px solid #d6e1d9",borderRadius:10,background:"#fbfdfb"};
const errorBox={marginBottom:12,padding:13,border:"1px solid #efcccc",borderRadius:12,background:"#fff5f5",color:"#a00000",fontSize:12};
const stationGrid={display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:9};
const station={padding:12,borderRadius:12,border:"1px solid #e0e7e2",background:"#fbfdfb",display:"grid",gap:4};
function Metric({title,value}){return <div style={{padding:15,borderRadius:13,background:"#fff",border:"1px solid #dce6df"}}><small style={{color:"#7b877f"}}>{title}</small><strong style={{display:"block",color:"#075f2b",fontSize:20,marginTop:4}}>{value}</strong></div>}
