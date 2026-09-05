"use client";

import { useState } from "react";

import DashboardShell from "../../components/dashboard/DashboardShell";
import WeatherCard from "../../components/dashboard/WeatherCard";
import RemindersPanel from "../../components/dashboard/RemindersPanel";
import AIPersonalAssistant from "../../components/dashboard/AIPersonalAssistant";
import AIAnalyzer from "../../components/dashboard/AIAnalyzer";
import NotificationsPanel from "../../components/dashboard/NotificationsPanel";
import PrivacySecurityPanel from "../../components/dashboard/PrivacySecurityPanel";

/* ============================================================
   OBSERVER NAVIGATION
============================================================ */

const observerNavigation = [
  {
    section: "OBSERVATION COMMAND",
    items: [
      {
        label: "Dashboard",
        href: "/observer",
        icon: "⌂",
        key: "overview",
      },
      {
        label: "National Observation",
        href: "/observer/national",
        icon: "◎",
        key: "national",
      },
      {
        label: "Regions",
        href: "/observer/regions",
        icon: "⌖",
        key: "regions",
      },
      {
        label: "Constituencies",
        href: "/observer/constituencies",
        icon: "▦",
        key: "constituencies",
      },
      {
        label: "Polling Stations",
        href: "/observer/polling-stations",
        icon: "▣",
        key: "polling-stations",
      },
    ],
  },

  {
    section: "OBSERVATION OPERATIONS",
    items: [
      {
        label: "Observer Deployment",
        href: "/observer/deployment",
        icon: "♙",
        key: "deployment",
      },
      {
        label: "Observation Teams",
        href: "/observer/teams",
        icon: "♚",
        key: "teams",
      },
      {
        label: "Field Reports",
        href: "/observer/reports",
        icon: "▤",
        key: "reports",
      },
      {
        label: "Incidents",
        href: "/observer/incidents",
        icon: "!",
        key: "incidents",
      },
      {
        label: "Evidence",
        href: "/observer/evidence",
        icon: "◇",
        key: "evidence",
      },
    ],
  },

  {
    section: "ELECTION MONITORING",
    items: [
      {
        label: "Live Election Monitor",
        href: "/observer/results",
        icon: "◉",
        key: "results",
      },
      {
        label: "EC8 Observation",
        href: "/observer/ec8",
        icon: "✓",
        key: "ec8",
      },
      {
        label: "AI Election Analyzer",
        href: "/observer/ai-analyzer",
        icon: "✦",
        key: "ai-analyzer",
      },
      {
        label: "Analytics",
        href: "/observer/analytics",
        icon: "◫",
        key: "analytics",
      },
    ],
  },

  {
    section: "MANAGEMENT",
    items: [
      {
        label: "Calendar",
        href: "/observer/calendar",
        icon: "□",
        key: "calendar",
      },
      {
        label: "Reminders",
        href: "/observer/reminders",
        icon: "✓",
        key: "reminders",
      },
      {
        label: "Notifications",
        href: "/observer/notifications",
        icon: "♧",
        key: "notifications",
      },
      {
        label: "Complaints & Reports",
        href: "/observer/complaints",
        icon: "!",
        key: "complaints",
      },
    ],
  },

  {
    section: "ACCOUNT",
    items: [
      {
        label: "Organization Profile",
        href: "/observer/profile",
        icon: "♙",
        key: "profile",
      },
      {
        label: "Privacy & Security",
        href: "/settings/security",
        icon: "♢",
        key: "security",
      },
    ],
  },
];

/* ============================================================
   TEMPORARY PRESENTATION DATA
============================================================ */

const observerMetrics = [
  {
    label: "Observation Coverage",
    value: "92.7%",
    change: "+4.6%",
    icon: "⌖",
  },
  {
    label: "Observers Deployed",
    value: "8,426",
    change: "+184",
    icon: "♙",
  },
  {
    label: "Polling Stations",
    value: "31,284",
    change: "94.2% covered",
    icon: "▣",
  },
  {
    label: "Reports Received",
    value: "18,642",
    change: "+526",
    icon: "▤",
  },
];

