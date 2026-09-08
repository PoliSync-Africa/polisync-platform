"use client";

import { useEffect, useState } from "react";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const token = () => typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || localStorage.getItem("token") || sessionStorage.getItem("token") || localStorage.getItem("authToken") || sessionStorage.getItem("authToken") || localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || "";

async function request(path, options = {}) {
  const headers = { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...(token() ? { Authorization: `Bearer ${token()}` } : {}) };
  const res = await fetch(`${API}${path}`, { ...options, headers, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

export default function OrganizationElectionManager({ title = "Election Management", organizationType = "organization" }) {
  const [elections, setElections] = useState([]), [editing, setEditing] = useState(null), [error, setError] = useState(""), [saving, setSaving] = useState(false), [canCreate, setCanCreate] = useState(true), [accessLoading, setAccessLoading] = useState(true);
  const empty = { name: "", year: new Date().getFullYear(), type: "Presidential", country: "Ghana", status: "Draft", totalPollingStations: 0, parties: [], candidates: [] };
  const [form, setForm] = useState(empty);

  const load = async () => {
    try { setError(""); const [d, access] = await Promise.all([request("/api/elections"), request("/api/elections/access")]); setElections(d.elections || []); setCanCreate(Boolean(access.isSuperAdmin || access.allowOrganizationElectionCreation)); }
    catch (e) { setError(e.message); }
    finally { setAccessLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const edit = e => { setEditing(e._id); setForm({ name:e.name||"", year:e.year||new Date().getFullYear(), type:e.type||"Presidential", country:e.country||"Ghana", status:e.status||"Draft", totalPollingStations:e.totalPollingStations||0, parties:e.parties||[], candidates:e.candidates||[] }); window.scrollTo({top:0,behavior:"smooth"}); };
  const save = async e => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      if (!editing && !canCreate) throw new Error("The Super Admin has disabled election creation for organizations.");
      if (editing) await request(`/api/elections/${editing}`, { method:"PATCH", body:JSON.stringify(form) }); else await request("/api/elections/create", { method:"POST", body:JSON.stringify(form) });
      setForm(empty); setEditing(null); await load();
    } catch (x) { setError(x.message); } finally { setSaving(false); }
  };
  const remove = async id => { if (!window.confirm("Delete this election?")) return; try { await request(`/api/elections/${id}`, {method:"DELETE"}); await load(); } catch(e) { setError(e.message); } };

  return <section style={{display:"grid",gap:16}}>
    <header><span style={{fontSize:10,fontWeight:900,letterSpacing:1.4,color:"#b38b17"}}>ORGANIZATION ELECTIONS</span><h1 style={{margin:"5px 0",color:"#075f2b",fontSize:26}}>{title}</h1><p style={{margin:0,color:"#68766e",fontSize:12}}>Create, edit and manage elections owned by your organization. Live and closed elections remain available for results and history.</p></header>
    {!accessLoading && !canCreate && !editing && <div style={{padding:12,border:"1px solid #ead8a8",borderRadius:11,background:"#fffaf0",color:"#755b18",fontSize:11,fontWeight:700}}>Election creation for organizations is currently disabled by the Super Admin. Existing organization elections remain available for management.</div>}
    {error && <div style={{padding:11,borderRadius:10,border:"1px solid #efc7c7",background:"#fff6f6",color:"#9b1717",fontSize:11}}>{error}</div>}
    <form onSubmit={save} style={{display:"grid",gap:12,padding:16,border:"1px solid #dfe8e2",borderRadius:14,background:"#fff"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:10}}>
        <Field label="Election name"><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ghana General Election" /></Field>
        <Field label="Year"><input type="number" min="1900" max="2200" value={form.year} onChange={e=>setForm({...form,year:Number(e.target.value)})} /></Field>
        <Field label="Election type"><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option>Presidential</option><option>Parliamentary</option><option>Local</option></select></Field>
        <Field label="Country"><input value={form.country} onChange={e=>setForm({...form,country:e.target.value})} /></Field>
        <Field label="Status"><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Draft</option><option>Active</option><option>Closed</option></select></Field>
        <Field label="Total polling stations"><input type="number" min="0" value={form.totalPollingStations} onChange={e=>setForm({...form,totalPollingStations:Number(e.target.value)})} /></Field>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button disabled={saving || (!editing && !canCreate)} type="submit" style={{...button,opacity:(!editing&&!canCreate)?0.55:1,cursor:(!editing&&!canCreate)?"not-allowed":"pointer"}}>{saving?"Saving…":editing?"Save Election Changes":canCreate?"Create Election":"Election Creation Disabled"}</button>{editing&&<button type="button" onClick={()=>{setEditing(null);setForm(empty)}} style={secondary}>Cancel</button>}</div>
    </form>
    <div style={{display:"grid",gap:9}}>{elections.map(e=><article key={e._id} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10,padding:14,border:"1px solid #dfe8e2",borderRadius:12,background:"#fff"}}><div><strong style={{color:"#173d28"}}>{e.name}</strong><div style={{fontSize:10,color:"#738078",marginTop:4}}>{e.country} • {e.year} • {e.type} • {e.status}</div><div style={{fontSize:10,color:"#53625a",marginTop:5}}>{e.managedBy === "organization" ? "Organization-managed" : "Platform-managed"}{e.organizationId?.name ? ` • ${e.organizationId.name}` : ""}</div></div><div style={{display:"flex",gap:6,alignItems:"center"}}><button onClick={()=>edit(e)} style={secondary}>Edit</button>{e.status !== "Active" && <button onClick={()=>remove(e._id)} style={danger}>Delete</button>}</div></article>)}{!elections.length&&<div style={{padding:18,textAlign:"center",color:"#748078",border:"1px dashed #cfdad2",borderRadius:12}}>No elections yet. Create your first organization election above.</div>}</div>
    <style jsx>{`input,select{width:100%;min-height:40px;border:1px solid #d5e0d8;border-radius:9px;padding:0 10px;color:#173d28;background:#fff;font-size:11px;box-sizing:border-box}button{font:inherit;cursor:pointer;border-radius:9px;padding:9px 12px;font-size:10px;font-weight:800}@media(max-width:720px){form>div:first-child{grid-template-columns:1fr!important}}`}</style>
  </section>;
}
function Field({label,children}){return <label style={{display:"grid",gap:5,fontSize:9,fontWeight:800,color:"#627067"}}>{label}{children}</label>}
const button={background:"#075f2b",color:"#fff",border:"1px solid #075f2b"}; const secondary={background:"#fff",color:"#075f2b",border:"1px solid #b9cbbf"}; const danger={background:"#fff5f5",color:"#a31313",border:"1px solid #edcaca"};
