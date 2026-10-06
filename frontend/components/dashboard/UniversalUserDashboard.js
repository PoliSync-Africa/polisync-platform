"use client";

import { useEffect, useState } from "react";
import DashboardShell from "./DashboardShell";

const t=()=>typeof window==="undefined"?"":localStorage.getItem("polisync_token")||sessionStorage.getItem("polisync_token")||localStorage.getItem("authToken")||sessionStorage.getItem("authToken")||"";
const api=()=>String(process.env.NEXT_PUBLIC_API_URL||"https://polisync-platform-1.onrender.com").replace(/\/+$/,"");
const go=h=>{if(typeof window!=="undefined")window.location.href=h};

const nav=[
 {section:"ELECTION CENTER",items:[
  {label:"Dashboard",href:"/dashboard",key:"dashboard",icon:"⌂"},
  {label:"Elections",href:"/elections",key:"elections",icon:"•"},
  {label:"Transmit Result",href:"/submit-result",key:"submit-result",icon:"⇧"},
  {label:"Live Results",href:"/results",key:"results",icon:"↗"}
 ]},
 {section:"PARTIES & CANDIDATES",items:[
  {label:"Political Parties",href:"/party",key:"party",icon:"▣"},
  {label:"Presidential Candidates",href:"/presidential-candidate",key:"presidential-candidate",icon:"★"},
  {label:"Parliamentary Candidates",href:"/parliamentary-candidate",key:"parliamentary-candidate",icon:"☆"}
 ]},
 {section:"ACCOUNT",items:[
  {label:"Profile",href:"/profile",key:"profile",icon:"♙"},
  {label:"Privacy & Security",href:"/settings/security",key:"privacy-security",icon:"⚿"}
 ]}
];

export default function UniversalUserDashboard(){
 const[s,setS]=useState({loading:true,user:null,geo:{},electionAccess:false,error:""});
 useEffect(()=>{
  const token=t();
  if(!token){setS(x=>({...x,loading:false,error:"Authentication required."}));return}
  const h={Authorization:"Bearer "+token,Accept:"application/json"};
  const get=u=>fetch(api()+u,{headers:h,cache:"no-store"}).then(r=>r.json());
  Promise.allSettled([get("/api/profile/me"),get("/api/electoral-geography/summary"),get("/api/elections/access")]).then(([p,g,e])=>{
   setS({
    loading:false,
    user:p.status==="fulfilled"&&p.value?.success?p.value.user:null,
    geo:g.status==="fulfilled"&&g.value?.success&&g.value.data&&typeof g.value.data==="object"?g.value.data:{},
    electionAccess:e.status==="fulfilled"&&e.value?.success&&Boolean(e.value.canViewOrganizationElections),
    error:p.status==="fulfilled"&&!p.value?.success?p.value?.message||"Unable to load account.":""
   })
  })
 },[]);
 const u=s.user||{}; const name=u.firstName||u.displayName||"there";
 return <DashboardShell role="user" navigation={nav} activeSection="dashboard" user={u}>
  <main className="election-dashboard">
   <section className="election-hero">
    <div><span className="eyebrow">POLISYNC AFRICA · ELECTION OPERATIONS</span><h1>Election Command Center</h1><p>Manage election scope, transmit polling-station results and monitor verification from one focused workspace.</p>
     <div className="hero-actions"><button onClick={()=>go("/elections")}>Open Elections</button><button onClick={()=>go("/submit-result")}>Transmit Result</button><button onClick={()=>go("/results")}>View Live Results</button></div>
    </div>
    <div className="status-card"><span>RESULTS PIPELINE</span><strong>Ready for transmission</strong><small>Election → Polling Station → Result → Verification</small></div>
   </section>
   {s.error&&<div className="error">{s.error}</div>}
   <section className="stats">
    <button onClick={()=>go("/elections")}><small>ELECTIONS</small><strong>{s.loading?"—":Number(s.geo.elections||0).toLocaleString()}</strong><span>Election deployments</span></button>
    <button onClick={()=>go("/elections")}><small>REGIONS</small><strong>{s.loading?"—":Number(s.geo.regions||0).toLocaleString()}</strong><span>Electoral regions</span></button>
    <button onClick={()=>go("/elections")}><small>CONSTITUENCIES</small><strong>{s.loading?"—":Number(s.geo.constituencies||0).toLocaleString()}</strong><span>Electoral constituencies</span></button>
    <button onClick={()=>go("/elections")}><small>POLLING STATIONS</small><strong>{s.loading?"—":Number(s.geo.pollingStations||0).toLocaleString()}</strong><span>Reporting locations</span></button>
   </section>
   <div className="section-title"><span className="eyebrow">CORE FUNCTIONS</span><h2>Election-first workspace</h2></div>
   <section className="modules">
    <Module title="Election setup & access" text="Configure election deployments and role-based access across electoral geography." href="/elections" icon="•"/>
    <Module title="Results transmission" text="Enter candidate results, validate totals, attach source documents and transmit." href="/submit-result" icon="⇧"/>
    <Module title="Results monitoring" text="Review transmitted results and their verification state across the election hierarchy." href="/results" icon="↗"/>
    <Module title="Party election workspace" text="Political party accounts remain available for election participation, agents and result visibility." href="/party" icon="▣"/>
    <Module title="Candidate election workspace" text="Candidate accounts remain available for election participation and result visibility." href="/presidential-candidate" icon="★"/>
    <Module title="Election integrity" text="Use structured validation and verification records to keep transmitted results auditable." href="/integrity" icon="✓"/>
   </section>
   <section className="participant-strip"><div><span className="eyebrow">PRESERVED PARTICIPANTS</span><h2>Parties and candidates remain part of PoliSync.</h2><p>They are preserved as election participants, while non-election product areas are no longer part of the core platform experience.</p></div><div className="participant-buttons"><button onClick={()=>go("/party")}>Political Parties</button><button onClick={()=>go("/presidential-candidate")}>Presidential Candidates</button><button onClick={()=>go("/parliamentary-candidate")}>Parliamentary Candidates</button></div></section>
  </main>
  <style jsx>{css}</style>
 </DashboardShell>
}

