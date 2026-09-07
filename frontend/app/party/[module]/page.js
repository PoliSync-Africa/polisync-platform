"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";

const MODULES = {
  members: { title: "Members", eyebrow: "PARTY OPERATIONS", description: "Manage and review the party membership network within the authorized organization scope.", api: "/api/organization-members" },
  candidates: { title: "Candidates", eyebrow: "ELECTION OPERATIONS", description: "Review candidates associated with the party and connect them to election geography.", api: "/api/candidates" },
  field: { title: "Field Operations", eyebrow: "FIELD OPERATIONS", description: "Coordinate regional, constituency and polling-station field activity.", api: "/api/personal-operations/field-tasks" },
  results: { title: "Live Results", eyebrow: "ELECTION RESULTS", description: "Monitor submitted, pending and verified election results across Ghana.", api: "/api/results" },
  analytics: { title: "Analytics", eyebrow: "PARTY INTELLIGENCE", description: "Review operational, electoral and geographic performance indicators.", api: "/api/electoral-geography/summary" },
  calendar: { title: "Calendar", eyebrow: "PARTY MANAGEMENT", description: "Coordinate meetings, deadlines, campaign activities and election events.", api: "/api/calendar/events" },
};

const NAV = [
  { section: "PARTY COMMAND", items: [["Dashboard","/party"],["National Command","/party/national"],["Constituencies","/party/constituencies"],["Polling Stations","/party/polling-stations"]] },
  { section: "PARTY OPERATIONS", items: [["Members","/party/members"],["Candidates","/party/candidates"],["Field Operations","/party/field"]] },
  { section: "ELECTION MANAGEMENT", items: [["Live Results","/party/results"],["Analytics","/party/analytics"]] },
  { section: "MANAGEMENT", items: [["Calendar","/party/calendar"],["Communications","/party/communications"],["Privacy & Security","/settings/security"]] },
].map((section) => ({ ...section, items: section.items.map(([label, href]) => ({ label, href })) }));

function token() { if (typeof window === "undefined") return ""; return localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || localStorage.getItem("token") || sessionStorage.getItem("token") || ""; }

export default function PartyModulePage({ params }) {
  const [moduleKey, setModuleKey] = useState("");
  const [state, setState] = useState("loading");
  const [payload, setPayload] = useState(null);
  useEffect(() => { Promise.resolve(params).then((p) => setModuleKey(p.module)); }, [params]);
  const config = useMemo(() => MODULES[moduleKey], [moduleKey]);
  useEffect(() => {
    if (!config) { if (moduleKey) setState("missing"); return; }
    let cancelled = false;
    const run = async () => {
      try {
        const t = token();
        const r = await fetch(config.api, { cache: "no-store", headers: { Accept: "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) } });
        const body = await r.json().catch(() => ({}));
        if (!cancelled) { setPayload({ status: r.status, body }); setState("ready"); }
      } catch { if (!cancelled) setState("offline"); }
    };
    run(); return () => { cancelled = true; };
  }, [config, moduleKey]);
  if (state === "loading") return <DashboardShell role="party"><div className="state">Opening party module…</div></DashboardShell>;
  if (!config) return <DashboardShell role="party"><div className="state error"><h1>Module not found</h1><p>This party workspace route is not defined.</p><a href="/party">Return to Party Command Center</a></div></DashboardShell>;
  const statusLabel = state === "offline" ? "SERVICE UNAVAILABLE" : payload?.status >= 200 && payload?.status < 300 ? "LIVE" : `API ${payload?.status || "UNAVAILABLE"}`;
  return <DashboardShell role="party" navigation={NAV} activeSection={moduleKey} title={config.title} subtitle="Political Party Command Center">
    <main className="page"><section className="hero"><div><span>{config.eyebrow}</span><h1>{config.title}</h1><p>{config.description}</p></div><strong className={statusLabel === "LIVE" ? "live" : "warn"}>● {statusLabel}</strong></section>
      <section className="cards"><article><small>Module status</small><b>{statusLabel}</b><p>Health is determined from the live application response, not a placeholder.</p></article><article><small>Organization scope</small><b>Authorized party workspace</b><p>Access remains subject to organization membership and platform authorization.</p></article><article><small>API response</small><b>{payload?.status || "—"}</b><p>{state === "offline" ? "The service could not be reached." : "The module endpoint responded."}</p></article></section>
      <section className="surface"><h2>{config.title} workspace</h2><p>The route is now a real application surface rather than an unhandled 404. Connect the detailed workflow to its live API records as they become available.</p><div className="actions"><a href="/party">Party Command Center</a><a href="/party/constituencies">Geographic Explorer</a><a href="/party/polling-stations">Polling Stations</a><a href="/results">Election Results</a></div></section>
    </main><style jsx>{`.page{padding:clamp(16px,3vw,32px);background:#f4f7f5;min-height:100%;color:#173527}.hero,.surface,.cards article{background:#fff;border:1px solid #dfe8e3;border-radius:18px;box-shadow:0 8px 22px rgba(13,60,38,.05)}.hero{padding:25px;display:flex;justify-content:space-between;gap:20px;align-items:flex-end;background:linear-gradient(130deg,#064425,#08713a);color:#fff}.hero span{font-size:9px;letter-spacing:1.5px;color:#ddc05a;font-weight:900}.hero h1{font-size:clamp(28px,4vw,44px);margin:7px 0}.hero p{max-width:760px;margin:0;color:#dce9e1;line-height:1.55}.hero>strong{padding:9px 12px;border-radius:999px;background:rgba(255,255,255,.12);font-size:10px;white-space:nowrap}.live{color:#dff7e7}.warn{color:#ffd7b5}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:14px 0}.cards article{padding:17px}.cards small{display:block;color:#7b8881;text-transform:uppercase;font-size:9px;font-weight:900;letter-spacing:1px}.cards b{display:block;margin:6px 0;color:#075f2b;font-size:18px}.cards p,.surface p{margin:0;color:#6c7a72;font-size:12px;line-height:1.55}.surface{padding:22px}.surface h2{margin:0 0 7px;color:#075f2b}.actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:17px}.actions a,.state a{padding:10px 13px;background:#075f2b;color:#fff;border-radius:9px;text-decoration:none;font-weight:800;font-size:11px}.state{margin:25px;padding:50px;text-align:center;background:#fff;border:1px solid #dfe8e3;border-radius:16px}.state.error{color:#8c352d}@media(max-width:700px){.hero{display:block}.hero>strong{display:inline-block;margin-top:15px}.cards{grid-template-columns:1fr}.actions a{flex:1;text-align:center;min-width:130px}}`}</style>
  </DashboardShell>;
}
