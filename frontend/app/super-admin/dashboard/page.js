"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";

const GhanaMap = dynamic(() => import("../../../components/GhanaMap"), { ssr: false, loading: () => <div className="map-loading">Loading interactive Ghana map…</div> });
const API = (process.env.NEXT_PUBLIC_API_URL || "https://polisync-platform-1.onrender.com").replace(/\/+$/, "");

function token() {
  if (typeof window === "undefined") return "";
  return ["polisync_token", "authToken", "accessToken", "token"]
    .map((key) => localStorage.getItem(key) || sessionStorage.getItem(key))
    .find(Boolean) || "";
}

function storeSuperAdminSession(user, accessToken) {
  if (typeof window === "undefined") return;
  if (accessToken) {
    localStorage.setItem("polisync_token", accessToken);
    sessionStorage.setItem("polisync_token", accessToken);
  }
  if (user) {
    const value = JSON.stringify(user);
    localStorage.setItem("polisync_user", value);
    sessionStorage.setItem("polisync_user", value);
  }
}

async function get(path, accessToken) {
  const t = accessToken || token();
  if (!t) {
    const error = new Error("AUTH_RETRY");
    error.code = "AUTH_RETRY";
    throw error;
  }
  const response = await fetch(`${API}${path}`, {
    cache: "no-store",
    headers: { Accept: "application/json", Authorization: `Bearer ${t}` },
  });
  const body = await response.json().catch(() => ({}));
  if (response.status === 401 || response.status === 403) {
    const error = new Error("AUTH_RETRY");
    error.code = "AUTH_RETRY";
    throw error;
  }
  if (!response.ok) throw new Error(body.message || `Request failed (${response.status})`);
  return body;
}

