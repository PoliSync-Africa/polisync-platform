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
  ["Users", "0", "👥"],
  ["Organizations", "0", "🏢"],
  ["Candidates", "0", "👤"],
  ["Elections", "0", "🗳️"],
  ["Polling Stations", "0", "📍"],
  ["Results Submitted", "0", "📊"],
];

const REGIONS = [
  "Ahafo", "Ashanti", "Bono", "Bono East",
  "Central", "Eastern", "Greater Accra", "Northern",
];

const APPROVALS = [
  ["Users", "0", "👥"],
  ["Organizations", "0", "🏢"],
  ["Polling Stations", "0", "📍"],
  ["Candidates", "0", "👤"],
];

const QUICK_ACTIONS = [
  ["📢", "Announcement"],
  ["👥", "Manage Users"],
  ["🏢", "Organizations"],
  ["📊", "Generate Report"],
  ["🛡️", "Security Center"],
  ["⚙️", "System Settings"],
];

export default function SuperAdminDashboard() {
  const [activeSection, setActiveSection] = useState("overview");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <DashboardShell
      role="super_admin"
      title="Super Admin Dashboard"
      subtitle="Platform overview and control center"
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      mobileMenuOpen={showMobileMenu}
      onMobileMenuClose={() => setShowMobileMenu(false)}
    >
      <div className="super-admin-redesign">
        <main className="dashboard-content">
          <section className="hero">
            <div>
              <div className="brand-kicker">POLISYNC AFRICA</div>
              <h2>Technology • Power • Elections</h2>
              <p>One intelligent control center for the entire PoliSync Africa platform.</p>
            </div>
            <div className="hero-badge">SA</div>
          </section>

          <section className="stats-grid" aria-label="Platform statistics">
            {STATS.map(([label, value, icon]) => (
              <article className="stat-card" key={label}>
                <span className="stat-icon">{icon}</span>
                <div>
                  <span className="stat-label">{label}</span>
                  <strong>{value}</strong>
                </div>
              </article>
            ))}
          </section>

          <section className="feature-grid">
            <DashboardTile title="AI Personal Assistant" subtitle="How can I help you today?" icon="◈" className="feature-ai">
              <AIPersonalAssistant />
            </DashboardTile>

            <DashboardTile title="Pending Approvals" subtitle="Items requiring attention" icon="✓">
              <div className="approval-grid">
                {APPROVALS.map(([label, value, icon]) => (
                  <div className="approval-item" key={label}>
                    <span>{icon}</span>
                    <strong>{value}</strong>
                    <small>{label}</small>
                  </div>
                ))}
              </div>
            </DashboardTile>

            <DashboardTile title="Quick Actions" subtitle="Common administration tasks" icon="ϟ">
              <div className="quick-grid">
                {QUICK_ACTIONS.map(([icon, label]) => (
                  <button type="button" className="quick-action" key={label}>
                    <span>{icon}</span>
                    <strong>{label}</strong>
                  </button>
                ))}
              </div>
            </DashboardTile>

            <DashboardTile title="Results Overview" subtitle="Election results monitoring" icon="▥">
              <div className="result-hero">
                <div className="donut"><div><strong>0%</strong><span>Submitted</span></div></div>
                <div className="result-list">
                  <ResultRow label="Submitted" value="0" />
                  <ResultRow label="Pending" value="0" />
                  <ResultRow label="Awaiting Verification" value="0" />
                  <ResultRow label="Rejected" value="0" />
                </div>
              </div>
            </DashboardTile>

            <DashboardTile title="System Health" subtitle="Platform infrastructure" icon="◇">
              <div className="health-grid">
                {[
                  "Server Status",
                  "Database",
                  "API Services",
                  "Storage",
                  "Security",
                  "Backups",
                ].map((item) => (
                  <div className="health-item" key={item}>
                    <span className="health-dot">✓</span>
                    <span>{item}</span>
                    <strong>Awaiting data</strong>
                  </div>
                ))}
              </div>
            </DashboardTile>

            <DashboardTile title="Results by Region" subtitle="Regional submission activity" icon="⌖">
              <div className="region-grid">
                {REGIONS.map((region) => (
                  <div className="region-item" key={region}>
                    <span>{region}</span>
                    <strong>0</strong>
                  </div>
                ))}
              </div>
            </DashboardTile>

            <DashboardTile title="Weather" subtitle="Current conditions" icon="☁" className="weather-tile">
              <WeatherCard />
            </DashboardTile>
          </section>

          <section className="secondary-grid">
            <DashboardPanel title="Reminders"><RemindersPanel initialReminders={[]} /></DashboardPanel>
            <DashboardPanel title="Notifications"><NotificationsPanel initialNotifications={[]} /></DashboardPanel>
            <DashboardPanel title="Complaints & Reports"><ComplaintsReportsPanel initialItems={[]} isSuperAdmin /></DashboardPanel>
            <DashboardPanel title="AI Analyzer"><AIAnalyzer /></DashboardPanel>
            <DashboardPanel title="Privacy & Security"><PrivacySecurityPanel /></DashboardPanel>
          </section>
        </main>
      </div>

      <style jsx>{`
        .super-admin-redesign {
          --green-950: #022d16;
          --green-900: #043d1d;
          --green-800: #064d25;
          --green-700: #075f2b;
          --green-600: #087b39;
          --gold: #d6ad35;
          --gold-bright: #f0cd61;
          --white: #ffffff;
          --muted: #c5d6cb;
          min-height: 100%;
          color: var(--white);
          background:
            radial-gradient(circle at 15% 10%, rgba(34, 150, 83, .18), transparent 30%),
            radial-gradient(circle at 90% 80%, rgba(214, 173, 53, .10), transparent 25%),
            repeating-linear-gradient(0deg, rgba(255,255,255,.018) 0 1px, transparent 1px 32px),
            repeating-linear-gradient(90deg, rgba(255,255,255,.014) 0 1px, transparent 1px 32px),
            var(--green-950);
        }

        .super-admin-redesign .dashboard-content {
          width: 100%;
          max-width: 1800px;
          margin: 0 auto;
          padding: clamp(16px, 2.2vw, 34px);
          box-sizing: border-box;
        }

        .hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 8px 2px 24px;
        }

        .brand-kicker {
          color: var(--gold-bright);
          font-size: clamp(12px, 1.1vw, 16px);
          font-weight: 950;
          letter-spacing: 2.4px;
        }

        .hero h2 {
          margin: 7px 0 4px;
          color: #fff;
          font-size: clamp(22px, 2.2vw, 34px);
          line-height: 1.1;
          font-weight: 900;
          letter-spacing: -.5px;
        }

        .hero p {
          margin: 0;
          color: var(--muted);
          font-size: clamp(12px, 1vw, 15px);
          line-height: 1.45;
        }

        .hero-badge {
          width: 58px;
          height: 58px;
          flex: 0 0 58px;
          display: grid;
          place-items: center;
          border: 2px solid var(--gold-bright);
          border-radius: 50%;
          background: var(--green-800);
          color: var(--gold-bright);
          font-size: 19px;
          font-weight: 950;
          box-shadow: 0 0 24px rgba(214,173,53,.16);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 14px;
        }

        .stat-card {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 14px;
          border: 1px solid rgba(214,173,53,.62);
          border-radius: 14px;
          background: rgba(4,61,29,.82);
          box-shadow: inset 0 1px rgba(255,255,255,.06), 0 8px 24px rgba(0,0,0,.16);
          backdrop-filter: blur(6px);
        }

        .stat-icon {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          display: grid;
          place-items: center;
          border: 1px solid var(--gold);
          border-radius: 50%;
          color: var(--gold-bright);
          font-size: 19px;
          background: rgba(0,0,0,.12);
        }

        .stat-label {
          display: block;
          color: var(--muted);
          font-size: 10px;
          line-height: 1.2;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: .55px;
        }

        .stat-card strong {
          display: block;
          margin-top: 4px;
          color: #fff;
          font-size: 23px;
          line-height: 1;
          font-weight: 950;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .tile {
          min-width: 0;
          padding: clamp(16px, 1.8vw, 24px);
          border: 2px solid rgba(214,173,53,.9);
          border-radius: 19px;
          background:
            linear-gradient(145deg, rgba(7,95,43,.94), rgba(2,45,22,.96));
          box-shadow:
            inset 0 1px rgba(255,255,255,.08),
            0 12px 32px rgba(0,0,0,.22),
            0 0 0 1px rgba(255,255,255,.025);
          overflow: hidden;
        }

        .tile-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 17px;
        }

        .tile-icon {
          width: 54px;
          height: 54px;
          flex: 0 0 54px;
          display: grid;
          place-items: center;
          border: 2px solid var(--gold-bright);
          border-radius: 50%;
          color: var(--gold-bright);
          font-size: 25px;
          font-weight: 900;
          background: rgba(0,0,0,.14);
          box-shadow: 0 4px 16px rgba(0,0,0,.22);
        }

        .tile-header h3 {
          margin: 0;
          color: #fff;
          font-size: clamp(18px, 1.8vw, 27px);
          line-height: 1.08;
          font-weight: 900;
          letter-spacing: -.3px;
        }

        .tile-header p {
          margin: 5px 0 0;
          color: #cfe0d5;
          font-size: clamp(11px, 1vw, 14px);
          line-height: 1.35;
        }

        .feature-ai {
          min-height: 330px;
        }

        .approval-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 9px;
        }

        .approval-item {
          min-height: 135px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px solid rgba(214,173,53,.35);
          border-radius: 14px;
          background: rgba(0,0,0,.13);
          text-align: center;
        }

        .approval-item span { font-size: 23px; }
        .approval-item strong { color: #fff; font-size: 26px; font-weight: 950; }
        .approval-item small { color: #c5d6cb; font-size: 10px; font-weight: 800; }

        .quick-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .quick-action {
          min-height: 102px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid rgba(214,173,53,.45);
          border-radius: 13px;
          background: rgba(0,0,0,.12);
          color: #fff;
          cursor: pointer;
        }

        .quick-action:hover { border-color: var(--gold-bright); background: rgba(214,173,53,.08); }
        .quick-action span { font-size: 23px; }
        .quick-action strong { font-size: 11px; font-weight: 850; }

        .result-hero {
          display: grid;
          grid-template-columns: 180px minmax(0, 1fr);
          align-items: center;
          gap: 22px;
        }

        .donut {
          width: 165px;
          height: 165px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: conic-gradient(var(--gold-bright) 0 0%, rgba(255,255,255,.12) 0 100%);
        }

        .donut > div {
          width: 116px;
          height: 116px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: var(--green-950);
          text-align: center;
        }

        .donut strong { font-size: 28px; font-weight: 950; }
        .donut span { margin-top: 4px; color: var(--muted); font-size: 10px; }

        .result-list { display: grid; gap: 5px; }
        .result-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,.08); color: #c5d6cb; font-size: 12px; }
        .result-row strong { color: #fff; font-size: 14px; }

        .health-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; }
        .health-item { display: grid; grid-template-columns: 24px minmax(0,1fr); align-items: center; gap: 8px; min-height: 47px; padding: 7px 9px; border-radius: 10px; background: rgba(0,0,0,.12); color: #d2e0d6; font-size: 11px; }
        .health-item strong { grid-column: 2; color: #8da498; font-size: 9px; font-weight: 700; }
        .health-dot { width: 23px; height: 23px; display: grid; place-items: center; border: 1px solid var(--gold); border-radius: 50%; color: var(--gold-bright); font-size: 11px; }

        .region-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px 18px; }
        .region-item { display: flex; align-items: center; justify-content: space-between; min-height: 39px; border-bottom: 1px solid rgba(255,255,255,.08); color: #c5d6cb; font-size: 11px; }
        .region-item strong { color: #fff; font-size: 13px; }

        .weather-tile :global(.weather-card), .weather-tile :global(.dashboard-card) { background: transparent !important; border: 0 !important; box-shadow: none !important; color: #fff !important; padding: 0 !important; }

        .secondary-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 14px;
        }

        .secondary-panel {
          min-width: 0;
          padding: 18px;
          border: 1px solid rgba(214,173,53,.48);
          border-radius: 16px;
          background: rgba(2,45,22,.88);
          color: #fff;
          overflow: hidden;
        }

        .secondary-panel h3 { margin: 0 0 14px; color: var(--gold-bright); font-size: 15px; font-weight: 900; }
        .secondary-panel :global(.polisync-notifications), .secondary-panel :global(.polisync-complaints) { background: transparent !important; border: 0 !important; box-shadow: none !important; padding: 0 !important; }

        @media (max-width: 1100px) {
          .stats-grid { grid-template-columns: repeat(3, minmax(0,1fr)); }
        }

        @media (max-width: 760px) {
          .feature-grid, .secondary-grid { grid-template-columns: 1fr; }
          .stats-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
          .result-hero { grid-template-columns: 1fr; justify-items: center; }
          .result-list { width: 100%; }
        }

        @media (max-width: 430px) {
          .super-admin-redesign .dashboard-content { padding: 12px; }
          .hero { padding-bottom: 17px; }
          .hero-badge { width: 46px; height: 46px; flex-basis: 46px; font-size: 15px; }
          .stats-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
          .stat-card { padding: 10px; gap: 8px; }
          .stat-icon { width: 34px; height: 34px; flex-basis: 34px; font-size: 15px; }
          .stat-label { font-size: 8px; }
          .stat-card strong { font-size: 18px; }
          .approval-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
          .quick-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
          .health-grid, .region-grid { grid-template-columns: 1fr; }
          .tile { border-radius: 15px; }
        }
      `}</style>
    </DashboardShell>
  );
}

function DashboardTile({ title, subtitle, icon, children, className = "" }) {
  return (
    <section className={`tile ${className}`}>
      <div className="tile-header">
        <div className="tile-icon" aria-hidden="true">{icon}</div>
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function DashboardPanel({ title, children }) {
  return (
    <section className="secondary-panel">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function ResultRow({ label, value }) {
  return (
    <div className="result-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
