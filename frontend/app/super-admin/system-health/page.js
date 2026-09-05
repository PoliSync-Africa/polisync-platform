"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const getToken = () => typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || "";

export default function SystemHealthPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/api/health`, { headers: { Accept: "application/json", Authorization: `Bearer ${getToken()}` } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.status) throw new Error(data.message || `Health endpoint returned ${response.status}.`);
      setHealth(data);
    } catch (e) { setError(e.message || "Unable to reach the backend health service."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return <DashboardShell role="super_admin" title="System Health" subtitle="Live backend service health and availability" activeSection="system-health"><main className="page"><header><div><span>SYSTEM MONITORING</span><h2>System Health</h2><p>This page reports the live PoliSync backend health endpoint.</p></div><button onClick={load} disabled={loading}>{loading ? "Checking…" : "↻ Check now"}</button></header>{error && <div className="error">{error}</div>}{loading ? <div className="state">Checking backend health…</div> : health && <><section className="hero"><div className="status-dot">✓</div><div><strong>{String(health.status).toUpperCase()}</strong><span>{health.platform}</span></div></section><section className="grid"><Item label="API" value="Online"/><Item label="Platform" value={health.platform}/><Item label="Version" value={health.version}/><Item label="Uptime" value={`${Math.round(Number(health.uptime || 0) / 60)} min`}/><Item label="Checked at" value={new Date(health.timestamp).toLocaleString()}/></section></>}</main><style jsx>{styles}</style></DashboardShell>;
}
function Item({label,value}){return <div className="item"><span>{label}</span><strong>{value}</strong></div>}
const styles=`.page{min-height:100%;padding:clamp(14px,2.5vw,32px);background:#f5f8f6;box-sizing:border-box;color:#26332b}.page>header{display:flex;justify-content:space-between;gap:15px;align-items:flex-start}.page>header span{color:#c9a227;font-size:9px;font-weight:900;letter-spacing:1.4px}.page h2{margin:6px 0;color:#075f2b;font-size:30px}.page p{margin:0;color:#6f7c74;font-size:12px}.page button{border:0;border-radius:9px;background:#075f2b;color:#fff;padding:10px 13px;font-size:10px;font-weight:800}.hero{display:flex;align-items:center;gap:12px;margin-top:18px;padding:18px;border:1px solid #dce6df;border-radius:15px;background:#fff}.status-dot{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:#eaf6ee;color:#075f2b;font-size:20px}.hero strong,.hero span{display:block}.hero strong{color:#075f2b;font-size:15px}.hero span{margin-top:3px;color:#7b8780;font-size:10px}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:12px}.item{padding:15px;border:1px solid #dce6df;border-radius:12px;background:#fff}.item span{display:block;color:#7b8780;font-size:9px}.item strong{display:block;margin-top:6px;color:#26332b;font-size:12px;overflow-wrap:anywhere}.error,.state{margin-top:15px;padding:14px;border-radius:11px;border:1px solid #dce6df;background:#fff;text-align:center;font-size:10px}.error{background:#fff5f5;border-color:#efd0d0;color:#a00000}@media(max-width:800px){.grid{grid-template-columns:repeat(2,1fr)}.page>header{display:block}.page button{margin-top:10px}}@media(max-width:520px){.grid{grid-template-columns:1fr}}`;
