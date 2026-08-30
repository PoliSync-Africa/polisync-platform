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

const PLATFORM_STATS = [
  {
    label: "Total Users",
    value: "0",
    icon: "👥",
    tone: "green",
  },
  {
    label: "Organizations",
    value: "0",
    icon: "🏢",
    tone: "gold",
  },
  {
    label: "Candidates",
    value: "0",
    icon: "👤",
    tone: "blue",
  },
  {
    label: "Elections",
    value: "0",
    icon: "🗳️",
    tone: "purple",
  },
  {
    label: "Polling Stations",
    value: "0",
    icon: "📍",
    tone: "orange",
  },
  {
    label: "Results Submitted",
    value: "0",
    icon: "📊",
    tone: "teal",
  },
];

const REGIONS = [
  "Ahafo",
  "Ashanti",
  "Bono",
  "Bono East",
  "Central",
  "Eastern",
  "Greater Accra",
  "Northern",
  "North East",
  "Oti",
  "Savannah",
  "Upper East",
  "Upper West",
  "Volta",
  "Western",
  "Western North",
];

const SYSTEM_HEALTH = [
  "Server Status",
  "Database",
  "API Services",
  "Storage",
  "Security",
  "Backups",
];

const APPROVALS = [
  ["Users", "0", "👥"],
  ["Organizations", "0", "🏢"],
  ["Polling Stations", "0", "📍"],
  ["Candidates", "0", "👤"],
];

