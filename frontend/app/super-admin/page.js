"use client";

import { useMemo, useState } from "react";

import DashboardShell from "../../components/dashboard/DashboardShell";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import WeatherCard from "../../components/dashboard/WeatherCard";
import RemindersPanel from "../../components/dashboard/RemindersPanel";
import AIPersonalAssistant from "../../components/dashboard/AIPersonalAssistant";
import AIAnalyzer from "../../components/dashboard/AIAnalyzer";
import NotificationsPanel from "../../components/dashboard/NotificationsPanel";
import ComplaintsReportsPanel from "../../components/dashboard/ComplaintsReportsPanel";
import PrivacySecurityPanel from "../../components/dashboard/PrivacySecurityPanel";

export default function SuperAdminDashboard() {
  const [activeSection, setActiveSection] =
    useState("overview");

  const [showMobileMenu, setShowMobileMenu] =
    useState(false);

  const [selectedElection, setSelectedElection] =
    useState("Presidential Election 2024");

  const user = {
    displayName: "Super Administrator",
    firstName: "Super",
    platformRole: "super_admin",
  };

  const stats = [
    {
      label: "Total Users",
      value: "124,458",
      change: "+12.5%",
      icon: "👥",
    },
    {
      label: "Organizations",
      value: "312",
      change: "+8.2%",
      icon: "🏢",
    },
    {
      label: "Candidates",
      value: "1,256",
      change: "+12.2%",
      icon: "👤",
    },
    {
      label: "Elections",
      value: "8",
      change: "Active",
      icon: "🗳️",
    },
    {
      label: "Polling Stations",
      value: "40,842",
      change: "All regions",
      icon: "📍",
    },
    {
      label: "Results Submitted",
      value: "18,732",
      change: "72.2%",
      icon: "📊",
    },
  ];

  const regions = [
    ["Ashanti", "2,199"],
    ["Greater Accra", "2,199"],
    ["Eastern", "1,992"],
    ["Bono East", "1,421"],
    ["Northern", "1,421"],
  ];

  const complaints = [
    {
      id: "PS-1023",
      subject:
        "Recent discrepancy of Techiman South results",
      source: "Polling Agent",
      priority: "High",
      time: "3m ago",
      status: "pending",
    },
    {
      id: "PS-1024",
      subject:
        "Unconfirmed user access attempt",
      source: "Regional Admin",
      priority: "Urgent",
      time: "12m ago",
      status: "under_review",
    },
    {
      id: "PS-1022",
      subject:
        "Delayed EC8 submission",
      source: "Constituency Admin",
      priority: "Medium",
      time: "1h ago",
      status: "pending",
    },
    {
      id: "PS-1021",
      subject:
        "Polling station facility issue",
      source: "Polling Agent",
      priority: "Low",
      time: "2h ago",
      status: "resolved",
    },
  ];

  const notifications = [
    {
      id: "notification-1",
      type: "security",
      title: "Security alert",
      message:
        "A new administrative login was detected.",
      createdAt: new Date(
        Date.now() - 12 * 60 * 1000
      ).toISOString(),
      read: false,
    },
    {
      id: "notification-2",
      type: "result",
      title: "Election results update",
      message:
        "New polling-station results have been submitted.",
      createdAt: new Date(
        Date.now() - 35 * 60 * 1000
      ).toISOString(),
      read: false,
    },
    {
      id: "notification-3",
      type: "approval",
      title: "Pending approvals",
      message:
        "New accounts are awaiting administrative review.",
      createdAt: new Date(
        Date.now() - 2 * 60 * 60 * 1000
      ).toISOString(),
      read: true,
    },
  ];

  const reminders = [
    {
      id: "reminder-1",
      title: "Platform security briefing",
      description:
        "Review platform security status.",
      date: new Date().toISOString(),
      time: "10:00 AM",
      completed: false,
    },
    {
      id: "reminder-2",
      title: "Review pending organizations",
      description:
        "Check organization approval queue.",
      date: new Date().toISOString(),
      time: "11:00 AM",
      completed: false,
    },
    {
      id: "reminder-3",
      title: "System backup review",
      description:
        "Review the latest platform backup.",
      date: new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString(),
      time: "10:00 AM",
      completed: false,
    },
  ];

  const systemHealth = [
    ["Server Status", "Operational"],
    ["Database", "Operational"],
    ["API Services", "Operational"],
    ["Storage", "Healthy"],
    ["Security", "Protected"],
    ["Backups", "Operational"],
  ];

  const pendingApprovals = [
    ["Users", "24"],
    ["Organizations", "7"],
    ["Polling Stations", "13"],
    ["Candidates", "9"],
  ];

  const systemAlerts = [
    {
      label: "High",
      value: "3",
      icon: "⚠️",
    },
    {
      label: "Medium",
      value: "7",
      icon: "⚠️",
    },
    {
      label: "Information",
      value: "10",
      icon: "ℹ️",
    },
  ];

  const userActivity = useMemo(
    () => [
      27, 31, 28, 35, 29, 38, 34,
      31, 33, 37, 35, 39,
    ],
    []
  );

  return (
    <DashboardShell
      role="super_admin"
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      mobileMenuOpen={showMobileMenu}
      onMobileMenuClose={() =>
        setShowMobileMenu(false)
      }
    >
      <div className="super-admin-page">
        <DashboardHeader
          user={user}
          role="super_admin"
          title="Super Admin Dashboard"
          subtitle="Platform overview and control center"
          onMenuClick={() =>
            setShowMobileMenu(true)
          }
        />

        <main className="dashboard-content">
          {/* ==================================================
              TOP BAR
          ================================================== */}

          <div className="dashboard-topbar">
            <div>
              <span className="eyebrow">
                PLATFORM CONTROL CENTER
              </span>

              <h2>
                Good day, Super Administrator
              </h2>

              <p>
                Monitor PoliSync Africa,
                elections, organizations,
                users and platform operations.
              </p>
            </div>

            <div className="topbar-actions">
              <button type="button">
                + Announcement
              </button>

              <button type="button">
                Generate Report
              </button>
            </div>
          </div>

          {/* ==================================================
              KPI CARDS
          ================================================== */}

          <section className="stats-grid">
            {stats.map((stat) => (
              <div
                className="stat-card"
                key={stat.label}
              >
                <div className="stat-icon">
                  {stat.icon}
                </div>

                <div className="stat-content">
                  <span>{stat.label}</span>

                  <strong>{stat.value}</strong>

                  <small>
                    ↗ {stat.change}
                  </small>
                </div>
              </div>
            ))}
          </section>

          {/* ==================================================
              MAIN GRID
          ================================================== */}

          <section className="main-grid">
            {/* RESULTS OVERVIEW */}

            <div className="dashboard-card results-card">
              <CardHeader
                title="Results Overview"
                subtitle="Election results monitoring"
                action={
                  <select
                    value={selectedElection}
                    onChange={(event) =>
                      setSelectedElection(
                        event.target.value
                      )
                    }
                  >
                    <option>
                      Presidential Election 2024
                    </option>

                    <option>
                      Parliamentary Election 2024
                    </option>
                  </select>
                }
              />

              <div className="results-overview">
                <div className="donut">
                  <div className="donut-inner">
                    <strong>72.4%</strong>
                    <span>Submitted</span>
                  </div>
                </div>

                <div className="result-legend">
                  <LegendItem
                    label="Submitted"
                    value="18,732"
                  />

                  <LegendItem
                    label="Pending"
                    value="4,992"
                  />

                  <LegendItem
                    label="Awaiting Verification"
                    value="4,992"
                  />

                  <LegendItem
                    label="Rejected"
                    value="132"
                  />
                </div>
              </div>

              <div className="result-total">
                <span>Total Expected</span>
                <strong>35,990</strong>
              </div>
            </div>

            {/* RESULTS BY REGION */}

            <div className="dashboard-card">
              <CardHeader
                title="Results by Region"
                subtitle="Submission activity"
                action={
                  <button type="button">
                    View all
                  </button>
                }
              />

              <div className="region-layout">
                <div className="ghana-map">
                  🇬🇭
                  <span>
                    Ghana
                  </span>
                </div>

                <div className="region-list">
                  {regions.map(
                    ([region, value]) => (
                      <div
                        className="region-row"
                        key={region}
                      >
                        <span>{region}</span>
                        <strong>{value}</strong>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* SYSTEM HEALTH */}

            <div className="dashboard-card">
              <CardHeader
                title="System Health"
                subtitle="Platform infrastructure"
                action={
                  <span className="health-badge">
                    ● Healthy
                  </span>
                }
              />

              <div className="health-list">
                {systemHealth.map(
                  ([label, status]) => (
                    <div
                      className="health-row"
                      key={label}
                    >
                      <div className="health-name">
                        <span>✓</span>
                        {label}
                      </div>

                      <strong>
                        {status}
                      </strong>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* WEATHER */}

            <WeatherCard />

            {/* REMINDERS */}

            <RemindersPanel
              initialReminders={reminders}
            />

            {/* COMPLAINTS */}

            <ComplaintsReportsPanel
              initialItems={complaints}
              isSuperAdmin
            />

            {/* AI PERSONAL ASSISTANT */}

            <AIPersonalAssistant />

            {/* USER ACTIVITY */}

            <div className="dashboard-card activity-card">
              <CardHeader
                title="User Activity"
                subtitle="Last 7 days"
                action={
                  <strong className="activity-total">
                    39,742 active users
                  </strong>
                }
              />

              <div className="activity-chart">
                <div className="chart-grid">
                  {[40, 30, 20, 10, 0].map(
                    (number) => (
                      <span
                        key={number}
                        style={{
                          bottom: `${number * 2}%`,
                        }}
                      >
                        {number}K
                      </span>
                    )
                  )}
                </div>

                <svg
                  viewBox="0 0 500 170"
                  preserveAspectRatio="none"
                  className="activity-svg"
                >
                  <defs>
                    <linearGradient
                      id="activityGradient"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopOpacity="0.28"
                      />

                      <stop
                        offset="100%"
                        stopOpacity="0.02"
                      />
                    </linearGradient>
                  </defs>

                  <path
                    d="
                      M0 115
                      L45 105
                      L90 112
                      L135 88
                      L180 103
                      L225 72
                      L270 94
                      L315 52
                      L360 80
                      L405 61
                      L450 68
                      L500 55
                      L500 170
                      L0 170
                      Z
                    "
                    fill="url(#activityGradient)"
                  />

                  <polyline
                    points="
                      0,115
                      45,105
                      90,112
                      135,88
                      180,103
                      225,72
                      270,94
                      315,52
                      360,80
                      405,61
                      450,68
                      500,55
                    "
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                </svg>
              </div>
            </div>

            {/* AI ANALYZER */}

            <AIAnalyzer />

            {/* NOTIFICATIONS */}

            <NotificationsPanel
              initialNotifications={
                notifications
              }
            />

            {/* PENDING APPROVALS */}

            <div className="dashboard-card">
              <CardHeader
                title="Pending Approvals"
                subtitle="Requires attention"
                action={
                  <button type="button">
                    View all
                  </button>
                }
              />

              <div className="approval-grid">
                {pendingApprovals.map(
                  ([label, value]) => (
                    <div
                      className="approval-item"
                      key={label}
                    >
                      <div>
                        {label === "Users"
                          ? "👥"
                          : label ===
                            "Organizations"
                          ? "🏢"
                          : label ===
                            "Polling Stations"
                          ? "📍"
                          : "👤"}
                      </div>

                      <strong>{value}</strong>

                      <span>{label}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* SYSTEM ALERTS */}

            <div className="dashboard-card">
              <CardHeader
                title="System Alerts"
                subtitle="Current platform alerts"
                action={
                  <button type="button">
                    View all
                  </button>
                }
              />

              <div className="alert-grid">
                {systemAlerts.map(
                  (alert) => (
                    <div
                      className="alert-card"
                      key={alert.label}
                    >
                      <span>
                        {alert.icon}
                      </span>

                      <strong>
                        {alert.value}
                      </strong>

                      <small>
                        {alert.label}
                      </small>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* PRIVACY & SECURITY */}

            <PrivacySecurityPanel />

            {/* QUICK ACTIONS */}

            <div className="dashboard-card quick-actions">
              <CardHeader
                title="Quick Actions"
                subtitle="Common administration tasks"
              />

              <div className="quick-grid">
                <QuickAction
                  icon="📢"
                  label="Announcement"
                />

                <QuickAction
                  icon="👥"
                  label="Manage Users"
                />

                <QuickAction
                  icon="🏢"
                  label="Organizations"
                />

                <QuickAction
                  icon="📊"
                  label="Generate Report"
                />

                <QuickAction
                  icon="🛡️"
                  label="Security Center"
                />

                <QuickAction
                  icon="⚙️"
                  label="System Settings"
                />
              </div>
            </div>
          </section>
        </main>
      </div>

      <style jsx>{`
        .super-admin-page {
          min-height: 100vh;
          background: #f5f8f6;
          color: #26332b;
        }

        .dashboard-content {
          max-width: 1600px;
          margin: 0 auto;
          padding: 22px;
        }

        .dashboard-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 20px;
        }

        .eyebrow {
          color: #c9a227;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }

        .dashboard-topbar h2 {
          margin: 4px 0;
          color: #075f2b;
          font-size: 25px;
          font-weight: 850;
        }

        .dashboard-topbar p {
          margin: 0;
          color: #7c8780;
          font-size: 11px;
        }

        .topbar-actions {
          display: flex;
          gap: 8px;
        }

        .topbar-actions button {
          padding: 10px 13px;
          border: 1px solid #dbe6df;
          border-radius: 9px;
          background: #ffffff;
          color: #075f2b;
          font-size: 9px;
          font-weight: 800;
          cursor: pointer;
        }

        .topbar-actions button:last-child {
          border-color: #075f2b;
          background: #075f2b;
          color: #ffffff;
        }

        /* ==================================================
           STATS
        ================================================== */

        .stats-grid {
          display: grid;
          grid-template-columns:
            repeat(6, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 12px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
          padding: 12px;
          border: 1px solid #dfe8e2;
          border-radius: 12px;
          background: #ffffff;
        }

        .stat-icon {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 10px;
          background: #edf6f0;
          font-size: 17px;
        }

        .stat-content {
          min-width: 0;
        }

        .stat-content span {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #89928c;
          font-size: 8px;
        }

        .stat-content strong {
          display: block;
          margin-top: 3px;
          color: #25342b;
          font-size: 18px;
          font-weight: 850;
        }

        .stat-content small {
          display: block;
          margin-top: 2px;
          color: #0a8f3c;
          font-size: 7px;
          font-weight: 750;
        }

        /* ==================================================
           MAIN GRID
        ================================================== */

        .main-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .dashboard-card {
          min-width: 0;
          padding: 15px;
          border: 1px solid #dfe8e2;
          border-radius: 14px;
          background: #ffffff;
          box-shadow:
            0 4px 15px
              rgba(20, 60, 35, 0.035);
        }

        .results-card {
          grid-column: span 1;
        }

        .dashboard-card :global(
          .polisync-notifications
        ),
        .dashboard-card :global(
          .polisync-complaints
        ) {
          border: 0;
          box-shadow: none;
          padding: 0;
        }

        /* ==================================================
           CARD HEADER
        ================================================== */

        :global(.card-header) {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 13px;
        }

        :global(.card-header h3) {
          margin: 0;
          color: #26352c;
          font-size: 13px;
          font-weight: 850;
        }

        :global(.card-header p) {
          margin: 3px 0 0;
          color: #929b95;
          font-size: 8px;
        }

        :global(.card-header select),
        :global(.card-header button) {
          padding: 6px 8px;
          border: 1px solid #dce5df;
          border-radius: 7px;
          background: #ffffff;
          color: #68736c;
          font-size: 8px;
          cursor: pointer;
        }

        .health-badge {
          padding: 5px 8px;
          border-radius: 999px;
          background: #e7f5eb;
          color: #087631;
          font-size: 8px;
          font-weight: 800;
        }

        /* ==================================================
           RESULTS
        ================================================== */

        .results-overview {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .donut {
          width: 118px;
          height: 118px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 50%;
          background:
            conic-gradient(
              #0a8f3c 0 52%,
              #c9a227 52% 72.4%,
              #e8edf0 72.4% 100%
            );
        }

        .donut-inner {
          width: 84px;
          height: 84px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          border-radius: 50%;
          background: #ffffff;
        }

        .donut-inner strong {
          color: #075f2b;
          font-size: 20px;
        }

        .donut-inner span {
          margin-top: 2px;
          color: #929b95;
          font-size: 8px;
        }

        .result-legend {
          display: flex;
          flex-direction: column;
          gap: 9px;
          flex: 1;
        }

        .legend-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          font-size: 8px;
        }

        .legend-item span {
          color: #7d8780;
        }

        .legend-item strong {
          color: #344139;
        }

        .legend-dot {
          width: 7px;
          height: 7px;
          display: inline-block;
          margin-right: 5px;
          border-radius: 50%;
          background: #0a8f3c;
        }

        .result-total {
          display: flex;
          justify-content: space-between;
          margin-top: 17px;
          padding-top: 10px;
          border-top: 1px solid #edf1ee;
          color: #8a948e;
          font-size: 9px;
        }

        .result-total strong {
          color: #344139;
        }

        /* ==================================================
           REGIONS
        ================================================== */

        .region-layout {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .ghana-map {
          width: 42%;
          min-height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          border-radius: 12px;
          background: #edf5f0;
          color: #075f2b;
          font-size: 45px;
        }

        .ghana-map span {
          margin-top: 4px;
          font-size: 9px;
          font-weight: 800;
        }

        .region-list {
          flex: 1;
        }

        .region-row {
          display: flex;
          justify-content: space-between;
          padding: 7px 0;
          border-bottom: 1px solid #f0f3f1;
          font-size: 8px;
        }

        .region-row span {
          color: #7d8780;
        }

        .region-row strong {
          color: #344139;
        }

        /* ==================================================
           HEALTH
        ================================================== */

        .health-list {
          display: flex;
          flex-direction: column;
        }

        .health-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 9px 0;
          border-bottom: 1px solid #edf1ee;
          font-size: 8px;
        }

        .health-name {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #657069;
        }

        .health-name span {
          width: 19px;
          height: 19px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          background: #e9f5ed;
          color: #078037;
          font-weight: 900;
        }

        .health-row strong {
          color: #078037;
          font-size: 7px;
        }

        /* ==================================================
           ACTIVITY
        ================================================== */

        .activity-card {
          grid-column: span 2;
        }

        .activity-total {
          color: #078037;
          font-size: 9px;
        }

        .activity-chart {
          position: relative;
          height: 190px;
          padding-left: 32px;
        }

        .chart-grid {
          position: absolute;
          inset: 0 0 0 32px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          pointer-events: none;
        }

        .chart-grid::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            repeating-linear-gradient(
              to bottom,
              transparent 0,
              transparent calc(25% - 1px),
              #edf1ee calc(25% - 1px),
              #edf1ee 25%
            );
        }

        .chart-grid span {
          position: relative;
          z-index: 2;
          transform: translateX(-30px);
          color: #a1a9a4;
          font-size: 7px;
        }

        .activity-svg {
          width: 100%;
          height: 100%;
          overflow: visible;
          color: #0a8f3c;
        }

        /* ==================================================
           APPROVALS
        ================================================== */

        .approval-grid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 7px;
        }

        .approval-item {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 12px 5px;
          border-radius: 10px;
          background: #f6f9f7;
          text-align: center;
        }

        .approval-item div {
          font-size: 15px;
        }

        .approval-item strong {
          margin-top: 5px;
          color: #075f2b;
          font-size: 16px;
        }

        .approval-item span {
          margin-top: 2px;
          color: #89938c;
          font-size: 7px;
        }

        /* ==================================================
           ALERTS
        ================================================== */

        .alert-grid {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 8px;
        }

        .alert-card {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          min-height: 100px;
          border-radius: 11px;
          background: #f7f9f8;
          text-align: center;
        }

        .alert-card span {
          font-size: 15px;
        }

        .alert-card strong {
          margin-top: 5px;
          color: #354139;
          font-size: 20px;
        }

        .alert-card small {
          margin-top: 2px;
          color: #89938c;
          font-size: 7px;
        }

        /* ==================================================
           QUICK ACTIONS
        ================================================== */

        .quick-grid {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 8px;
        }

        .quick-action {
          min-height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 5px;
          border: 1px solid #e4ebe6;
          border-radius: 10px;
          background: #ffffff;
          color: #526058;
          cursor: pointer;
        }

        .quick-action:hover {
          border-color: #c9a227;
          background: #fafcfb;
        }

        .quick-action-icon {
          font-size: 17px;
        }

        .quick-action-label {
          font-size: 7px;
          font-weight: 800;
        }

        /* ==================================================
           RESPONSIVE
        ================================================== */

        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns:
              repeat(3, 1fr);
          }

          .main-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .activity-card {
            grid-column: span 2;
          }
        }

        @media (max-width: 760px) {
          .dashboard-content {
            padding: 13px;
          }

          .dashboard-topbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .dashboard-topbar h2 {
            font-size: 21px;
          }

          .topbar-actions {
            width: 100%;
          }

          .topbar-actions button {
            flex: 1;
          }

          .stats-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .main-grid {
            grid-template-columns: 1fr;
          }

          .activity-card {
            grid-column: span 1;
          }

          .approval-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }
        }

        @media (max-width: 430px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .stat-card {
            padding: 11px;
          }

          .results-overview {
            gap: 10px;
          }

          .donut {
            width: 95px;
            height: 95px;
          }

          .donut-inner {
            width: 68px;
            height: 68px;
          }

          .donut-inner strong {
            font-size: 16px;
          }

          .region-layout {
            flex-direction: column;
          }

          .ghana-map {
            width: 100%;
            min-height: 110px;
          }
        }
      `}</style>
    </DashboardShell>
  );
}

/* ============================================================
   CARD HEADER
============================================================ */

function CardHeader({
  title,
  subtitle,
  action,
}) {
  return (
    <div className="card-header">
      <div>
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>

      {action}
    </div>
  );
}

/* ============================================================
   LEGEND
============================================================ */

function LegendItem({
  label,
  value,
}) {
  return (
    <div className="legend-item">
      <span>
        <i className="legend-dot" />
        {label}
      </span>

      <strong>{value}</strong>
    </div>
  );
}

/* ============================================================
   QUICK ACTION
============================================================ */

function QuickAction({
  icon,
  label,
}) {
  return (
    <button
      type="button"
      className="quick-action"
    >
      <span className="quick-action-icon">
        {icon}
      </span>

      <span className="quick-action-label">
        {label}
      </span>
    </button>
  );
}