const regionalObservation = [
  {
    name: "Greater Accra",
    score: 96,
    change: "+3.8%",
  },
  {
    name: "Ashanti",
    score: 94,
    change: "+4.4%",
  },
  {
    name: "Eastern",
    score: 91,
    change: "+2.7%",
  },
  {
    name: "Bono East",
    score: 89,
    change: "+5.2%",
  },
  {
    name: "Northern",
    score: 84,
    change: "+3.1%",
  },
];

const observationCategories = [
  {
    label: "Polling Process",
    value: "94%",
  },
  {
    label: "Opening Procedures",
    value: "91%",
  },
  {
    label: "Voting Process",
    value: "96%",
  },
  {
    label: "Closing Procedures",
    value: "88%",
  },
];

const reminders = [
  {
    id: "observer-reminder-1",
    title: "National observation briefing",
    description:
      "Review national observation priorities and field deployment.",
    date: new Date().toISOString(),
    time: "08:30 AM",
    completed: false,
  },
  {
    id: "observer-reminder-2",
    title: "Regional report review",
    description:
      "Review newly submitted regional observation reports.",
    date: new Date().toISOString(),
    time: "11:30 AM",
    completed: false,
  },
  {
    id: "observer-reminder-3",
    title: "Incident review",
    description:
      "Review outstanding field incidents.",
    date: new Date(
      Date.now() + 86400000
    ).toISOString(),
    time: "10:00 AM",
    completed: false,
  },
];

const notifications = [
  {
    id: "observer-notification-1",
    type: "report",
    title: "New observation report",
    message:
      "A regional observation team submitted a report.",
    createdAt: new Date(
      Date.now() - 6 * 60000
    ).toISOString(),
    read: false,
  },
  {
    id: "observer-notification-2",
    type: "incident",
    title: "Incident submitted",
    message:
      "A field observer submitted an incident for review.",
    createdAt: new Date(
      Date.now() - 27 * 60000
    ).toISOString(),
    read: false,
  },
  {
    id: "observer-notification-3",
    type: "security",
    title: "Security activity",
    message:
      "Review recent organizational account sessions.",
    createdAt: new Date(
      Date.now() - 2 * 3600000
    ).toISOString(),
    read: true,
  },
];

/* ============================================================
   PAGE
============================================================ */

