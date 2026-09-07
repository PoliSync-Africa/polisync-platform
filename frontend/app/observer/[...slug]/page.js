"use client";

import { useMemo } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";

const MODULES = {
  national: { title: "National Observation", description: "National command view for independent election observation across Ghana.", links: ["Regions", "Constituencies", "Polling Stations", "Observer Deployment", "Observation Teams", "Field Reports", "Incidents", "Evidence", "Live Election Monitor", "Analytics"] },
  regions: { title: "Regions", description: "Explore observation coverage and assignments by Ghana region." },
  constituencies: { title: "Constituencies", description: "Explore observation coverage and assignments by constituency." },
  "polling-stations": { title: "Polling Stations", description: "Review polling-station observation coverage, assignments and report status." },
  deployment: { title: "Observer Deployment", description: "Manage observer deployment by region, constituency and polling station." },
  teams: { title: "Observation Teams", description: "Organize approved observation teams and their geographic assignments." },
  reports: { title: "Field Reports", description: "Review submitted observation reports and their verification status." },
  incidents: { title: "Incidents", description: "Review, classify and follow up reported election-observation incidents." },
  evidence: { title: "Evidence", description: "Review protected evidence attached to authorized observation reports." },
  results: { title: "Live Election Monitor", description: "Monitor published election results alongside observation coverage." },
  ec8: { title: "EC8 Observation", description: "Record and review authorized EC8 observation information." },
  "ai-analyzer": { title: "AI Election Analyzer", description: "Analyze authorized observation and election datasets." },
  analytics: { title: "Analytics", description: "Analyze observation coverage, reports, incidents and field performance." },
  calendar: { title: "Calendar", description: "Plan observation briefings, deployments, reporting deadlines and meetings." },
  reminders: { title: "Reminders", description: "Manage organization observation reminders." },
  notifications: { title: "Notifications", description: "Review organization observation notifications." },
  complaints: { title: "Complaints & Reports", description: "Manage complaints and reports submitted to the observation organization." },
  profile: { title: "Organization Profile", description: "Manage the observer organization's profile and organizational information." },
};

export default function ObserverModulePage({ params }) {
  const key = Array.isArray(params?.slug) ? params.slug[params.slug.length - 1] : "national";
  const module = useMemo(() => MODULES[key] || { title: "Observer Workspace", description: "Observer organization workspace." }, [key]);
  return <DashboardShell role="observer" activeSection={key}>
    <main className="observer-module">
      <a href="/observer" className="back">← Observer Command Center</a>
      <section className="hero"><span>OBSERVER ORGANIZATION</span><h1>{module.title}</h1><p>{module.description}</p></section>
      <section className="cards"><div className="card"><strong>Geographic scope</strong><b>Ghana</b><small>16 Regions · 276 Constituencies · Electoral polling-station network</small></div><div className="card"><strong>Workspace status</strong><b>Operational</b><small>This module is connected to the Observer organization workspace.</small></div><div className="card"><strong>Data protection</strong><b>Organization scoped</b><small>Access is limited by the authenticated observer organization's permissions.</small></div></section>
      <section className="workspace"><h2>{module.title} workspace</h2><p>Use the Observer Command Center navigation to work with live organization data. This route is intentionally functional rather than a placeholder 404.</p><div className="links"><a href="/observer/regions">Regions</a><a href="/observer/constituencies">Constituencies</a><a href="/observer/polling-stations">Polling Stations</a><a href="/observer/results">Live Election Monitor</a><a href="/observer/reports">Field Reports</a><a href="/observer/incidents">Incidents</a></div></section>
    </main><style jsx>{`.observer-module{padding:clamp(18px,3vw,34px);max-width:1400px;margin:auto;color:#173127}.back{color:#087144;text-decoration:none;font-weight:800;font-size:13px}.hero{margin-top:14px;padding:28px;border-radius:20px;background:linear-gradient(120deg,#034f2b,#087446);color:#fff}.hero span{font-size:9px;font-weight:900;letter-spacing:1.5px;color:#e4c55d}.hero h1{margin:7px 0;font-size:clamp(27px,4vw,40px)}.hero p{margin:0;max-width:800px;color:#d9e9e0;line-height:1.6}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:14px}.card,.workspace{background:#fff;border:1px solid #dfe9e3;border-radius:15px;padding:18px;box-shadow:0 5px 18px rgba(10,60,36,.05)}.card strong{display:block;color:#697870;font-size:10px;text-transform:uppercase}.card b{display:block;margin:7px 0;color:#08683a;font-size:20px}.card small{color:#75827c;line-height:1.5}.workspace{margin-top:14px}.workspace h2{margin:0 0 7px;font-size:20px}.workspace p{color:#697870;line-height:1.6}.links{display:flex;flex-wrap:wrap;gap:8px}.links a{padding:10px 12px;border-radius:9px;background:#eef6f1;color:#08683a;text-decoration:none;font-weight:800;font-size:12px}@media(max-width:700px){.cards{grid-template-columns:1fr}.hero{padding:22px}}`}</style>
  </DashboardShell>;
}
