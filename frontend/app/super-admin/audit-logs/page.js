"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const getToken = () => typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || "";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/api/audit-logs`, { headers: { Accept: "application/json", Authorization: `Bearer ${getToken()}` } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to load audit logs.");
      setLogs(data.logs || []);
    } catch (e) { setError(e.message || "Unable to load audit logs."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return <DashboardShell role="super_admin" title="Audit Logs" subtitle="Traceable platform administration activity" activeSection="audit-logs"><main className="page"><header><div><span>PLATFORM OVERSIGHT</span><h2>Audit Logs</h2><p>Real administrative events recorded by the platform.</p></div><button type="button" onClick={load} disabled={loading}>{loading ? "Loading…" : "↻ Refresh"}</button></header>{error && <div className="error">{error}</div>}{loading ? <div className="state">Loading audit events…</div> : logs.length === 0 ? <div className="state">No audit events have been recorded.</div> : <section className="list">{logs.map((log) => <article className="card" key={log._id}><span>{new Date(log.createdAt).toLocaleString()}</span><h3>{log.action}</h3><p>{log.resource || "Platform"}{log.resourceId ? ` • ${log.resourceId}` : ""}</p><small>{log.actor ? [log.actor.firstName, log.actor.middleName, log.actor.lastName].filter(Boolean).join(" ") || log.actor.username : "System"}</small></article>)}</section>}</main><style jsx>{styles}</style></DashboardShell>;
}

const styles=`.page{min-height:100%;padding:clamp(14px,2.5vw,32px);background:#f5f8f6;color:#26332b}.page>header{display:flex;justify-content:space-between;gap:15px;align-items:flex-start}.page>header span{color:#c9a227;font-size:9px;font-weight:900;letter-spacing:1.4px}.page h2{margin:5px 0;color:#075f2b;font-size:30px}.page p{margin:0;color:#6f7c74;font-size:11px}.page button{border:0;border-radius:8px;background:#075f2b;color:#fff;padding:9px 11px;font-size:9px;font-weight:800}.list{display:grid;gap:9px;margin-top:14px}.card,.state,.error{padding:15px;border:1px solid #dce6df;border-radius:13px;background:#fff}.card>span{font-size:8px;color:#8b9690}.card h3{margin:5px 0;color:#26332b;font-size:13px}.card p{font-size:9px}.card small{display:block;margin-top:5px;color:#7d8881;font-size:8px}.state,.error{text-align:center;font-size:9px}.error{background:#fff5f5;border-color:#efd0d0;color:#a00000}@media(max-width:700px){.page>header{display:block}.page button{margin-top:10px}}`;