export default function ObserverDashboard() {
  const [activeSection, setActiveSection] =
    useState("overview");

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  return (
    <DashboardShell
      role="observer"
      navigation={observerNavigation}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      mobileMenuOpen={mobileMenuOpen}
      onMobileMenuClose={() =>
        setMobileMenuOpen(false)
      }
    >
      <main className="observer-page">

        {/* ==================================================
            HERO
        ================================================== */}

        <section className="observer-hero">

          <div className="hero-content">

            <span className="hero-label">
              ELECTION OBSERVATION COMMAND CENTER
            </span>

            <h1>
              National Observation
              <br />
              Intelligence Center
            </h1>

            <p>
              Coordinate independent election
              observation, monitor field activity,
              document incidents and analyze
              election information through one
              secure platform.
            </p>

            <div className="hero-badges">

              <span>
                ● Observation Active
              </span>

              <span>
                16 Regions
              </span>

              <span>
                276 Constituencies
              </span>

              <span>
                Evidence Protected
              </span>

            </div>

          </div>

          <div className="hero-emblem">

            <div className="emblem-ring">

              <div className="emblem-inner">
                OB
              </div>

            </div>

            <span>
              POLISYNC AFRICA
            </span>

          </div>

        </section>

        {/* ==================================================
            KPI METRICS
        ================================================== */}

        <section className="metrics-grid">

          {observerMetrics.map(
            (metric) => (
              <div
                className="metric-card"
                key={metric.label}
              >

                <div className="metric-icon">
                  {metric.icon}
                </div>

                <div>

                  <span>
                    {metric.label}
                  </span>

                  <strong>
                    {metric.value}
                  </strong>

                  <small>
                    ↗ {metric.change}
                  </small>

                </div>

              </div>
            )
          )}

        </section>

        {/* ==================================================
            MAIN DASHBOARD
        ================================================== */}

        <section className="dashboard-grid">

          {/* ==================================================
              OBSERVATION COVERAGE
          ================================================== */}

          <div className="panel coverage-panel">

            <PanelHeader
              label="NATIONAL OBSERVATION"
              title="Observation Coverage"
              subtitle="Current field observation readiness"
            />

            <div className="coverage-content">

              <div className="score-area">

                <div className="score-ring">

                  <div>

                    <strong>
                      92.7%
                    </strong>

                    <span>
                      Coverage Index
                    </span>

                  </div>

                </div>

                <div className="score-details">

                  <strong>
                    +4.6%
                  </strong>

                  <span>
                    improvement this month
                  </span>

                  <p>
                    Observer deployment and
                    reporting coverage are
                    increasing across the
                    observation network.
                  </p>

                </div>

              </div>

              <div className="coverage-bars">

                <ProgressRow
                  label="Observer Deployment"
                  value={94}
                />

                <ProgressRow
                  label="Polling Coverage"
                  value={92}
                />

                <ProgressRow
                  label="Report Submission"
                  value={89}
                />

                <ProgressRow
                  label="Evidence Capture"
                  value={87}
                />

              </div>

            </div>

          </div>

          {/* ==================================================
              REGIONAL OBSERVATION
          ================================================== */}

          <div className="panel regional-panel">

            <PanelHeader
              label="REGIONAL OBSERVATION"
              title="Regional Coverage"
              subtitle="Observation network performance"
              action="View all"
            />

            <div className="regional-list">

              {regionalObservation.map(
                (region, index) => (
                  <div
                    className="regional-row"
                    key={region.name}
                  >

                    <div className="region-number">
                      {String(
                        index + 1
                      ).padStart(2, "0")}
                    </div>

                    <div className="region-details">

                      <strong>
                        {region.name}
                      </strong>

                      <div className="region-track">

                        <span
                          style={{
                            width:
                              `${region.score}%`,
                          }}
                        />

                      </div>

                    </div>

                    <div className="region-score">

                      <strong>
                        {region.score}%
                      </strong>

                      <small>
                        {region.change}
                      </small>

                    </div>

                  </div>
                )
              )}

            </div>

          </div>

          {/* ==================================================
              OBSERVATION QUALITY
          ================================================== */}

          <div className="panel quality-panel">

            <PanelHeader
              label="OBSERVATION QUALITY"
              title="Process Monitoring"
              subtitle="Observation category indicators"
            />

            <div className="quality-list">

              {observationCategories.map(
                (item) => (
                  <div
                    className="quality-row"
                    key={item.label}
                  >

                    <div className="quality-icon">
                      ✓
                    </div>

                    <div className="quality-details">

                      <strong>
                        {item.label}
                      </strong>

                      <div className="quality-track">

                        <span
                          style={{
                            width:
                              item.value,
                          }}
                        />

                      </div>

                    </div>

                    <strong className="quality-value">
                      {item.value}
                    </strong>

                  </div>
                )
              )}

            </div>

          </div>

          {/* ==================================================
              INCIDENT MONITOR
          ================================================== */}

          <div className="panel incident-panel">

            <PanelHeader
              label="FIELD INTEGRITY"
              title="Incident Monitor"
              subtitle="Current field reports"
            />

            <div className="incident-summary">

              <IncidentMetric
                icon="!"
                value="42"
                label="Open"
                level="high"
              />

              <IncidentMetric
                icon="◷"
                value="18"
                label="Reviewing"
                level="medium"
              />

              <IncidentMetric
                icon="✓"
                value="286"
                label="Resolved"
                level="resolved"
              />

            </div>

            <div className="incident-status">

              <div>

                <span>
                  Resolution rate
                </span>

                <strong>
                  87.2%
                </strong>

              </div>

              <div className="incident-track">

                <span
                  style={{
                    width: "87.2%",
                  }}
                />

              </div>

            </div>

            <button
              type="button"
              className="dark-button"
            >
              Open Incident Center
            </button>

          </div>

          {/* ==================================================
              AI ANALYZER
          ================================================== */}

          <div className="panel ai-panel">

            <div className="ai-heading">

              <div className="ai-symbol">
                ✦
              </div>

              <div>

                <span>
                  POLISYNC AI
                </span>

                <h2>
                  AI Election Analyzer
                </h2>

                <p>
                  General-purpose AI and
                  observation intelligence.
                </p>

              </div>

            </div>

            <AIAnalyzer />

          </div>

          {/* ==================================================
              WEATHER
          ================================================== */}

          <WeatherCard />

          {/* ==================================================
              REMINDERS
          ================================================== */}

          <RemindersPanel
            initialReminders={reminders}
          />

          {/* ==================================================
              AI PERSONAL ASSISTANT
          ================================================== */}

          <AIPersonalAssistant />

          {/* ==================================================
              OBSERVER DEPLOYMENT
          ================================================== */}

          <div className="panel deployment-panel">

            <PanelHeader
              label="FIELD DEPLOYMENT"
              title="Observer Network"
              subtitle="National deployment status"
            />

            <div className="deployment-grid">

              <DeploymentMetric
                icon="♙"
                value="8,426"
                label="Observers"
              />

              <DeploymentMetric
                icon="⌖"
                value="16"
                label="Regions"
              />

              <DeploymentMetric
                icon="▦"
                value="276"
                label="Constituencies"
              />

              <DeploymentMetric
                icon="▣"
                value="31,284"
                label="Stations"
              />

            </div>

            <div className="deployment-status">

              <span>
                ● Observation network operational
              </span>

              <strong>
                92.7%
              </strong>

            </div>

          </div>

          {/* ==================================================
              NOTIFICATIONS
          ================================================== */}

          <NotificationsPanel
            initialNotifications={
              notifications
            }
          />

          {/* ==================================================
              AI PRIORITIES
          ================================================== */}

          <div className="panel priorities-panel">

            <PanelHeader
              label="AI RECOMMENDATIONS"
              title="Observation Priorities"
              subtitle="Areas requiring attention"
            />

            <PriorityItem
              number="01"
              title="Increase observer coverage"
              description="Several polling areas require additional observation resources."
              priority="High"
            />

            <PriorityItem
              number="02"
              title="Review unresolved incidents"
              description="Open incidents require timely review and documentation."
              priority="High"
            />

            <PriorityItem
              number="03"
              title="Strengthen evidence capture"
              description="Additional documentation may improve observation completeness."
              priority="Medium"
            />

          </div>

          {/* ==================================================
              PRIVACY
          ================================================== */}

          <PrivacySecurityPanel />

        </section>

      </main>

      {/* ======================================================
          STYLES
      ====================================================== */}

      <style jsx>{`

        .observer-page {
          min-height: 100vh;
          padding: 20px;
          background:
            radial-gradient(
              circle at 85% 5%,
              rgba(
                15,
                87,
                108,
                0.08
              ),
              transparent 30%
            ),
            #f5f7f8;
          color: #20272b;
        }

        /* ==================================================
           HERO
        ================================================== */

        .observer-hero {
          position: relative;
          max-width: 1550px;
          min-height: 245px;
          margin: 0 auto 13px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
          overflow: hidden;
          padding: 32px;
          box-sizing: border-box;
          border: 1px solid
            rgba(
              201,
              162,
              39,
              0.8
            );
          border-radius: 18px;
          background:
            linear-gradient(
              125deg,
              #082d3a 0%,
              #0d596c 48%,
              #101c21 100%
            );
          color: #ffffff;
          box-shadow:
            0 18px 45px
              rgba(
                15,
                55,
                70,
                0.15
              );
        }

        .observer-hero::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              105deg,
              transparent 35%,
              rgba(
                255,
                255,
                255,
                0.055
              ) 50%,
              transparent 65%
            );
          animation:
            heroShine 7s
            ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes heroShine {

          0% {
            transform:
              translateX(-80%);
          }

          55%,
          100% {
            transform:
              translateX(80%);
          }

        }

        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 790px;
        }

        .hero-label {
          color: #e6c85a;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .hero-content h1 {
          margin: 7px 0;
          font-size: 31px;
          line-height: 1.05;
          font-weight: 900;
          letter-spacing: -0.8px;
        }

        .hero-content p {
          max-width: 680px;
          margin: 10px 0 0;
          color:
            rgba(
              255,
              255,
              255,
              0.78
            );
          font-size: 11px;
          line-height: 1.65;
        }

        .hero-badges {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
          margin-top: 16px;
        }

        .hero-badges span {
          padding: 7px 9px;
          border: 1px solid
            rgba(
              230,
              200,
              90,
              0.55
            );
          border-radius: 999px;
          background:
            rgba(
              0,
              0,
              0,
              0.16
            );
          color: #ffffff;
          font-size: 7px;
          font-weight: 750;
        }

        .hero-emblem {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          min-width: 180px;
        }

        .emblem-ring {
          width: 130px;
          height: 130px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid
            rgba(
              230,
              200,
              90,
              0.9
            );
          border-radius: 50%;
          box-shadow:
            0 0 0 8px
              rgba(
                230,
                200,
                90,
                0.06
              ),
            0 0 30px
              rgba(
                230,
                200,
                90,
                0.12
              );
        }

        .emblem-inner {
          width: 96px;
          height: 96px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.25
            );
          border-radius: 50%;
          background:
            rgba(
              0,
              0,
              0,
              0.17
            );
          color: #e6c85a;
          font-size: 27px;
          font-weight: 900;
        }

        .hero-emblem > span {
          margin-top: 9px;
          color:
            rgba(
              255,
              255,
              255,
              0.65
            );
          font-size: 7px;
          font-weight: 800;
          letter-spacing: 1.4px;
        }

        /* ==================================================
           METRICS
        ================================================== */

        .metrics-grid {
          max-width: 1550px;
          margin: 0 auto 13px;
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 10px;
        }

        .metric-card,
        .panel {
          position: relative;
          overflow: hidden;
        }

        .metric-card {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 14px;
          border: 1px solid
            rgba(
              201,
              162,
              39,
              0.55
            );
          border-radius: 13px;
          background: #ffffff;
          box-shadow:
            0 5px 17px
              rgba(
                20,
                40,
                45,
                0.04
              );
          transition:
            transform 0.22s ease,
            box-shadow 0.22s ease;
        }

        .metric-card::before,
        .panel::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 70%;
          height: 1px;
          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(
                255,
                215,
                100,
                0.95
              ),
              transparent
            );
          animation:
            borderShine 8s
            linear infinite;
          pointer-events: none;
        }

        @keyframes borderShine {

          0% {
            left: -70%;
          }

          35%,
          100% {
            left: 110%;
          }

        }

        .metric-card:hover {
          transform:
            translateY(-2px);
          box-shadow:
            0 10px 25px
              rgba(
                20,
                40,
                45,
                0.08
              );
        }

        .metric-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 11px;
          background: #e9f3f6;
          color: #0d596c;
          font-size: 17px;
        }

        .metric-card span {
          display: block;
          color: #8c9590;
          font-size: 8px;
        }

        .metric-card strong {
          display: block;
          margin-top: 3px;
          color: #0b5264;
          font-size: 19px;
          font-weight: 900;
        }

        .metric-card small {
          display: block;
          margin-top: 2px;
          color: #087532;
          font-size: 7px;
          font-weight: 800;
        }

        /* ==================================================
           GRID
        ================================================== */

        .dashboard-grid {
          max-width: 1550px;
          margin: 0 auto;
          display: grid;
          grid-template-columns:
            repeat(
              3,
              minmax(0, 1fr)
            );
          gap: 12px;
        }

        .panel {
          min-width: 0;
          padding: 16px;
          border: 1px solid
            rgba(
              201,
              162,
              39,
              0.55
            );
          border-radius: 14px;
          background: #ffffff;
          box-shadow:
            0 5px 18px
              rgba(
                20,
                40,
                45,
                0.035
              );
        }

        .coverage-panel,
        .ai-panel,
        .deployment-panel,
        .priorities-panel {
          grid-column: span 2;
        }

        .ai-panel {
          background:
            linear-gradient(
              145deg,
              #081217,
              #0c3440
            );
          color: #ffffff;
          border-color:
            rgba(
              201,
              162,
              39,
              0.8
            );
        }

        /* ==================================================
           PANEL HEADER
        ================================================== */

        :global(.panel-header) {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 14px;
        }

        :global(.panel-header-label) {
          display: block;
          color: #c9a227;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        :global(.panel-header h2) {
          margin: 3px 0;
          color: #2d393d;
          font-size: 14px;
          font-weight: 900;
        }

        :global(.panel-header p) {
          margin: 0;
          color: #929b95;
          font-size: 8px;
        }

        :global(.panel-header-action) {
          padding: 6px 9px;
          border: 1px solid #dce5df;
          border-radius: 7px;
          background: #ffffff;
          color: #0d596c;
          font-size: 7px;
          font-weight: 800;
        }

        /* ==================================================
           COVERAGE
        ================================================== */

        .coverage-content {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 25px;
          align-items: center;
        }

        .score-area {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .score-ring {
          width: 132px;
          height: 132px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 50%;
          background:
            conic-gradient(
              #0d596c 0 92.7%,
              #e8ebeb 92.7% 100%
            );
        }

        .score-ring > div {
          width: 96px;
          height: 96px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          border-radius: 50%;
          background: #ffffff;
        }

        .score-ring strong {
          color: #0b5264;
          font-size: 21px;
          font-weight: 900;
        }

        .score-ring span {
          margin-top: 3px;
          color: #929b95;
          font-size: 7px;
        }

        .score-details > strong {
          color: #078037;
          font-size: 17px;
        }

        .score-details > span {
          display: block;
          margin-top: 2px;
          color: #929b95;
          font-size: 7px;
        }

        .score-details p {
          max-width: 200px;
          margin: 8px 0 0;
          color: #7d8780;
          font-size: 8px;
          line-height: 1.5;
        }

        .coverage-bars {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        .progress-row {
          display: grid;
          grid-template-columns:
            115px 1fr 35px;
          align-items: center;
          gap: 8px;
        }

        .progress-row label {
          color: #707a73;
          font-size: 7px;
        }

        .progress-track {
          height: 6px;
          overflow: hidden;
          border-radius: 999px;
          background: #edf0ee;
        }

        .progress-track span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background:
            linear-gradient(
              90deg,
              #0d596c,
              #c9a227
            );
        }

        .progress-row strong {
          color: #465149;
          font-size: 7px;
          text-align: right;
        }

        /* ==================================================
           REGIONAL
        ================================================== */

        .regional-list {
          display: flex;
          flex-direction: column;
        }

        .regional-row {
          display: grid;
          grid-template-columns:
            25px 1fr 45px;
          align-items: center;
          gap: 8px;
          padding: 9px 0;
          border-bottom: 1px solid #edf1ee;
        }

        .region-number {
          color: #c9a227;
          font-size: 7px;
          font-weight: 900;
        }

        .region-details strong {
          color: #4a5559;
          font-size: 8px;
        }

        .region-track {
          height: 4px;
          margin-top: 5px;
          overflow: hidden;
          border-radius: 999px;
          background: #edf1ee;
        }

        .region-track span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: #0d596c;
        }

        .region-score {
          text-align: right;
        }

        .region-score strong {
          display: block;
          color: #0b5264;
          font-size: 9px;
        }

        .region-score small {
          display: block;
          margin-top: 2px;
          color: #078037;
          font-size: 7px;
          font-weight: 800;
        }

        /* ==================================================
           QUALITY
        ================================================== */

        .quality-list {
          display: flex;
          flex-direction: column;
        }

        .quality-row {
          display: grid;
          grid-template-columns:
            28px 1fr 38px;
          align-items: center;
          gap: 8px;
          padding: 10px 0;
          border-bottom: 1px solid #edf1ee;
        }

        .quality-icon {
          width: 25px;
          height: 25px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 7px;
          background: #e9f3f6;
          color: #0d596c;
          font-size: 9px;
          font-weight: 900;
        }

        .quality-details strong {
          color: #4b565a;
          font-size: 8px;
        }

        .quality-track {
          height: 4px;
          margin-top: 5px;
          overflow: hidden;
          border-radius: 999px;
          background: #edf1ee;
        }

        .quality-track span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background:
            linear-gradient(
              90deg,
              #0d596c,
              #2e899d
            );
        }

        .quality-value {
          color: #0b5264;
          font-size: 8px;
          text-align: right;
        }

        /* ==================================================
           INCIDENTS
        ================================================== */

        .incident-summary {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 8px;
        }

        .incident-metric {
          padding: 12px 8px;
          border-radius: 9px;
          background: #f7f9f9;
          text-align: center;
        }

        .incident-icon {
          font-size: 14px;
          font-weight: 900;
        }

        .incident-metric.high
          .incident-icon {
          color: #a00000;
        }

        .incident-metric.medium
          .incident-icon {
          color: #a27400;
        }

        .incident-metric.resolved
          .incident-icon {
          color: #087532;
        }

        .incident-metric strong {
          display: block;
          margin-top: 4px;
          color: #334046;
          font-size: 18px;
        }

        .incident-metric span {
          display: block;
          margin-top: 2px;
          color: #929b95;
          font-size: 7px;
        }

        .incident-status {
          margin-top: 15px;
        }

        .incident-status > div:first-child {
          display: flex;
          justify-content: space-between;
        }

        .incident-status span {
          color: #8c9690;
          font-size: 7px;
        }

        .incident-status strong {
          color: #0b5264;
          font-size: 8px;
        }

        .incident-track {
          height: 6px;
          margin-top: 6px;
          overflow: hidden;
          border-radius: 999px;
          background: #e9ecec;
        }

        .incident-track span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background:
            linear-gradient(
              90deg,
              #0d596c,
              #c9a227
            );
        }

        .dark-button {
          width: 100%;
          margin-top: 14px;
          padding: 10px;
          border: 1px solid
            rgba(
              201,
              162,
              39,
              0.72
            );
          border-radius: 8px;
          background: #07191f;
          color: #ffffff;
          font-size: 8px;
          font-weight: 800;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .dark-button:hover {
          transform:
            translateY(-1px);
          box-shadow:
            0 8px 18px
              rgba(
                7,
                55,
                70,
                0.2
              );
        }

        /* ==================================================
           AI
        ================================================== */

        .ai-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 13px;
        }

        .ai-symbol {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid
            rgba(
              230,
              200,
              90,
              0.6
            );
          border-radius: 10px;
          background:
            rgba(
              201,
              162,
              39,
              0.08
            );
          color: #e6c85a;
          font-size: 18px;
        }

        .ai-heading span {
          color: #e6c85a;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .ai-heading h2 {
          margin: 3px 0;
          color: #ffffff;
          font-size: 15px;
        }

        .ai-heading p {
          margin: 0;
          color:
            rgba(
              255,
              255,
              255,
              0.55
            );
          font-size: 8px;
        }

        /* ==================================================
           DEPLOYMENT
        ================================================== */

        .deployment-grid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 8px;
        }

        .deployment-metric {
          padding: 13px 8px;
          border-radius: 10px;
          background: #f4f8f9;
          text-align: center;
        }

        .deployment-metric-icon {
          color: #0d596c;
          font-size: 15px;
        }

        .deployment-metric strong {
          display: block;
          margin-top: 5px;
          color: #0b5264;
          font-size: 17px;
          font-weight: 900;
        }

        .deployment-metric span {
          display: block;
          margin-top: 2px;
          color: #89928c;
          font-size: 7px;
        }

        .deployment-status {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 11px;
          padding-top: 10px;
          border-top: 1px solid #edf1ee;
        }

        .deployment-status span {
          color: #078037;
          font-size: 8px;
          font-weight: 750;
        }

        .deployment-status strong {
          color: #0b5264;
          font-size: 12px;
        }

        /* ==================================================
           PRIORITIES
        ================================================== */

        .priority-item {
          display: grid;
          grid-template-columns:
            30px 1fr auto;
          gap: 9px;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #edf1ee;
        }

        .priority-number {
          width: 25px;
          height: 25px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 7px;
          background: #e9f3f6;
          color: #0d596c;
          font-size: 7px;
          font-weight: 900;
        }

        .priority-content strong {
          display: block;
          color: #455156;
          font-size: 8px;
        }

        .priority-content p {
          margin: 3px 0 0;
          color: #939c96;
          font-size: 7px;
          line-height: 1.4;
        }

        .priority-level {
          padding: 5px 7px;
          border-radius: 999px;
          background: #fff5e5;
          color: #9a6c00;
          font-size: 6px;
          font-weight: 900;
          text-transform: uppercase;
        }

        /* ==================================================
           RESPONSIVE
        ================================================== */

        @media (max-width: 1100px) {

          .metrics-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .dashboard-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );
          }

          .coverage-panel,
          .ai-panel,
          .deployment-panel,
          .priorities-panel {
            grid-column: span 2;
          }

        }

        @media (max-width: 760px) {

          .observer-page {
            padding: 12px;
          }

          .observer-hero {
            min-height: auto;
            padding: 23px;
          }

          .hero-content h1 {
            font-size: 25px;
          }

          .hero-emblem {
            display: none;
          }

          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          .coverage-panel,
          .ai-panel,
          .deployment-panel,
          .priorities-panel {
            grid-column: span 1;
          }

          .coverage-content {
            grid-template-columns: 1fr;
          }

          .deployment-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

        }

        @media (max-width: 500px) {

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .observer-hero {
            border-radius: 13px;
          }

          .hero-content h1 {
            font-size: 22px;
          }

          .hero-content p {
            font-size: 9px;
          }

          .score-area {
            align-items: flex-start;
            flex-direction: column;
          }

          .score-ring {
            width: 115px;
            height: 115px;
          }

          .score-ring > div {
            width: 84px;
            height: 84px;
          }

          .progress-row {
            grid-template-columns:
              100px 1fr 30px;
          }

          .priority-item {
            grid-template-columns:
              27px 1fr;
          }

          .priority-level {
            grid-column: 2;
            justify-self: start;
          }

        }

        @media (
          prefers-reduced-motion: reduce
        ) {

          .observer-hero::before,
          .metric-card::before,
          .panel::before {
            animation: none;
          }

          .metric-card,
          .dark-button {
            transition: none;
          }

        }

      `}</style>

    </DashboardShell>
  );
}

