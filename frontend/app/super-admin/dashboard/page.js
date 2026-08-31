"use client";

import { useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import WeatherCard from "../../../components/dashboard/WeatherCard";
import RemindersPanel from "../../../components/dashboard/RemindersPanel";
import AIPersonalAssistant from "../../../components/dashboard/AIPersonalAssistant";
import AIAnalyzer from "../../../components/dashboard/AIAnalyzer";
import NotificationsPanel from "../../../components/dashboard/NotificationsPanel";
import ComplaintsReportsPanel from "../../../components/dashboard/ComplaintsReportsPanel";
import PrivacySecurityPanel from "../../../components/dashboard/PrivacySecurityPanel";

const STATS = [
  ["Users", "0", "👥"], ["Organizations", "0", "🏢"], ["Candidates", "0", "👤"],
  ["Elections", "0", "🗳️"], ["Polling Stations", "0", "📍"], ["Results Submitted", "0", "📊"],
];
const REGIONS = ["Ahafo", "Ashanti", "Bono", "Bono East", "Central", "Eastern", "Greater Accra", "Northern"];
const APPROVALS = [["Users", "0", "👥"], ["Organizations", "0", "🏢"], ["Polling Stations", "0", "📍"], ["Candidates", "0", "👤"]];
const QUICK_ACTIONS = [["📢", "Announcement"], ["👥", "Manage Users"], ["🏢", "Organizations"], ["📊", "Generate Report"], ["🛡️", "Security Center"], ["⚙️", "System Settings"]];
const NAV = [["ai", "✨", "AI Analyzer"], ["assistant", "🤖", "Assistant"], ["approvals", "✓", "Approvals"], ["results", "📊", "Results"], ["weather", "☁️", "Weather"], ["activity", "🔔", "Activity"], ["oversight", "🛡️", "Complaints"], ["privacy", "🔐", "Privacy"], ["health", "⚙️", "System Health"]];

export default function SuperAdminDashboard() {
  const [activeSection, setActiveSection] = useState("overview");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const jumpTo = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <DashboardShell role="super_admin" title="Super Admin Dashboard" subtitle="Platform overview and control center" activeSection={activeSection} onSectionChange={setActiveSection} mobileMenuOpen={showMobileMenu} onMobileMenuClose={() => setShowMobileMenu(false)}>
      <div className="super-admin-redesign">
        <main className="dashboard-content">
          <section className="hero"><div><div className="brand-kicker">POLISYNC AFRICA</div><h2>Technology • Power • Elections</h2><p>One intelligent control center for the entire PoliSync Africa platform.</p></div><div className="hero-badge">SA</div></section>

          <nav className="dashboard-nav" aria-label="Dashboard quick navigation">
            {NAV.map(([id, icon, label]) => <button key={id} type="button" className={activeSection === id ? "nav-active" : ""} onClick={() => jumpTo(id)}><span>{icon}</span><strong>{label}</strong></button>)}
          </nav>

          <section className="stats-grid" aria-label="Platform statistics">
            {STATS.map(([label, value, icon]) => <article className="stat-card" key={label}><span className="stat-icon">{icon}</span><div><span className="stat-label">{label}</span><strong>{value}</strong></div></article>)}
          </section>

          <section id="ai" className="grid-section"><DashboardPanel title="POLISYNC INTELLIGENCE • AI ANALYZER" className="ai-panel"><AIAnalyzer /></DashboardPanel></section>

          <section className="feature-grid">
            <DashboardTile id="assistant" title="AI Personal Assistant" subtitle="How can I help you today?" icon="◈" className="feature-ai"><AIPersonalAssistant /></DashboardTile>
            <DashboardTile id="approvals" title="Pending Approvals" subtitle="Items requiring attention" icon="✓"><div className="approval-grid">{APPROVALS.map(([label, value, icon]) => <div className="approval-item" key={label}><span>{icon}</span><strong>{value}</strong><small>{label}</small></div>)}</div></DashboardTile>
            <DashboardTile title="Quick Actions" subtitle="Common administration tasks" icon="ϟ"><div className="quick-grid">{QUICK_ACTIONS.map(([icon, label]) => <button type="button" className="quick-action" key={label}><span>{icon}</span><strong>{label}</strong></button>)}</div></DashboardTile>
            <DashboardTile id="results" title="Results Overview" subtitle="Election results monitoring" icon="▥"><div className="result-hero"><div className="donut"><div><strong>0%</strong><span>Submitted</span></div></div><div className="result-list"><ResultRow label="Submitted" value="0" /><ResultRow label="Pending" value="0" /><ResultRow label="Awaiting Verification" value="0" /><ResultRow label="Rejected" value="0" /></div></div></DashboardTile>
            <DashboardTile id="weather" title="Weather" subtitle="Current conditions" icon="☁"><WeatherCard /></DashboardTile>
            <DashboardTile title="Results by Region" subtitle="Regional submission activity" icon="⌖"><div className="region-grid">{REGIONS.map((region) => <div className="region-item" key={region}><span>{region}</span><strong>0</strong></div>)}</div></DashboardTile>
          </section>

          <section className="secondary-grid">
            <DashboardPanel title="Reminders"><RemindersPanel initialReminders={[]} /></DashboardPanel>
            <DashboardPanel id="activity" title="Notifications"><NotificationsPanel initialNotifications={[]} /></DashboardPanel>
            <DashboardPanel id="oversight" title="Complaints & Reports"><ComplaintsReportsPanel initialItems={[]} isSuperAdmin /></DashboardPanel>
            <DashboardPanel id="privacy" title="Privacy & Security"><PrivacySecurityPanel /></DashboardPanel>
          </section>

          <section id="health" className="health-section"><DashboardPanel title="SYSTEM HEALTH • PLATFORM INFRASTRUCTURE"><div className="health-grid">{["Server Status", "Database", "API Services", "Storage", "Security", "Backups"].map((item) => <div className="health-item" key={item}><span className="health-dot">✓</span><span>{item}</span><strong>Awaiting data</strong></div>)}</div></DashboardPanel></section>
        </main>
      </div>

      <style jsx>{`
        .super-admin-redesign{--green-950:#022d16;--green-800:#064d25;--gold:#d6ad35;--gold-bright:#f0cd61;--muted:#c5d6cb;min-height:100%;color:#fff;background:radial-gradient(circle at 15% 10%,rgba(34,150,83,.18),transparent 30%),radial-gradient(circle at 90% 80%,rgba(214,173,53,.1),transparent 25%),repeating-linear-gradient(0deg,rgba(255,255,255,.018) 0 1px,transparent 1px 32px),repeating-linear-gradient(90deg,rgba(255,255,255,.014) 0 1px,transparent 1px 32px),var(--green-950)}
        .dashboard-content{width:100%;max-width:1800px;margin:auto;padding:clamp(14px,2vw,32px);box-sizing:border-box}.hero{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:6px 2px 20px}.brand-kicker{color:var(--gold-bright);font-size:13px;font-weight:950;letter-spacing:2.2px}.hero h2{margin:6px 0 4px;font-size:clamp(22px,2.2vw,34px);line-height:1.1;font-weight:900}.hero p{margin:0;color:var(--muted);font-size:14px}.hero-badge{width:56px;height:56px;display:grid;place-items:center;border:2px solid var(--gold-bright);border-radius:50%;background:var(--green-800);color:var(--gold-bright);font-weight:950}
        .dashboard-nav{position:sticky;top:0;z-index:20;display:grid;grid-template-columns:repeat(9,minmax(0,1fr));gap:8px;padding:8px;margin:0 0 14px;border:1px solid rgba(214,173,53,.5);border-radius:16px;background:rgba(2,45,22,.94);backdrop-filter:blur(10px)}.dashboard-nav button{min-height:58px;border:1px solid rgba(214,173,53,.3);border-radius:11px;background:rgba(255,255,255,.04);color:#d7e5dc;font-size:10px;cursor:pointer}.dashboard-nav button span{display:block;font-size:18px;margin-bottom:4px}.dashboard-nav button strong{font-weight:850}.dashboard-nav button:hover,.dashboard-nav .nav-active{border-color:var(--gold-bright);background:rgba(214,173,53,.12);color:#fff}
        .stats-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin-bottom:14px}.stat-card{display:flex;align-items:center;gap:10px;padding:12px;border:1px solid rgba(214,173,53,.62);border-radius:13px;background:rgba(4,61,29,.82);min-width:0}.stat-icon{width:40px;height:40px;display:grid;place-items:center;flex:0 0 40px;border:1px solid var(--gold);border-radius:50%;color:var(--gold-bright)}.stat-label{display:block;color:var(--muted);font-size:9px;font-weight:750;text-transform:uppercase}.stat-card strong{display:block;margin-top:4px;font-size:21px}
        .grid-section,.health-section,.tile,.secondary-panel{scroll-margin-top:92px}.grid-section{margin-bottom:14px}.feature-grid,.secondary-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.tile,.secondary-panel{min-width:0;padding:clamp(15px,1.7vw,22px);border:2px solid rgba(214,173,53,.9);border-radius:18px;background:linear-gradient(145deg,rgba(7,95,43,.95),rgba(2,45,22,.97));box-shadow:inset 0 1px rgba(255,255,255,.08),0 10px 28px rgba(0,0,0,.2);overflow:hidden}.secondary-panel{border-width:1px}.secondary-panel h3{margin:0 0 13px;color:var(--gold-bright);font-size:15px;font-weight:900}.tile-header{display:flex;align-items:center;gap:13px;margin-bottom:15px}.tile-icon{width:50px;height:50px;display:grid;place-items:center;flex:0 0 50px;border:2px solid var(--gold-bright);border-radius:50%;color:var(--gold-bright);font-size:23px}.tile-header h3{margin:0;color:#fff;font-size:clamp(17px,1.7vw,25px);font-weight:900}.tile-header p{margin:4px 0 0;color:#cfe0d5;font-size:12px}.feature-ai{min-height:300px}.ai-panel :global(.dashboard-card){background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important}
        .approval-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.approval-item{min-height:120px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;border:1px solid rgba(214,173,53,.35);border-radius:13px;background:rgba(0,0,0,.13);text-align:center}.approval-item span{font-size:21px}.approval-item strong{font-size:24px}.approval-item small{color:var(--muted);font-size:9px}.quick-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.quick-action{min-height:95px;border:1px solid rgba(214,173,53,.4);border-radius:12px;background:rgba(0,0,0,.12);color:#fff;cursor:pointer}.quick-action span{display:block;font-size:22px;margin-bottom:6px}.quick-action strong{font-size:10px}.quick-action:hover{border-color:var(--gold-bright);background:rgba(214,173,53,.08)}
        .result-hero{display:grid;grid-template-columns:170px 1fr;align-items:center;gap:20px}.donut{width:150px;height:150px;display:grid;place-items:center;border-radius:50%;background:conic-gradient(var(--gold-bright) 0 0%,rgba(255,255,255,.12) 0 100%)}.donut>div{width:106px;height:106px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:50%;background:var(--green-950)}.donut strong{font-size:26px}.donut span{color:var(--muted);font-size:10px}.result-list{display:grid;gap:4px}.result-row,.region-item{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.08);color:var(--muted);font-size:11px}.result-row strong,.region-item strong{color:#fff}.region-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 18px}.weather-tile :global(.weather-card),.weather-tile :global(.dashboard-card){background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important}
        .health-section{margin-top:14px}.health-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.health-item{display:grid;grid-template-columns:30px 1fr;gap:7px;align-items:center;padding:12px;border-radius:12px;background:rgba(0,0,0,.13);color:#d2e0d6;font-size:11px}.health-item strong{grid-column:2;color:#91a99d;font-size:9px}.health-dot{width:25px;height:25px;display:grid;place-items:center;border:1px solid var(--gold);border-radius:50%;color:var(--gold-bright)}.secondary-grid{margin-top:14px}.secondary-panel :global(.polisync-notifications),.secondary-panel :global(.polisync-complaints){background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important}
        @media(max-width:1100px){.stats-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.dashboard-nav{grid-template-columns:repeat(5,minmax(0,1fr))}.health-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:760px){.feature-grid,.secondary-grid{grid-template-columns:1fr}.stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dashboard-nav{grid-template-columns:repeat(3,minmax(0,1fr))}.result-hero{grid-template-columns:1fr;justify-items:center}.result-list{width:100%}.approval-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.health-grid{grid-template-columns:1fr}}
        @media(max-width:430px){.dashboard-content{padding:10px}.hero-badge{width:45px;height:45px}.stat-card{padding:9px}.stat-icon{width:34px;height:34px;flex-basis:34px}.stat-label{font-size:8px}.stat-card strong{font-size:18px}.dashboard-nav{gap:5px;padding:6px}.dashboard-nav button{min-height:52px;font-size:8px}.dashboard-nav button span{font-size:16px}.quick-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.region-grid{grid-template-columns:1fr}}
      `}</style>
    </DashboardShell>
  );
}

function DashboardTile({ id, title, subtitle, icon, children, className = "" }) {
  return <section id={id} className={`tile ${className}`}><div className="tile-header"><div className="tile-icon" aria-hidden="true">{icon}</div><div><h3>{title}</h3>{subtitle ? <p>{subtitle}</p> : null}</div></div>{children}</section>;
}

function DashboardPanel({ id, title, children, className = "" }) {
  return <section id={id} className={`secondary-panel ${className}`}><h3>{title}</h3>{children}</section>;
}

function ResultRow({ label, value }) {
  return <div className="result-row"><span>{label}</span><strong>{value}</strong></div>;
}
