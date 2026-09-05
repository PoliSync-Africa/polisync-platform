"use client";

import { useEffect, useState } from "react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const getToken = () => typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || "";

export default function ConnectedModule({ title, description, endpoint, renderData }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(endpoint));
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!endpoint) return;
      setLoading(true); setError("");
      try {
        const response = await fetch(`${API_URL}${endpoint}`, { headers: { Accept: "application/json", Authorization: `Bearer ${getToken()}` } });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload.success === false) throw new Error(payload.message || `Unable to load ${title}.`);
        if (!cancelled) setData(payload);
      } catch (e) { if (!cancelled) setError(e.message || `Unable to load ${title}.`); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [endpoint, title]);

  return <section className="module-card"><header><div><span>POLISYNC AFRICA</span><h2>{title}</h2><p>{description}</p></div>{endpoint && <button type="button" onClick={() => window.location.reload()}>Refresh</button>}</header>{loading ? <div className="state">Loading live data…</div> : error ? <div className="error">{error}</div> : renderData ? renderData(data || {}) : <div className="state">No records available yet.</div>}<style jsx>{`.module-card{width:min(100%,1180px);margin:0 auto;padding:22px;border:1px solid #d4af37;border-radius:18px;background:#fff;box-shadow:0 12px 34px rgba(3,43,22,.08)}header{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}header span{font-size:9px;font-weight:900;letter-spacing:1.4px;color:#d4af37}h2{margin:5px 0;color:#075f2b;font-size:28px}p{margin:0;color:#64736a;font-size:12px}button{border:0;border-radius:9px;background:#075f2b;color:#fff;padding:9px 12px;font-weight:800;font-size:10px}.state,.error{margin-top:16px;padding:15px;border-radius:12px;background:#f5f8f6;border:1px solid #dce7e0;color:#536159;font-size:11px}.error{background:#fff5f5;border-color:#efcccc;color:#a00000}`}</style></section>;
}