function Module({title,text,href,icon}){return <button className="module" onClick={()=>go(href)}><span className="module-icon">{icon}</span><h3>{title}</h3><p>{text}</p><b>Open →</b></button>}
const css=`.election-dashboard{min-height:100%;padding:clamp(14px,2.6vw,34px);background:#f4f7f5;color:#193127}.election-hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,.42fr);gap:20px;padding:clamp(22px,3.5vw,36px);border-radius:22px;background:linear-gradient(135deg,#063b1d,#08713a);color:#fff;border:1px solid #c9a227;box-shadow:0 18px 42px rgba(7,95,43,.14)}.eyebrow{display:block;color:#c9a227;font-size:10px;font-weight:900;letter-spacing:1.4px}.election-hero h1{margin:8px 0 12px;font-size:clamp(29px,4vw,48px);letter-spacing:-.04em}.election-hero p{max-width:750px;margin:0;color:#dce9e1;font-size:15px;line-height:1.6}.hero-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:22px}.hero-actions button,.participant-buttons button{padding:11px 14px;border-radius:10px;border:1px solid #c9a227;background:#fff;color:#075f2b;font-weight:850}.status-card{align-self:stretch;display:flex;flex-direction:column;justify-content:center;padding:20px;border-radius:16px;background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.14)}.status-card span{font-size:9px;font-weight:900;letter-spacing:1.2px;color:#d9bf58}.status-card strong{margin:8px 0;color:#fff;font-size:20px}.status-card small{color:#c5d7ce;line-height:1.5}.error{margin-top:12px;padding:12px;border:1px solid #efcaca;border-radius:12px;background:#fff6f6;color:#a62c2c;font-size:12px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:14px 0}.stats button{padding:16px;text-align:left;border:1px solid #d8e4dc;border-radius:15px;background:#fff}.stats small{display:block;color:#7b8b82;font-size:9px;font-weight:900;letter-spacing:1px}.stats strong{display:block;margin:5px 0;color:#075f2b;font-size:26px}.stats span{color:#78867f;font-size:10px}.section-title{margin:26px 0 10px}.section-title h2,.participant-strip h2{margin:5px 0;color:#193127;font-size:22px}.modules{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.module{padding:18px;text-align:left;border:1px solid #d8e4dc;border-radius:16px;background:#fff}.module-icon{width:38px;height:38px;display:grid;place-items:center;border-radius:11px;background:#eaf5ee;color:#075f2b;font-size:19px}.module h3{margin:12px 0 6px;color:#075f2b;font-size:15px}.module p{min-height:48px;margin:0;color:#718078;font-size:11px;line-height:1.55}.module b{display:block;margin-top:14px;color:#075f2b;font-size:10px}.participant-strip{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,.7fr);gap:25px;margin-top:14px;padding:22px;border:1px solid #d8e4dc;border-radius:18px;background:#fbfcfb}.participant-strip p{margin:8px 0 0;color:#687970;font-size:12px;line-height:1.6}.participant-buttons{display:grid;gap:8px;align-content:center}.participant-buttons button{text-align:left;border-color:#d8e4dc}.participant-buttons button:hover{border-color:#075f2b;background:#eaf5ee}@media(max-width:900px){.election-hero,.participant-strip{grid-template-columns:1fr}.stats{grid-template-columns:repeat(2,1fr)}.modules{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.election-dashboard{padding:12px}.election-hero{padding:19px;border-radius:17px}.stats,.modules{grid-template-columns:1fr}.hero-actions button{flex:1}.participant-strip{padding:18px}}`;
