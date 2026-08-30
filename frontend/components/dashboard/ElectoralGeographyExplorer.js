"use client";

import { useEffect, useState } from "react";
import DashboardShell from "./DashboardShell";
import AIAnalyzer from "./AIAnalyzer";

export default function ElectoralGeographyExplorer({ mode = "regions" }) {
  const [regions, setRegions] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [stations, setStations] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedConstituency, setSelectedConstituency] = useState("");
  const [loading, setLoading] = useState(true);
  const token = typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || "";
  const api = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

  useEffect(() => { if (!api || !token) { setLoading(false); return; } fetch(`${api}/api/electoral-geography/regions`, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json()).then(d=>setRegions(d?.data||[])).catch(()=>{}).finally(()=>setLoading(false)); }, [api,token]);
  useEffect(() => { if(!selectedRegion||!api||!token)return; setConstituencies([]);setStations([]);setSelectedConstituency(""); fetch(`${api}/api/electoral-geography/regions/${selectedRegion}/constituencies`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>setConstituencies(d?.data||[])).catch(()=>{}); },[selectedRegion,api,token]);
  useEffect(() => { if(!selectedConstituency||!api||!token)return; fetch(`${api}/api/electoral-geography/constituencies/${selectedConstituency}/polling-stations`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>setStations(d?.data||[])).catch(()=>{}); },[selectedConstituency,api,token]);

  return <DashboardShell role="party" navigation={[{section:"PARTY GEOGRAPHY",items:[{label:"Regions",href:"/party/regions",key:"regions",icon:"◎"},{label:"Constituencies",href:"/party/constituencies",key:"constituencies",icon:"▦"},{label:"Polling Stations",href:"/party/polling-stations",key:"stations",icon:"▣"},{label:"AI Analyzer",href:"#ai-analyzer",key:"ai",icon:"✦"}]}]} activeSection={mode}>
    <main style={{padding:20,background:"#f4f7f5",minHeight:"100vh"}}><section style={hero}><span>CONNECTED ELECTORAL GEOGRAPHY</span><h1>Regions → Constituencies → Polling Stations</h1><p>These screens read the canonical electoral hierarchy from the PoliSync backend instead of frontend placeholder data.</p></section>
      <section style={grid}><Metric title="Regions" value={loading?"—":regions.length}/><Metric title="Loaded Constituencies" value={constituencies.length}/><Metric title="Loaded Polling Stations" value={stations.length}/></section>
      <section style={panel}><h2>Region</h2><select style={select} value={selectedRegion} onChange={e=>setSelectedRegion(e.target.value)}><option value="">Select region</option>{regions.map(r=><option key={r._id} value={r._id}>{r.name}</option>)}</select><h2 style={{marginTop:20}}>Constituency</h2><select style={select} value={selectedConstituency} onChange={e=>setSelectedConstituency(e.target.value)} disabled={!selectedRegion}><option value="">Select constituency</option>{constituencies.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}</select></section>
      <section style={panel}><h2>Polling stations {selectedConstituency?`(${stations.length})`:""}</h2>{stations.length===0?<p style={{color:"#7b877f"}}>Select a constituency to load its polling stations.</p>:<div style={stationGrid}>{stations.map(s=><article key={s._id} style={station}><strong>{s.name}</strong><span>{s.pollingStationCode||"No code"}</span><small>{s.stationType||"Polling station"}</small></article>)}</div>}</section>
      <section id="ai-analyzer" style={{...panel,border:"1px solid #c9a227"}}><AIAnalyzer role="party"/></section>
    </main></DashboardShell>;
}
const hero={padding:28,borderRadius:22,background:"linear-gradient(135deg,#04351a,#075f2b)",border:"1px solid #c9a227",color:"#fff"};
const grid={display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:10,margin:"12px 0"};
const panel={padding:18,borderRadius:16,background:"#fff",border:"1px solid #dce6df",marginBottom:12};
const select={width:"100%",padding:13,border:"1px solid #d6e1d9",borderRadius:10,background:"#fbfdfb"};
const stationGrid={display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:9};
const station={padding:12,borderRadius:12,border:"1px solid #e0e7e2",background:"#fbfdfb",display:"grid",gap:4};
function Metric({title,value}){return <div style={{padding:15,borderRadius:13,background:"#fff",border:"1px solid #dce6df"}}><small style={{color:"#7b877f"}}>{title}</small><strong style={{display:"block",color:"#075f2b",fontSize:20,marginTop:4}}>{value}</strong></div>}
