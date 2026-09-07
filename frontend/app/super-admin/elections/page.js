"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import superAdminNavigation from "../../../components/dashboard/superAdminNavigation";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const getToken = () => typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || localStorage.getItem("token") || sessionStorage.getItem("token") || localStorage.getItem("authToken") || sessionStorage.getItem("authToken") || localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || "";
const EMPTY = { name: "", year: new Date().getFullYear(), type: "Presidential", country: "Ghana", status: "Draft", totalPollingStations: 0 };

export default function ElectionsPage() {
  const [elections, setElections] = useState([]);
  const [view, setView] = useState("all");
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const token = getToken();
      const r = await fetch(`${API_URL}/api/elections`, { cache: "no-store", headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      const p = await r.json().catch(() => ({}));
      if (!r.ok || !p.success) throw new Error(p.message || "Unable to load elections.");
      setElections(Array.isArray(p.elections) ? p.elections : []);
    } catch (e) { setError(e.message || "Unable to load elections."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => view === "live" ? elections.filter(e => e.status === "Active") : view === "history" ? elections.filter(e => e.status === "Closed") : elections, [elections, view]);
  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const token = getToken();
      const url = editing ? `${API_URL}/api/elections/${editing._id}` : `${API_URL}/api/elections/create`;
      const r = await fetch(url, { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...form, year: Number(form.year), totalPollingStations: Number(form.totalPollingStations) }) });
      const p = await r.json().catch(() => ({}));
      if (!r.ok || !p.success) throw new Error(p.message || "Unable to save election.");
      setNotice(editing ? "Election updated successfully." : "Election created successfully.");
      setEditing(null); setForm(EMPTY); await load();
    } catch (e) { setError(e.message || "Unable to save election."); }
    finally { setSaving(false); }
  };

  const edit = (election) => { setEditing(election); setForm({ name: election.name || "", year: election.year || new Date().getFullYear(), type: election.type || "Presidential", country: election.country || "Ghana", status: election.status || "Draft", totalPollingStations: election.totalPollingStations || 0 }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const remove = async (election) => {
    if (!window.confirm(`Delete “${election.name}”? This cannot be undone.`)) return;
    setError(""); setNotice("");
    try {
      const token = getToken();
      const r = await fetch(`${API_URL}/api/elections/${election._id}`, { method: "DELETE", headers: { Accept: "application/json", Authorization: `Bearer ${token}` } });
      const p = await r.json().catch(() => ({}));
      if (!r.ok || !p.success) throw new Error(p.message || "Unable to delete election.");
      setNotice("Election deleted successfully."); await load();
    } catch (e) { setError(e.message || "Unable to delete election."); }
  };

  return <DashboardShell role="super_admin" navigation={superAdminNavigation} activeSection="elections" title="Election Management" subtitle="Create, configure and control election lifecycles">
    <main className="page">
      <header className="hero"><div><span>POLISYNC AFRICA • SUPER ADMIN</span><h1>Election Management</h1><p>Create elections, edit configurations, open live elections and preserve closed elections as history.</p></div><button className="refresh" onClick={load} disabled={loading}>↻ Refresh</button></header>
      {notice && <div className="notice success">✓ {notice}</div>}{error && <div className="notice error">{error}</div>}
      <section className="composer"><div className="section-title"><div><h2>{editing ? "Edit Election" : "Create Election"}</h2><p>Super Admin controls the official election lifecycle.</p></div>{editing && <button className="cancel" onClick={() => { setEditing(null); setForm(EMPTY); }}>Cancel</button>}</div>
        <form onSubmit={save} className="form-grid"><label>Election name<input required value={form.name} onChange={e => setField("name", e.target.value)} placeholder="Ghana General Election" /></label><label>Year<input required type="number" min="1900" max="2200" value={form.year} onChange={e => setField("year", e.target.value)} /></label><label>Election type<select value={form.type} onChange={e => setField("type", e.target.value)}><option>Presidential</option><option>Parliamentary</option><option>Local</option></select></label><label>Country<input value={form.country} onChange={e => setField("country", e.target.value)} /></label><label>Status<select value={form.status} onChange={e => setField("status", e.target.value)}><option>Draft</option><option>Active</option><option>Closed</option></select></label><label>Total polling stations<input type="number" min="0" value={form.totalPollingStations} onChange={e => setField("totalPollingStations", e.target.value)} /></label><div className="form-actions"><button className="primary" disabled={saving}>{saving ? "Saving…" : editing ? "Save Election Changes" : "Create Election"}</button></div></form>
      </section>
      <section className="toolbar"><div className="tabs"><button className={view === "all" ? "active" : ""} onClick={() => setView("all")}>All Elections <b>{elections.length}</b></button><button className={view === "live" ? "active" : ""} onClick={() => setView("live")}>Live Elections <b>{elections.filter(e => e.status === "Active").length}</b></button><button className={view === "history" ? "active" : ""} onClick={() => setView("history")}>History <b>{elections.filter(e => e.status === "Closed").length}</b></button></div></section>
      <section className="list">{loading ? <div className="empty">Loading elections…</div> : visible.length === 0 ? <div className="empty">No elections in this view yet.</div> : visible.map(e => <article className="election" key={e._id}><div className="identity"><span className={`badge ${String(e.status).toLowerCase()}`}>{e.status}</span><h3>{e.name}</h3><p>{e.country} • {e.type} • {e.year}</p></div><div className="metrics"><div><small>Polling stations</small><strong>{Number(e.totalPollingStations || 0).toLocaleString()}</strong></div><div><small>Created</small><strong>{e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "—"}</strong></div></div><div className="actions"><button onClick={() => edit(e)}>Edit</button>{e.status !== "Active" && <button className="delete" onClick={() => remove(e)}>Delete</button>}</div></article>)}</section>
    </main>
    <style jsx>{styles}</style>
  </DashboardShell>;
}

const styles = `.page{min-height:100%;padding:clamp(16px,3vw,38px);background:#f5f8f6;color:#183d2e}.hero{max-width:1180px;margin:0 auto 20px;display:flex;justify-content:space-between;gap:20px;align-items:flex-end}.hero span{font-size:10px;font-weight:900;letter-spacing:2px;color:#c39a20}.hero h1{margin:7px 0;color:#075d2e;font-size:clamp(30px,5vw,50px)}.hero p{margin:0;color:#718078}.refresh,.primary{border:0;border-radius:11px;background:#075d2e;color:white;padding:12px 16px;font-weight:800}.composer,.election,.toolbar,.notice,.empty{max-width:1180px;margin-left:auto;margin-right:auto}.composer{background:white;border:1px solid #dce6e0;border-radius:18px;padding:22px;box-shadow:0 8px 22px #0c533311}.section-title{display:flex;justify-content:space-between;gap:15px;align-items:center}.section-title h2{margin:0;color:#075d2e}.section-title p{margin:4px 0 0;color:#7a8781;font-size:13px}.cancel{border:1px solid #ccd8d1;background:white;border-radius:10px;padding:9px 13px}.form-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:20px}.form-grid label{font-size:12px;font-weight:800;color:#42564d}.form-grid input,.form-grid select{width:100%;box-sizing:border-box;margin-top:6px;padding:12px;border:1px solid #d5e0da;border-radius:10px;background:#fbfcfb;font-size:14px}.form-actions{display:flex;align-items:end}.toolbar{margin-top:20px}.tabs{display:flex;gap:7px;overflow:auto}.tabs button{white-space:nowrap;border:1px solid #d6e0da;background:white;color:#496055;border-radius:10px;padding:10px 13px;font-weight:800}.tabs button.active{background:#075d2e;color:white;border-color:#075d2e}.tabs b{margin-left:5px}.list{display:grid;gap:11px;margin-top:12px}.election{background:white;border:1px solid #dce6e0;border-radius:15px;padding:17px;display:grid;grid-template-columns:1.5fr 1fr auto;gap:18px;align-items:center}.badge{display:inline-block;border-radius:99px;padding:5px 9px;font-size:10px;font-weight:900;background:#eaf1ed}.badge.active{background:#e6f7ed;color:#08703a}.badge.closed{background:#eef0f1;color:#56625d}.badge.draft{background:#fff5d9;color:#896b08}.identity h3{margin:7px 0 4px;color:#075d2e}.identity p{margin:0;color:#77837d;font-size:12px}.metrics{display:flex;gap:20px}.metrics small{display:block;color:#849088;font-size:9px}.metrics strong{display:block;color:#294b3c;margin-top:4px;font-size:14px}.actions{display:flex;gap:7px}.actions button{border:1px solid #d2ddd6;background:white;border-radius:9px;padding:9px 11px;color:#075d2e;font-weight:800}.actions .delete{color:#a33b2d}.notice{padding:12px 15px;border-radius:11px;margin-bottom:12px;font-size:13px;font-weight:700}.success{background:#e9f7ee;color:#08703a}.error{background:#fff0ee;color:#a33b2d}.empty{padding:28px;background:white;border:1px solid #dce6e0;border-radius:15px;text-align:center;color:#77837d;margin-top:12px}@media(max-width:800px){.hero{display:block}.refresh{width:100%;margin-top:14px}.form-grid{grid-template-columns:1fr}.election{grid-template-columns:1fr}.metrics{flex-wrap:wrap}.actions button{flex:1}}`;
