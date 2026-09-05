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
   POLITICAL PARTY NAVIGATION
============================================================ */

const partyNavigation = [
  {
    section: "PARTY COMMAND",
    items: [
      {
        label: "Dashboard",
        href: "/party",
        icon: "⌂",
        key: "overview",
      },
      {
        label: "National Command",
        href: "/party/national",
        icon: "◎",
        key: "national",
      },
      {
        label: "Regional Administration",
        href: "/party/regions",
        icon: "⌖",
        key: "regions",
      },
      {
        label: "Constituencies",
        href: "/party/constituencies",
        icon: "▦",
        key: "constituencies",
      },
      {
        label: "Polling Stations",
        href: "/party/polling-stations",
        icon: "▣",
        key: "polling-stations",
      },
    ],
  },

  {
    section: "PARTY OPERATIONS",
    items: [
      {
        label: "Members",
        href: "/party/members",
        icon: "♙",
        key: "members",
      },
      {
        label: "Party Administrators",
        href: "/party/administrators",
        icon: "♚",
        key: "administrators",
      },
      {
        label: "Polling Agents",
        href: "/party/polling-agents",
        icon: "♟",
        key: "agents",
      },
      {
        label: "Candidates",
        href: "/party/candidates",
        icon: "★",
        key: "candidates",
      },
      {
        label: "Field Operations",
        href: "/party/field",
        icon: "⌁",
        key: "field",
      },
    ],
  },

  {
    section: "ELECTION MANAGEMENT",
    items: [
      {
        label: "Live Results",
        href: "/party/results",
        icon: "▤",
        key: "results",
      },
      {
        label: "EC8 Results",
        href: "/party/ec8",
        icon: "✓",
        key: "ec8",
      },
      {
        label: "Election Analyzer",
        href: "/party/ai-analyzer",
        icon: "✦",
        key: "ai-analyzer",
      },
      {
        label: "Analytics",
        href: "/party/analytics",
        icon: "◫",
        key: "analytics",
      },
      {
        label: "Reports",
        href: "/party/reports",
        icon: "▥",
        key: "reports",
      },
    ],
  },

  {
    section: "MANAGEMENT",
    items: [
      {
        label: "Communications",
        href: "/party/communications",
        icon: "◈",
        key: "communications",
      },
      {
        label: "Calendar",
        href: "/party/calendar",
        icon: "□",
        key: "calendar",
      },
      {
        label: "Finance",
        href: "/party/finance",
        icon: "₵",
        key: "finance",
      },
      {
        label: "Complaints",
        href: "/party/complaints",
        icon: "!",
        key: "complaints",
      },
      {
        label: "Reminders",
        href: "/party/reminders",
        icon: "✓",
        key: "reminders",
      },
      {
        label: "Notifications",
        href: "/party/notifications",
        icon: "♧",
        key: "notifications",
      },
    ],
  },

  {
    section: "ACCOUNT",
    items: [
      {
        label: "Organization Profile",
        href: "/party/profile",
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
   TEMPORARY DASHBOARD DATA
   This is presentation data only.
   Live database/API integration comes later.
============================================================ */

const partyMetrics = [
  {
    label: "Party Membership",
    value: "482,640",
    change: "+4.8%",
    icon: "♙",
  },
  {
    label: "Active Regions",
    value: "16 / 16",
    change: "100%",
    icon: "⌖",
  },
  {
    label: "Constituencies",
    value: "276",
    change: "All mapped",
    icon: "▦",
  },
  {
    label: "Polling Network",
    value: "38,622",
    change: "+1,240",
    icon: "▣",
  },
];

const regionalPerformance = [
  {
    name: "Greater Accra",
    score: 78,
    change: "+5.4%",
  },
  {
    name: "Ashanti",
    score: 73,
    change: "+4.1%",
  },
  {
    name: "Eastern",
    score: 69,
    change: "+3.7%",
  },
  {
    name: "Bono East",
    score: 66,
    change: "+6.2%",
  },
  {
    name: "Northern",
    score: 61,
    change: "+2.9%",
  },
];

const operations = [
  {
    icon: "♙",
    value: "482,640",
    label: "Members",
  },
  {
    icon: "♚",
    value: "16",
    label: "Regional Teams",
  },
  {
    icon: "♟",
    value: "38,622",
    label: "Polling Agents",
  },
  {
    icon: "▤",
    value: "24,842",
    label: "Reports",
  },
];

const reminders = [
  {
    id: "party-reminder-1",
    title: "National executive briefing",
    description:
      "Review national field and regional performance.",
    date: new Date().toISOString(),
    time: "09:00 AM",
    completed: false,
  },
  {
    id: "party-reminder-2",
    title: "Regional administrators meeting",
    description:
      "Review regional operational updates.",
    date: new Date().toISOString(),
    time: "12:00 PM",
    completed: false,
  },
  {
    id: "party-reminder-3",
    title: "Election results readiness review",
    description:
      "Review polling station reporting readiness.",
    date: new Date(
      Date.now() + 86400000
    ).toISOString(),
    time: "10:30 AM",
    completed: false,
  },
];

const notifications = [
  {
    id: "party-notification-1",
    type: "result",
    title: "New election report",
    message:
      "New polling station information is available.",
    createdAt: new Date(
      Date.now() - 5 * 60000
    ).toISOString(),
    read: false,
  },
  {
    id: "party-notification-2",
    type: "report",
    title: "Regional report received",
    message:
      "A regional administrator submitted a report.",
    createdAt: new Date(
      Date.now() - 34 * 60000
    ).toISOString(),
    read: false,
  },
  {
    id: "party-notification-3",
    type: "security",
    title: "Security activity",
    message:
      "Review recent account sessions.",
    createdAt: new Date(
      Date.now() - 2 * 3600000
    ).toISOString(),
    read: true,
  },
];

/* ============================================================
   PAGE
============================================================ */

export default function PoliticalPartyDashboard() {
  const [activeSection, setActiveSection] =
    useState("overview");

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  return (
    <DashboardShell
      role="party"
      navigation={partyNavigation}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      mobileMenuOpen={mobileMenuOpen}
      onMobileMenuClose={() =>
        setMobileMenuOpen(false)
      }
    >
      <main className="party-page">

        {/* ==================================================
            PARTY HERO
        ================================================== */}

        <section className="party-hero">

          <div className="hero-content">

            <span className="hero-label">
              POLITICAL PARTY COMMAND CENTER
            </span>

            <h1>
              National Party
              <br />
              Operations Center
            </h1>

            <p>
              Coordinate national, regional,
              constituency and polling-station
              operations through one secure
              PoliSync command center.
            </p>

            <div className="hero-badges">

              <span>
                ● Organization Active
              </span>

              <span>
                16 Regions
              </span>

              <span>
                276 Constituencies
              </span>

              <span>
                38,622 Polling Stations
              </span>

            </div>

          </div>

          <div className="hero-emblem">

            <div className="emblem-ring">

              <div className="emblem-inner">
                PS
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

          {partyMetrics.map(
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
            DASHBOARD GRID
        ================================================== */}

        <section className="dashboard-grid">

          {/* ==================================================
              NATIONAL OPERATIONS
          ================================================== */}

          <div className="panel operations-overview">

            <PanelHeader
              label="NATIONAL OPERATIONS"
              title="Party Performance"
              subtitle="Current organizational readiness"
            />

            <div className="operations-content">

              <div className="organization-score">

                <div className="score-ring">

                  <div>

                    <strong>
                      76.4%
                    </strong>

                    <span>
                      Readiness Index
                    </span>

                  </div>

                </div>

                <div className="score-info">

                  <strong>
                    +6.8%
                  </strong>

                  <span>
                    improvement this month
                  </span>

                  <p>
                    Party field operations,
                    regional coverage and polling
                    network readiness continue to
                    improve.
                  </p>

                </div>

              </div>

              <div className="readiness-bars">

                <ProgressRow
                  label="Regional Coverage"
                  value={100}
                />

                <ProgressRow
                  label="Constituency Coverage"
                  value={94}
                />

                <ProgressRow
                  label="Polling Agent Deployment"
                  value={88}
                />

                <ProgressRow
                  label="Reporting Readiness"
                  value={82}
                />

              </div>

            </div>

          </div>

          {/* ==================================================
              REGIONAL PERFORMANCE
          ================================================== */}

          <div className="panel regional-panel">

            <PanelHeader
              label="REGIONAL PERFORMANCE"
              title="Regional Activity"
              subtitle="Compare party operations"
              action="View all"
            />

            <div className="regional-list">

              {regionalPerformance.map(
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
              PARTY ORGANIZATIONAL HIERARCHY
          ================================================== */}

          <div className="panel hierarchy-panel">

            <PanelHeader
              label="ORGANIZATIONAL STRUCTURE"
              title="Party Administration"
              subtitle="Your approved operational hierarchy"
            />

            <div className="hierarchy-map">

              <HierarchyNode
                icon="♚"
                title="National Admin"
                count="1"
              />

              <div className="hierarchy-line">
                ↓
              </div>

              <HierarchyNode
                icon="◎"
                title="Regional Admins"
                count="16"
              />

              <div className="hierarchy-line">
                ↓
              </div>

              <HierarchyNode
                icon="⌖"
                title="Constituency Admins"
                count="276"
              />

              <div className="hierarchy-line">
                ↓
              </div>

              <HierarchyNode
                icon="♟"
                title="Polling Agents"
                count="38,622"
              />

            </div>

          </div>

          {/* ==================================================
              ELECTION RESULTS
          ================================================== */}

          <div className="panel results-panel">

            <PanelHeader
              label="ELECTION OPERATIONS"
              title="Results Network"
              subtitle="Current reporting readiness"
            />

            <div className="results-grid">

              <ResultMetric
                label="Reports Received"
                value="24,842"
                icon="▤"
              />

              <ResultMetric
                label="Verified"
                value="23,406"
                icon="✓"
              />

              <ResultMetric
                label="Pending"
                value="1,436"
                icon="◷"
              />

              <ResultMetric
                label="Coverage"
                value="94.1%"
                icon="⌖"
              />

            </div>

            <div className="results-progress">

              <span
                style={{
                  width: "94.1%",
                }}
              />

            </div>

            <div className="results-footer">

              <span>
                National reporting coverage
              </span>

              <strong>
                94.1%
              </strong>

            </div>

            <button
              type="button"
              className="dark-button"
            >
              Open Results Command Center
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
                  Election intelligence,
                  organizational analysis and
                  general-purpose AI assistance.
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
            initialReminders={
              reminders
            }
          />

          {/* ==================================================
              AI PERSONAL ASSISTANT
          ================================================== */}

          <AIPersonalAssistant />

          {/* ==================================================
              PARTY OPERATIONS
          ================================================== */}

          <div className="panel party-operations-panel">

            <PanelHeader
              label="PARTY FIELD NETWORK"
              title="Operational Overview"
              subtitle="Current national deployment"
            />

            <div className="operations-grid">

              {operations.map(
                (operation) => (
                  <OperationCard
                    key={operation.label}
                    icon={operation.icon}
                    value={operation.value}
                    label={operation.label}
                  />
                )
              )}

            </div>

            <div className="network-status">

              <span>
                ● Party operational network online
              </span>

              <strong>
                97.8%
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
              title="Operational Priorities"
              subtitle="Areas requiring attention"
            />

            <PriorityItem
              number="01"
              title="Strengthen polling agent coverage"
              description="Some polling areas require additional deployment and readiness checks."
              priority="High"
            />

            <PriorityItem
              number="02"
              title="Review pending election reports"
              description="1,436 reports are currently awaiting verification."
              priority="High"
            />

            <PriorityItem
              number="03"
              title="Increase regional engagement"
              description="Several regions show opportunities for improved operational activity."
              priority="Medium"
            />

          </div>

          {/* ==================================================
              PRIVACY & SECURITY
          ================================================== */}

          <PrivacySecurityPanel />

        </section>

      </main>

      {/* ======================================================
          STYLES
      ====================================================== */}

      <style jsx>{`

        .party-page {
          min-height: 100vh;
          padding: 20px;
          background:
            radial-gradient(
              circle at 85% 5%,
              rgba(
                7,
                95,
                43,
                0.08
              ),
              transparent 30%
            ),
            #f5f7f6;
          color: #202721;
        }

        /* ==================================================
           HERO
        ================================================== */

        .party-hero {
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
              0.78
            );
          border-radius: 18px;
          background:
            linear-gradient(
              125deg,
              #043d1d 0%,
              #075f2b 48%,
              #111b15 100%
            );
          color: #ffffff;
          box-shadow:
            0 18px 45px
              rgba(
                10,
                55,
                28,
                0.15
              );
        }

        .party-hero::before {
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
          max-width: 780px;
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
          font-size: 29px;
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
                30,
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
                30,
                45,
                35,
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
          background: #edf6f0;
          color: #075f2b;
          font-size: 17px;
        }

        .metric-card span {
          display: block;
          color: #8c958f;
          font-size: 8px;
        }

        .metric-card strong {
          display: block;
          margin-top: 3px;
          color: #075f2b;
          font-size: 19px;
          font-weight: 900;
        }

        .metric-card small {
          display: block;
          margin-top: 2px;
          color: #078037;
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
                30,
                0.035
              );
        }

        .operations-overview,
        .ai-panel,
        .party-operations-panel,
        .priorities-panel {
          grid-column: span 2;
        }

        .ai-panel {
          background:
            linear-gradient(
              145deg,
              #07120c,
              #0e2b19
            );
          color: #ffffff;
          border-color:
            rgba(
              201,
              162,
              39,
              0.78
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
          color: #2e3830;
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
          color: #075f2b;
          font-size: 7px;
          font-weight: 800;
        }

        /* ==================================================
           NATIONAL PERFORMANCE
        ================================================== */

        .operations-content {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 25px;
          align-items: center;
        }

        .organization-score {
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
              #075f2b 0 76.4%,
              #e9e9e9 76.4% 100%
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
          color: #075f2b;
          font-size: 21px;
          font-weight: 900;
        }

        .score-ring span {
          margin-top: 3px;
          color: #929b95;
          font-size: 7px;
        }

        .score-info > strong {
          color: #078037;
          font-size: 17px;
        }

        .score-info > span {
          display: block;
          margin-top: 2px;
          color: #929b95;
          font-size: 7px;
        }

        .score-info p {
          max-width: 200px;
          margin: 8px 0 0;
          color: #7d8780;
          font-size: 8px;
          line-height: 1.5;
        }

        .readiness-bars {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        .progress-row {
          display: grid;
          grid-template-columns:
            120px 1fr 35px;
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
              #075f2b,
              #c9a227
            );
        }

        .progress-row strong {
          color: #465149;
          font-size: 7px;
          text-align: right;
        }

        /* ==================================================
           REGIONAL PERFORMANCE
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
          color: #4a554d;
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
          background: #075f2b;
        }

        .region-score {
          text-align: right;
        }

        .region-score strong {
          display: block;
          color: #075f2b;
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
           HIERARCHY
        ================================================== */

        .hierarchy-map {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 5px;
          padding: 4px 0;
        }

        .hierarchy-node {
          width: min(
            100%,
            250px
          );
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          border: 1px solid
            rgba(
              201,
              162,
              39,
              0.35
            );
          border-radius: 9px;
          background: #f7faf8;
        }

        .hierarchy-node-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .hierarchy-node-icon {
          color: #075f2b;
          font-size: 14px;
        }

        .hierarchy-node-title {
          color: #455048;
          font-size: 8px;
          font-weight: 800;
        }

        .hierarchy-node-count {
          color: #075f2b;
          font-size: 10px;
          font-weight: 900;
        }

        .hierarchy-line {
          color: #c9a227;
          font-size: 12px;
          font-weight: 900;
        }

        /* ==================================================
           RESULTS
        ================================================== */

        .results-grid {
          display: grid;
          grid-template-columns:
            repeat(2, 1fr);
          gap: 8px;
        }

        .result-metric {
          padding: 12px;
          border-radius: 9px;
          background: #f7faf8;
        }

        .result-metric-icon {
          color: #075f2b;
          font-size: 13px;
        }

        .result-metric span {
          display: block;
          margin-top: 5px;
          color: #929b95;
          font-size: 7px;
        }

        .result-metric strong {
          display: block;
          margin-top: 3px;
          color: #075f2b;
          font-size: 16px;
          font-weight: 900;
        }

        .results-progress {
          height: 7px;
          margin-top: 13px;
          overflow: hidden;
          border-radius: 999px;
          background: #e9ecea;
        }

        .results-progress span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background:
            linear-gradient(
              90deg,
              #075f2b,
              #c9a227
            );
        }

        .results-footer {
          display: flex;
          justify-content: space-between;
          margin-top: 6px;
        }

        .results-footer span {
          color: #8d9690;
          font-size: 7px;
        }

        .results-footer strong {
          color: #075f2b;
          font-size: 8px;
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
              0.7
            );
          border-radius: 8px;
          background: #06150b;
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
                95,
                43,
                0.18
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
           PARTY OPERATIONS
        ================================================== */

        .operations-grid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 8px;
        }

        .operation-card {
          padding: 13px 8px;
          border-radius: 10px;
          background: #f7faf8;
          text-align: center;
        }

        .operation-card-icon {
          color: #075f2b;
          font-size: 15px;
        }

        .operation-card strong {
          display: block;
          margin-top: 5px;
          color: #075f2b;
          font-size: 17px;
          font-weight: 900;
        }

        .operation-card span {
          display: block;
          margin-top: 2px;
          color: #89928c;
          font-size: 7px;
        }

        .network-status {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 11px;
          padding-top: 10px;
          border-top: 1px solid #edf1ee;
        }

        .network-status span {
          color: #078037;
          font-size: 8px;
          font-weight: 750;
        }

        .network-status strong {
          color: #075f2b;
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
          background: #edf6f0;
          color: #075f2b;
          font-size: 7px;
          font-weight: 900;
        }

        .priority-content strong {
          display: block;
          color: #455048;
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

          .operations-overview,
          .ai-panel,
          .party-operations-panel,
          .priorities-panel {
            grid-column: span 2;
          }

        }

        @media (max-width: 760px) {

          .party-page {
            padding: 12px;
          }

          .party-hero {
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

          .operations-overview,
          .ai-panel,
          .party-operations-panel,
          .priorities-panel {
            grid-column: span 1;
          }

          .operations-content {
            grid-template-columns: 1fr;
          }

          .operations-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

        }

        @media (max-width: 500px) {

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .party-hero {
            border-radius: 13px;
          }

          .hero-content h1 {
            font-size: 22px;
          }

          .hero-content p {
            font-size: 9px;
          }

          .organization-score {
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

          .party-hero::before,
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
   HIERARCHY NODE
============================================================ */

function HierarchyNode({
  icon,
  title,
  count,
}) {
  return (
    <div className="hierarchy-node">

      <div className="hierarchy-node-left">

        <span className="hierarchy-node-icon">
          {icon}
        </span>

        <span className="hierarchy-node-title">
          {title}
        </span>

      </div>

      <span className="hierarchy-node-count">
        {count}
      </span>

    </div>
  );
}

/* ============================================================
   RESULT METRIC
============================================================ */

function ResultMetric({
  label,
  value,
  icon,
}) {
  return (
    <div className="result-metric">

      <div className="result-metric-icon">
        {icon}
      </div>

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

/* ============================================================
   OPERATION CARD
============================================================ */

function OperationCard({
  icon,
  value,
  label,
}) {
  return (
    <div className="operation-card">

      <div className="operation-card-icon">
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