const ALERTS = [
  ["High", "0", "⚠️"],
  ["Medium", "0", "⚠️"],
  ["Information", "0", "ℹ️"],
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
  const [activeSection, setActiveSection] =
    useState("overview");

  const [showMobileMenu, setShowMobileMenu] =
    useState(false);

  return (
    <DashboardShell
      role="super_admin"
      title="Super Admin Dashboard"
      subtitle="Platform overview and control center"
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      mobileMenuOpen={showMobileMenu}
      onMobileMenuClose={() =>
        setShowMobileMenu(false)
      }
    >
      <div className="super-admin-page">
        <main className="dashboard-content">

          {/* ==================================================
              WELCOME
          ================================================== */}

          <section className="welcome-section">
            <div className="welcome-copy">
              <span className="eyebrow">
                PLATFORM CONTROL CENTER
              </span>

              <h2>
                Good day, Super Administrator
              </h2>

              <p>
                Monitor PoliSync Africa, elections,
                organizations, users, results and
                platform operations from one control
                center.
              </p>
            </div>

            <div className="welcome-actions">
              <button
                type="button"
                className="secondary-button"
              >
                + Announcement
              </button>

              <button
                type="button"
                className="primary-button"
              >
                Generate Report
              </button>
            </div>
          </section>

          {/* ==================================================
              PLATFORM STATISTICS
          ================================================== */}

          <section
            className="stats-grid"
            aria-label="Platform statistics"
          >
            {PLATFORM_STATS.map((stat) => (
              <StatCard
                key={stat.label}
                {...stat}
              />
            ))}
          </section>

          {/* ==================================================
              MAIN DASHBOARD GRID
          ================================================== */}

          <section className="dashboard-grid">

            {/* RESULTS OVERVIEW */}

            <ResultsOverview />

            {/* RESULTS BY REGION */}

            <RegionsOverview />

            {/* SYSTEM HEALTH */}

            <SystemHealth />

            {/* WEATHER */}

            <div className="dashboard-panel">
              <WeatherCard />
            </div>

            {/* REMINDERS */}

            <DashboardPanel>
              <RemindersPanel
                initialReminders={[]}
              />
            </DashboardPanel>

            {/* COMPLAINTS */}

            <DashboardPanel>
              <ComplaintsReportsPanel
                initialItems={[]}
                isSuperAdmin
              />
            </DashboardPanel>

            {/* AI ASSISTANT */}

            <DashboardPanel>
              <AIPersonalAssistant />
            </DashboardPanel>

            {/* USER ACTIVITY */}

            <UserActivity />

            {/* AI ANALYZER */}

            <DashboardPanel>
              <AIAnalyzer />
            </DashboardPanel>

            {/* NOTIFICATIONS */}

            <DashboardPanel>
              <NotificationsPanel
                initialNotifications={[]}
              />
            </DashboardPanel>

            {/* APPROVALS */}

            <Approvals />

            {/* ALERTS */}

            <SystemAlerts />

            {/* PRIVACY */}

            <DashboardPanel>
              <PrivacySecurityPanel />
            </DashboardPanel>

            {/* QUICK ACTIONS */}

            <QuickActions />

          </section>
        </main>
      </div>

      <style jsx>{`

        /* ==================================================
           PAGE
        ================================================== */

        .super-admin-page {
          min-height: 100%;
          background: #f4f7f5;
          color: #1f2d25;
        }

        .dashboard-content {
          width: 100%;
          max-width: 1680px;
          margin: 0 auto;
          padding: clamp(18px, 2.5vw, 32px);
          box-sizing: border-box;
        }

        /* ==================================================
           WELCOME
        ================================================== */

        .welcome-section {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 24px;
        }

        .welcome-copy {
          min-width: 0;
        }

        .eyebrow {
          display: inline-block;
          margin-bottom: 8px;
          color: #b18b19;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .welcome-copy h2 {
          margin: 0;
          color: #075f2b;
          font-size: clamp(24px, 2.5vw, 34px);
          line-height: 1.15;
          font-weight: 850;
        }

        .welcome-copy p {
          max-width: 760px;
          margin: 9px 0 0;
          color: #68766e;
          font-size: 14px;
          line-height: 1.55;
        }

        .welcome-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          flex-shrink: 0;
        }

        .primary-button,
        .secondary-button {
          min-height: 44px;
          padding: 10px 17px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        .primary-button {
          border: 1px solid #075f2b;
          background: #075f2b;
          color: #fff;
        }

        .secondary-button {
          border: 1px solid #d5e1d9;
          background: #fff;
          color: #075f2b;
        }

        /* ==================================================
           STATISTICS
        ================================================== */

        .stats-grid {
          display: grid;
          grid-template-columns:
            repeat(6, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 14px;
        }

        .stat-card {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 17px;
          border: 1px solid #dce7e0;
          border-radius: 15px;
          background: #fff;
          box-shadow:
            0 6px 22px
            rgba(18, 54, 32, 0.045);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          flex: 0 0 48px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          font-size: 22px;
        }

        .tone-green {
          background: #e7f5ec;
        }

        .tone-gold {
          background: #faf2d9;
        }

        .tone-blue {
          background: #e8f1fa;
        }

        .tone-purple {
          background: #eeeafa;
        }

        .tone-orange {
          background: #fff0e1;
        }

        .tone-teal {
          background: #e5f5f3;
        }

        .stat-copy {
          min-width: 0;
        }

        .stat-label {
          display: block;
          color: #718078;
          font-size: 12px;
          line-height: 1.3;
          font-weight: 650;
        }

        .stat-value {
          display: block;
          margin-top: 5px;
          color: #26372d;
          font-size: clamp(21px, 2vw, 27px);
          line-height: 1;
          font-weight: 900;
        }

        .stat-note {
          display: block;
          margin-top: 5px;
          color: #8b9890;
          font-size: 10px;
        }

        /* ==================================================
           GRID
        ================================================== */

        .dashboard-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 14px;
          align-items: stretch;
        }

        .dashboard-panel,
        .dashboard-card {
          min-width: 0;
          padding: 20px;
          border: 1px solid #dce7e0;
          border-radius: 16px;
          background: #fff;
          box-shadow:
            0 6px 22px
            rgba(18, 54, 32, 0.045);
          box-sizing: border-box;
          overflow: hidden;
        }

        .dashboard-panel :global(
          .polisync-notifications
        ),
        .dashboard-panel :global(
          .polisync-complaints
        ) {
          padding: 0;
          border: 0;
          box-shadow: none;
        }

        .dashboard-panel:nth-child(5),
        .dashboard-panel:nth-child(6),
        .dashboard-panel:nth-child(7),
        .dashboard-panel:nth-child(9),
        .dashboard-panel:nth-child(10),
        .dashboard-panel:nth-child(13) {
          grid-column: span 2;
        }

        /* ==================================================
           CARD HEADER
        ================================================== */

        .card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }

        .card-header h3 {
          margin: 0;
          color: #26372d;
          font-size: 17px;
          line-height: 1.25;
          font-weight: 850;
        }

        .card-header p {
          margin: 5px 0 0;
          color: #829088;
          font-size: 12px;
          line-height: 1.4;
        }

        /* ==================================================
           RESULTS
        ================================================== */

        .results-layout {
          display: grid;
          grid-template-columns:
            175px minmax(0, 1fr);
          gap: 25px;
          align-items: center;
        }

        .donut {
          width: 165px;
          height: 165px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background:
            conic-gradient(
              #0a8f3c 0 0%,
              #e7ece9 0 100%
            );
        }

        .donut-inner {
          width: 116px;
          height: 116px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #fff;
          text-align: center;
        }

        .donut-inner strong {
          color: #075f2b;
          font-size: 27px;
          font-weight: 900;
        }

        .donut-inner span {
          margin-top: 4px;
          color: #849088;
          font-size: 11px;
        }

        .legend {
          display: grid;
          gap: 12px;
        }

        .legend-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid #edf1ee;
          font-size: 12px;
        }

        .legend-name {
          display: flex;
          align-items: center;
          color: #68766e;
        }

        .legend-dot {
          width: 9px;
          height: 9px;
          margin-right: 8px;
          border-radius: 50%;
          background: #cfd8d2;
        }

        .legend-row strong {
          color: #344239;
          font-weight: 850;
        }

        /* ==================================================
           REGIONS
        ================================================== */

        .region-list {
          display: grid;
        }

        .region-row {
          min-height: 42px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid #edf1ee;
          font-size: 12px;
        }

        .region-row span {
          color: #68766e;
        }

        .region-row strong {
          color: #344239;
        }

        .empty-label {
          margin-top: 13px;
          color: #8a9890;
          font-size: 11px;
          line-height: 1.5;
        }

        /* ==================================================
           HEALTH
        ================================================== */

        .health-list {
          display: grid;
        }

        .health-row {
          min-height: 43px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid #edf1ee;
        }

        .health-name {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #68766e;
          font-size: 12px;
        }

        .health-check {
          width: 25px;
          height: 25px;
          display: grid;
          place-items: center;
          border-radius: 7px;
          background: #edf2ef;
          color: #87948c;
          font-weight: 900;
        }

        .health-status {
          color: #7f8b84;
          font-size: 11px;
          font-weight: 750;
        }

        /* ==================================================
           ACTIVITY
        ================================================== */

        .activity-card {
          grid-column: span 2;
          min-width: 0;
          padding: 20px;
          border: 1px solid #dce7e0;
          border-radius: 16px;
          background: #fff;
          box-shadow:
            0 6px 22px
            rgba(18, 54, 32, 0.045);
        }

        .activity-chart {
          position: relative;
          height: 260px;
          overflow: hidden;
          border-radius: 12px;
          background:
            repeating-linear-gradient(
              to bottom,
              #fff 0,
              #fff calc(20% - 1px),
              #edf2ef calc(20% - 1px),
              #edf2ef 20%
            );
        }

        .activity-empty {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          color: #8a9890;
          font-size: 13px;
          font-weight: 700;
        }

        /* ==================================================
           APPROVALS
        ================================================== */

        .approval-grid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .approval-item {
          min-height: 105px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          border-radius: 12px;
          background: #f6f9f7;
          text-align: center;
        }

        .approval-icon {
          font-size: 22px;
        }

        .approval-value {
          color: #075f2b;
          font-size: 23px;
          font-weight: 900;
        }

        .approval-label {
          color: #7d8982;
          font-size: 11px;
          font-weight: 700;
        }

        /* ==================================================
           ALERTS
        ================================================== */

        .alert-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .alert-item {
          min-height: 105px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          border-radius: 12px;
          background: #fafafa;
          text-align: center;
        }

        .alert-icon {
          font-size: 22px;
        }

        .alert-value {
          color: #344239;
          font-size: 23px;
          font-weight: 900;
        }

        .alert-label {
          color: #7d8982;
          font-size: 11px;
          font-weight: 700;
        }

        /* ==================================================
           QUICK ACTIONS
        ================================================== */

        .quick-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .quick-action {
          min-height: 90px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid #e0e8e3;
          border-radius: 12px;
          background: #fff;
          color: #536159;
          cursor: pointer;
        }

        .quick-action:hover {
          border-color: #c7d7cc;
          background: #f8fbf9;
        }

        .quick-icon {
          font-size: 23px;
        }

        .quick-label {
          font-size: 11px;
          font-weight: 800;
        }

        /* ==================================================
           LARGE TABLETS
        ================================================== */

        @media (max-width: 1350px) {
          .stats-grid {
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
          }

          .dashboard-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .dashboard-panel,
          .activity-card {
            grid-column: span 1;
          }

          .dashboard-panel:nth-child(5),
          .dashboard-panel:nth-child(6),
          .dashboard-panel:nth-child(7),
          .dashboard-panel:nth-child(9),
          .dashboard-panel:nth-child(10),
          .dashboard-panel:nth-child(13),
          .activity-card {
            grid-column: span 2;
          }
        }

        /* ==================================================
           TABLET
        ================================================== */

        @media (max-width: 900px) {
          .welcome-section {
            align-items: flex-start;
            flex-direction: column;
          }

          .welcome-actions {
            width: 100%;
          }

          .welcome-actions button {
            flex: 1;
          }

          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-panel,
          .dashboard-panel:nth-child(n),
          .activity-card {
            grid-column: span 1;
          }
        }

        /* ==================================================
           MOBILE
        ================================================== */

        @media (max-width: 650px) {
          .dashboard-content {
            padding: 14px;
          }

          .stats-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .stat-card {
            align-items: flex-start;
            padding: 14px;
          }

          .stat-icon {
            width: 42px;
            height: 42px;
            flex-basis: 42px;
            font-size: 19px;
          }

          .stat-label {
            font-size: 11px;
          }

          .stat-value {
            font-size: 21px;
          }

          .results-layout {
            grid-template-columns: 1fr;
            justify-items: center;
          }

          .legend {
            width: 100%;
          }

          .approval-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .quick-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        /* ==================================================
           SMALL PHONES
        ================================================== */

        @media (max-width: 430px) {
          .welcome-copy h2 {
            font-size: 23px;
          }

          .welcome-copy p {
            font-size: 13px;
          }

          .welcome-actions {
            flex-direction: column;
          }

          .welcome-actions button {
            width: 100%;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-panel,
          .dashboard-card,
          .activity-card {
            padding: 16px;
          }

          .alert-grid {
            grid-template-columns: 1fr;
          }

          .donut {
            width: 145px;
            height: 145px;
          }

          .donut-inner {
            width: 102px;
            height: 102px;
          }
        }

      `}</style>
    </DashboardShell>
  );
}
function StatCard({
  label,
  value,
  icon,
  tone,
}) {
  return (
    <article className="stat-card">
      <div
        className={`stat-icon tone-${tone}`}
        aria-hidden="true"
      >
        {icon}
      </div>

      <div className="stat-copy">
        <span className="stat-label">
          {label}
        </span>

        <strong className="stat-value">
          {value}
        </strong>

        <small className="stat-note">
          Live platform data
        </small>
      </div>
    </article>
  );
}

