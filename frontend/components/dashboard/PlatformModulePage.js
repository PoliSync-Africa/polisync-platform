"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardShell from "./DashboardShell";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const getToken = () => typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || "";

const MODULE_ENDPOINTS = {
  security: "/api/health",
  notifications: "/api/notifications",
  announcements: "/api/announcements",
};

export default function PlatformModulePage({ title, subtitle, activeSection, description, endpoint }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(endpoint || MODULE_ENDPOINTS[activeSection]));
  const [error, setError] = useState("");

  const resolvedEndpoint = endpoint || MODULE_ENDPOINTS[activeSection] || "";

  const load = useCallback(async () => {
    if (!resolvedEndpoint) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}${resolvedEndpoint}`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${getToken()}` },
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success === false) throw new Error(payload.message || `Unable to load ${title}.`);
      setData(payload);
    } catch (e) {
      setError(e.message || `Unable to load ${title}.`);
    } finally {
      setLoading(false);
    }
  }, [resolvedEndpoint, title]);

  useEffect(() => { load(); }, [load]);

  const renderModule = () => {
    if (!resolvedEndpoint) return <div className="empty">This workspace has no live data source registered yet.</div>;
    if (loading) return <div className="empty">Loading live data…</div>;
    if (error) return <div className="error">{error}</div>;

    if (activeSection === "security") {
      return <section className="grid"><Item label="Platform" value={data?.platform || "POLISYNC AFRICA"}/><Item label="Status" value={data?.status || "Unknown"}/><Item label="Version" value={data?.version || "—"}/><Item label="Uptime" value={typeof data?.uptime === "number" ? `${Math.floor(data.uptime / 60)} min` : "—"}/><Item label="Checked" value={data?.timestamp ? new Date(data.timestamp).toLocaleString() : "—"}/></section>;
    }

    if (activeSection === "announcements") {
      const items = Array.isArray(data?.announcements) ? data.announcements : [];
      return items.length ? <section className="list">{items.map((item) => <article className="item-card" key={item._id}><span className="status">{item.status}</span><h3>{item.title}</h3><p>{item.body}</p><small>{item.publishedAt ? new Date(item.publishedAt).toLocaleString() : new Date(item.createdAt).toLocaleString()}</small></article>)}</section> : <div className="empty">No announcements are available.</div>;
    }

    if (activeSection === "notifications") {
      const items = Array.isArray(data?.notifications) ? data.notifications : Array.isArray(data?.items) ? data.items : [];
      return items.length ? <section className="list">{items.map((item) => <article className="item-card" key={item._id || item.id}><span className="status">{item.read ? "Read" : "Unread"}</span><h3>{item.title || item.type || "Notification"}</h3><p>{item.message || item.body || ""}</p><small>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</small></article>)}</section> : <div className="empty">No notifications are available.</div>;
    }

    return <div className="empty">No records are available yet.</div>;
  };

  return <DashboardShell role="super_admin" title={title} subtitle={subtitle} activeSection={activeSection}><main className="page"><header><div><span>POLISYNC AFRICA • SUPER ADMIN</span><h2>{title}</h2><p>{description || subtitle}</p></div><button type="button" onClick={load} disabled={loading}>{loading ? "Loading…" : "↻ Refresh"}</button></header><section className="workspace">{renderModule()}</section></main><style jsx>{styles}</style></DashboardShell>;
}

function Item({ label, value }) { return <div className="stat"><span>{label}</span><strong>{String(value)}</strong></div>; }

const styles=`.page{min-height:100%;padding:clamp(14px,2.5vw,32px);background:#f5f8f6;color:#26332b;box-sizing:border-box}.page>header{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.page>header span{color:#c9a227;font-size:9px;font-weight:900;letter-spacing:1.4px}.page h2{margin:6px 0;color:#075f2b;font-size:30px}.page p{margin:0;color:#6f7c74;font-size:11px}.page>header button{border:0;border-radius:9px;background:#075f2b;color:#fff;padding:10px 13px;font-size:10px;font-weight:800}.workspace{margin-top:16px}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.stat{padding:16px;border:1px solid #d4af37;border-radius:13px;background:#fff;box-shadow:0 8px 24px rgba(3,43,22,.05)}.stat span{display:block;color:#7b8780;font-size:9px}.stat strong{display:block;margin-top:5px;color:#075f2b;font-size:20px}.list{display:grid;gap:10px}.item-card{padding:17px;border:1px solid #d4af37;border-radius:14px;background:#fff;box-shadow:0 8px 24px rgba(3,43,22,.05)}.item-card h3{margin:6px 0;color:#075f2b;font-size:16px}.item-card p{white-space:pre-wrap;color:#4f5d55;font-size:11px}.item-card small{display:block;margin-top:8px;color:#87928b;font-size:8px}.status{display:inline-block;padding:5px 8px;border-radius:999px;background:#eaf6ee;color:#075f2b;font-size:8px;font-weight:900}.empty,.error{padding:20px;border:1px solid #d4af37;border-radius:13px;background:#fff;text-align:center;color:#66736b;font-size:10px}.error{background:#fff5f5;border-color:#edcaca;color:#a00000}@media(max-width:800px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.page>header{display:block}.page>header button{margin-top:10px}}@media(max-width:520px){.grid{grid-template-columns:1fr}}`;
