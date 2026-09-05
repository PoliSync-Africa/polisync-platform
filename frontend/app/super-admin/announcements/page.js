"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const getToken = () => typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || "";

export default function AnnouncementsPage() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/api/announcements`, { headers: { Accept: "application/json", Authorization: `Bearer ${getToken()}` } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || `Unable to load announcements (${response.status}).`);
      setItems(data.announcements || []);
    } catch (e) { setError(e.message || "Unable to load announcements."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async (publishNow = false) => {
    setSaving(true); setError("");
    try {
      const response = await fetch(`${API_URL}/api/announcements`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ title, body, audience }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to create announcement.");
      if (publishNow) {
        const publishResponse = await fetch(`${API_URL}/api/announcements/${data.announcement._id}/publish`, { method: "PATCH", headers: { Accept: "application/json", Authorization: `Bearer ${getToken()}` } });
        const publishData = await publishResponse.json().catch(() => ({}));
        if (!publishResponse.ok || !publishData.success) throw new Error(publishData.message || "Announcement created but could not be published.");
      }
      setTitle(""); setBody(""); setAudience("all"); await load();
    } catch (e) { setError(e.message || "Unable to create announcement."); }
    finally { setSaving(false); }
  };

  const act = async (id, action) => {
    try {
      const response = await fetch(`${API_URL}/api/announcements/${id}/${action}`, { method: "PATCH", headers: { Accept: "application/json", Authorization: `Bearer ${getToken()}` } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to update announcement.");
      await load();
    } catch (e) { setError(e.message || "Unable to update announcement."); }
  };

  return <DashboardShell role="super_admin" title="Announcements" subtitle="Publish official platform communications" activeSection="announcements"><main className="page"><header><div><span>PLATFORM COMMUNICATIONS</span><h2>Announcements</h2><p>Create, publish and archive real platform announcements.</p></div><button type="button" onClick={load} disabled={loading}>{loading ? "Loading…" : "↻ Refresh"}</button></header><section className="composer"><h3>New announcement</h3><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title"/><textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write the official announcement…" rows={6}/><div className="compose-row"><select value={audience} onChange={(e) => setAudience(e.target.value)}><option value="all">Everyone</option><option value="personal">Personal accounts</option><option value="organizations">Organizations</option><option value="party">Political parties</option><option value="observer">Observers</option></select><div><button className="draft" onClick={() => create(false)} disabled={saving || !title.trim() || !body.trim()}>Save draft</button><button onClick={() => create(true)} disabled={saving || !title.trim() || !body.trim()}>Publish</button></div></div></section>{error && <div className="error">{error}</div>}<section className="list">{loading ? <div className="state">Loading announcements…</div> : items.length === 0 ? <div className="state">No announcements have been created.</div> : items.map((item) => <article className="card" key={item._id}><div><span className={`status ${item.status}`}>{item.status}</span><h3>{item.title}</h3><p>{item.body}</p><small>Audience: {item.audience} • {item.publishedAt ? new Date(item.publishedAt).toLocaleString() : `Created ${new Date(item.createdAt).toLocaleString()}`}</small></div><div className="actions">{item.status === "draft" && <button onClick={() => act(item._id, "publish")}>Publish</button>}{item.status !== "archived" && <button className="archive" onClick={() => act(item._id, "archive")}>Archive</button>}</div></article>)}</section></main><style jsx>{styles}</style></DashboardShell>;
}

const styles=`.page{min-height:100%;padding:clamp(14px,2.5vw,32px);background:#f5f8f6;box-sizing:border-box;color:#26332b}.page>header{display:flex;justify-content:space-between;align-items:flex-start;gap:15px}.page>header span{color:#c9a227;font-size:9px;font-weight:900;letter-spacing:1.4px}.page h2{margin:6px 0;color:#075f2b;font-size:30px}.page p{margin:0;color:#6f7c74;font-size:11px}.page>header button,.actions button,.compose-row button{border:0;border-radius:8px;background:#075f2b;color:#fff;padding:9px 11px;font-size:9px;font-weight:800}.composer{margin-top:15px;padding:16px;border:1px solid #dce6df;border-radius:14px;background:#fff}.composer h3{margin:0 0 10px;color:#075f2b;font-size:15px}.composer input,.composer textarea,.composer select{width:100%;box-sizing:border-box;border:1px solid #dce6df;border-radius:9px;background:#fff;padding:10px;margin-top:8px;font-size:10px;color:#26332b}.compose-row{display:flex;justify-content:space-between;gap:10px;align-items:center}.compose-row select{width:220px}.compose-row div{display:flex;gap:7px}.compose-row .draft{background:#fff;color:#075f2b;border:1px solid #075f2b}.error,.state{margin-top:12px;padding:13px;border-radius:10px;border:1px solid #dce6df;background:#fff;text-align:center;font-size:9px}.error{background:#fff5f5;color:#a00000;border-color:#efd0d0}.list{display:grid;gap:10px;margin-top:12px}.card{display:flex;justify-content:space-between;gap:15px;padding:15px;border:1px solid #dce6df;border-radius:13px;background:#fff}.card h3{margin:6px 0;color:#26332b;font-size:15px}.card p{margin:0;color:#546159;font-size:10px;white-space:pre-wrap}.card small{display:block;margin-top:8px;color:#8b9690;font-size:8px}.status{display:inline-block;padding:4px 7px;border-radius:999px;background:#eef3ef;color:#53635a;font-size:7px;font-weight:900}.status.published{background:#eaf6ee;color:#075f2b}.actions{display:flex;gap:6px;align-items:flex-start}.actions .archive{background:#6b7280}@media(max-width:700px){.page>header{display:block}.page>header button{margin-top:10px}.compose-row{display:block}.compose-row select{width:100%}.compose-row div{margin-top:8px}.card{display:block}.actions{margin-top:10px}}`;