function CardHeader({
  title,
  subtitle,
}) {
  return (
    <div className="card-header">
      <div>
        <h3>{title}</h3>

        {subtitle ? (
          <p>{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

function DashboardPanel({
  children,
}) {
  return (
    <section className="dashboard-panel">
      {children}
    </section>
  );
}

function ResultsOverview() {
  const results = [
    ["Submitted", "0"],
    ["Pending", "0"],
    ["Awaiting Verification", "0"],
    ["Rejected", "0"],
  ];

  return (
    <section className="dashboard-card">
      <CardHeader
        title="Results Overview"
        subtitle="Election results monitoring"
      />

      <div className="results-layout">
        <div className="donut">
          <div className="donut-inner">
            <strong>0%</strong>
            <span>Submitted</span>
          </div>
        </div>

        <div className="legend">
          {results.map(
            ([label, value]) => (
              <div
                className="legend-row"
                key={label}
              >
                <span className="legend-name">
                  <i className="legend-dot" />
                  {label}
                </span>

                <strong>
                  {value}
                </strong>
              </div>
            )
          )}
        </div>
      </div>

      <div className="empty-label">
        Election result data will appear here
        when connected to the results service.
      </div>
    </section>
  );
}

function RegionsOverview() {
  return (
    <section className="dashboard-card">
      <CardHeader
        title="Results by Region"
        subtitle="Regional submission activity"
      />

      <div className="region-list">
        {REGIONS.slice(0, 8).map(
          (region) => (
            <div
              className="region-row"
              key={region}
            >
              <span>
                {region}
              </span>

              <strong>
                0
              </strong>
            </div>
          )
        )}
      </div>

      <div className="empty-label">
        Regional figures will be populated
        from live election data.
      </div>
    </section>
  );
}

function SystemHealth() {
  return (
    <section className="dashboard-card">
      <CardHeader
        title="System Health"
        subtitle="Platform infrastructure"
      />

      <div className="health-list">
        {SYSTEM_HEALTH.map(
          (item) => (
            <div
              className="health-row"
              key={item}
            >
              <div className="health-name">
                <span className="health-check">
                  •
                </span>

                {item}
              </div>

              <strong className="health-status">
                Awaiting data
              </strong>
            </div>
          )
        )}
      </div>
    </section>
  );
}

function UserActivity() {
  return (
    <section className="activity-card">
      <CardHeader
        title="User Activity"
        subtitle="Live platform activity"
      />

      <div className="activity-chart">
        <div className="activity-empty">
          No activity data available yet.
        </div>
      </div>

      <div className="empty-label">
        Activity analytics will appear after
        the platform activity service is connected.
      </div>
    </section>
  );
}

function Approvals() {
  return (
    <section className="dashboard-card">
      <CardHeader
        title="Pending Approvals"
        subtitle="Items requiring attention"
      />

      <div className="approval-grid">
        {APPROVALS.map(
          ([label, value, icon]) => (
            <div
              className="approval-item"
              key={label}
            >
              <span
                className="approval-icon"
                aria-hidden="true"
              >
                {icon}
              </span>

              <strong className="approval-value">
                {value}
              </strong>

              <span className="approval-label">
                {label}
              </span>
            </div>
          )
        )}
      </div>
    </section>
  );
}

function SystemAlerts() {
  return (
    <section className="dashboard-card">
      <CardHeader
        title="System Alerts"
        subtitle="Current platform alerts"
      />

      <div className="alert-grid">
        {ALERTS.map(
          ([label, value, icon]) => (
            <div
              className="alert-item"
              key={label}
            >
              <span
                className="alert-icon"
                aria-hidden="true"
              >
                {icon}
              </span>

              <strong className="alert-value">
                {value}
              </strong>

              <span className="alert-label">
                {label}
              </span>
            </div>
          )
        )}
      </div>
    </section>
  );
}

function QuickActions() {
  return (
    <section className="dashboard-card">
      <CardHeader
        title="Quick Actions"
        subtitle="Common administration tasks"
      />

      <div className="quick-grid">
        {QUICK_ACTIONS.map(
          ([icon, label]) => (
            <button
              type="button"
              className="quick-action"
              key={label}
            >
              <span
                className="quick-icon"
                aria-hidden="true"
              >
                {icon}
              </span>

              <span className="quick-label">
                {label}
              </span>
            </button>
          )
        )}
      </div>
    </section>
  );
}