/* ============================================================
   PANEL HEADER
============================================================ */

function PanelHeader({
  label,
  title,
  subtitle,
  action,
}) {
  return (
    <div className="panel-header">

      <div>

        <span className="panel-header-label">
          {label}
        </span>

        <h2>
          {title}
        </h2>

        {subtitle && (
          <p>
            {subtitle}
          </p>
        )}

      </div>

      {action && (
        <button
          type="button"
          className="panel-header-action"
        >
          {action}
        </button>
      )}

    </div>
  );
}

/* ============================================================
   PROGRESS ROW
============================================================ */

function ProgressRow({
  label,
  value,
}) {
  return (
    <div className="progress-row">

      <label>
        {label}
      </label>

      <div className="progress-track">

        <span
          style={{
            width: `${value}%`,
          }}
        />

      </div>

      <strong>
        {value}%
      </strong>

    </div>
  );
}

/* ============================================================
   INCIDENT METRIC
============================================================ */

function IncidentMetric({
  icon,
  value,
  label,
  level,
}) {
  return (
    <div
      className={`incident-metric ${level}`}
    >

      <div className="incident-icon">
        {icon}
      </div>

      <strong>
        {value}
      </strong>

      <span>
        {label}
      </span>

    </div>
  );
}

/* ============================================================
   DEPLOYMENT METRIC
============================================================ */

function DeploymentMetric({
  icon,
  value,
  label,
}) {
  return (
    <div className="deployment-metric">

      <div className="deployment-metric-icon">
        {icon}
      </div>

      <strong>
        {value}
      </strong>

      <span>
        {label}
      </span>

    </div>
  );
}

/* ============================================================
   PRIORITY ITEM
============================================================ */

function PriorityItem({
  number,
  title,
  description,
  priority,
}) {
  return (
    <div className="priority-item">

      <div className="priority-number">
        {number}
      </div>

      <div className="priority-content">

        <strong>
          {title}
        </strong>

        <p>
          {description}
        </p>

      </div>

      <span className="priority-level">
        {priority}
      </span>

    </div>
  );
}