async function verifySuperAdminSession() {
  const t = token();
  if (!t) return null;
  const response = await fetch(`${API}/api/profile/me`, {
    cache: "no-store",
    headers: { Accept: "application/json", Authorization: `Bearer ${t}` },
  });
  if (!response.ok) return null;
  const body = await response.json().catch(() => ({}));
  const user = body?.user;
  if (user?.platformRole !== "super_admin") return null;
  storeSuperAdminSession(user, t);
  return t;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [elections, setElections] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clock, setClock] = useState(new Date());
  const retryTimer = useRef(null);
  const loadingRef = useRef(false);

  const load = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      let accessToken = token();
      if (!accessToken) accessToken = await verifySuperAdminSession();
      if (!accessToken) throw Object.assign(new Error("AUTH_RETRY"), { code: "AUTH_RETRY" });

      const [u, o, e, g, a] = await Promise.all([
        get("/api/platform-users", accessToken),
        get("/api/organizations/admin/all", accessToken),
        get("/api/elections", accessToken),
        get("/api/electoral-geography/summary", accessToken),
        get("/api/audit-logs?limit=6", accessToken),
      ]);

      setStats({ users: u?.total, organizations: o?.totals?.organizations, elections: (e?.elections || []).length, pollingStations: g?.data?.pollingStations, constituencies: g?.data?.constituencies, regions: g?.data?.regions });
      setElections(e?.elections || []);
      setActivity(a?.logs || []);
      setError("");
    } catch (err) {
      if (err?.code === "AUTH_RETRY" || err?.message === "AUTH_RETRY") {
        setError("Restoring Super Admin session…");
        if (typeof window !== "undefined") {
          if (retryTimer.current) window.clearTimeout(retryTimer.current);
          retryTimer.current = window.setTimeout(() => { retryTimer.current = null; load(); }, 1500);
        }
      } else {
        setError(err?.message || "Unable to load command center data.");
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const clockTimer = setInterval(() => setClock(new Date()), 1000);
    const refreshTimer = setInterval(() => load(), 30000);
    return () => {
      clearInterval(clockTimer);
      clearInterval(refreshTimer);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, []);

  const cards = [["♟", "Total Users", stats?.users, "Platform accounts"], ["⌂", "Organizations", stats?.organizations, "Registered organizations"], ["▣", "Elections", stats?.elections, "Election register"], ["●", "Polling Stations", stats?.pollingStations, "Official geography"], ["◇", "Constituencies", stats?.constituencies, "Official geography"], ["◈", "Regions", stats?.regions, "Official geography"]];
  const fmt = (value) => Number.isFinite(Number(value)) ? Number(value).toLocaleString() : "—";

  return <DashboardShell role="super_admin" title="Super Admin Dashboard" subtitle="Platform overview and control center" activeSection="overview"><main className="sa">
    <section className="hero"><div><span>POLISYNC AFRICA · PLATFORM CONTROL</span><h1>Super Admin Command Center</h1><p>Live platform figures, electoral geography, elections and system activity. Figures refresh automatically from the database.</p></div><div className="time"><strong>{clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong><small>{clock.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</small></div></section>
    {error && <div className="error">{error}</div>}
    <section className="metrics">{cards.map(([icon, label, value, meta]) => <article key={label}><div className="icon">{icon}</div><div><span>{label}</span><strong>{loading ? "…" : fmt(value)}</strong><small>{meta}</small></div></article>)}</section>
    <section className="layout"><article className="panel map-panel"><div className="panel-head"><div><span>GHANA ELECTORAL GEOGRAPHY</span><h2>Interactive 16-Region Map</h2></div><a href="/super-admin/polling-stations">Open geography →</a></div><GhanaMap /></article>
      <article className="panel"><div className="panel-head"><div><span>ELECTION REGISTER</span><h2>Current Elections</h2></div><a href="/super-admin/elections">Manage →</a></div><div className="list">{elections.slice(0, 6).map(e => <div className="row" key={e._id || e.id || e.name}><div><strong>{e.name || "Unnamed election"}</strong><small>{e.startDateTime ? new Date(e.startDateTime).toLocaleString() : e.year || "Date not set"}</small></div><b>{e.status || "Recorded"}</b></div>)}{!elections.length && <p className="muted">No elections recorded.</p>}</div></article>
      <article className="panel"><div className="panel-head"><div><span>RECENT ACTIVITY</span><h2>Audit Activity</h2></div><a href="/super-admin/audit-logs">View all →</a></div><div className="list">{activity.map((x, i) => <div className="row" key={x._id || i}><div><strong>{x.action || "Platform action"}</strong><small>{x.resource || "Platform"}</small></div><time>{x.createdAt ? new Date(x.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</time></div>)}{!activity.length && <p className="muted">No audit activity.</p>}</div></article>
      <article className="panel"><div className="panel-head"><div><span>QUICK ACCESS</span><h2>Workspace</h2></div></div><div className="quick"><a href="/notes">📝 Notes<span>Shared notes for everyone</span></a><a href="/super-admin/users">♟ Users<span>Manage platform accounts</span></a><a href="/super-admin/organizations">⌂ Organizations<span>Manage organizations</span></a><a href="/super-admin/elections">▣ Elections<span>Create and manage elections</span></a><a href="/super-admin/polling-stations">● Polling Stations<span>Official station data</span></a><a href="/super-admin/settings">⚙ Settings<span>Platform controls</span></a></div></article>
    </section><div className="updated">● Live database figures · auto-refresh every 30 seconds · Last checked {clock.toLocaleTimeString()}</div>
  </main><style jsx>{css}</style></DashboardShell>;
}
const css=`.sa{min-height:100%;padding:22px;background:#f4f7f5;color:#142b20;box-sizing:border-box}.hero{display:flex;justify-content:space-between;gap:20px;align-items:center;padding:27px 30px;border-radius:20px;background:linear-gradient(115deg,#003d23,#08733d);color:#fff}.hero>div:first-child{min-width:0}.hero span,.panel-head span{font-size:9px;font-weight:900;letter-spacing:1.6px;color:#e0c65c}.hero h1{margin:9px 0 5px;font-size:32px}.hero p{margin:0;color:#dcece3;font-size:13px;line-height:1.5;max-width:750px}.time{text-align:right;min-width:130px}.time strong{display:block;font-size:28px}.time small{color:#dcece3}.error{margin-top:12px;padding:11px;border-radius:9px;background:#fff7df;color:#80630b;font-size:12px;font-weight:800}.metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin:16px 0}.metrics article,.panel{background:#fff;border:1px solid #dce7e1;border-radius:15px}.metrics article{padding:14px;display:flex;gap:10px;align-items:center;min-width:0}.metrics .icon{width:38px;height:38px;display:grid;place-items:center;border-radius:10px;background:#eaf5ee;color:#08713a;font-size:18px;flex:0 0 auto}.metrics article span,.metrics article small{display:block}.metrics article span{font-size:10px;font-weight:800;color:#66766e}.metrics article strong{display:block;font-size:24px;line-height:1.1;margin:3px 0}.metrics article small{font-size:9px;color:#88948e}.layout{display:grid;grid-template-columns:1.35fr 1fr;gap:14px}.panel{padding:17px;min-width:0}.map-panel{grid-row:span 2}.panel-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:13px}.panel-head h2{margin:4px 0 0;font-size:19px}.panel-head a{color:#08713a;font-size:11px;font-weight:900;white-space:nowrap}.map-panel :global(.ghana-map-card){max-width:none;border:0;box-shadow:none;padding:0}.map-panel :global(.map-heading){display:none}.map-loading{min-height:450px;display:grid;place-items:center;background:#edf3ef;border-radius:12px;color:#557060}.list{display:grid;gap:7px}.row{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px;border:1px solid #edf1ef;border-radius:9px}.row strong,.row small{display:block}.row strong{font-size:12px}.row small,.row time{font-size:10px;color:#78857e;margin-top:3px}.row b{font-size:9px;text-transform:uppercase;color:#08713a;background:#eaf5ee;border-radius:999px;padding:6px 8px}.muted{color:#7b8781;font-size:12px}.quick{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.quick a{display:block;padding:11px;border:1px solid #dce7e1;border-radius:10px;color:#17462f;font-size:12px;font-weight:900}.quick span{display:block;margin-top:4px;color:#78857e;font-size:9px;font-weight:600}.updated{margin-top:13px;text-align:right;color:#74817b;font-size:10px}@media(max-width:1200px){.metrics{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:850px){.layout{grid-template-columns:1fr}.map-panel{grid-row:auto}}@media(max-width:620px){.sa{padding:12px}.hero{display:block;padding:20px;border-radius:15px}.hero h1{font-size:27px}.time{text-align:left;margin-top:15px}.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.metrics article{padding:11px}.metrics article strong{font-size:20px}.quick{grid-template-columns:1fr}.panel{padding:13px}}`;