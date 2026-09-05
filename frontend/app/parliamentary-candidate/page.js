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
   PARLIAMENTARY CANDIDATE NAVIGATION
============================================================ */

const parliamentaryNavigation = [
  {
    section: "CONSTITUENCY COMMAND",
    items: [
      {
        label: "Dashboard",
        href: "/parliamentary-candidate",
        icon: "⌂",
        key: "overview",
      },
      {
        label: "Campaign Overview",
        href: "/parliamentary-candidate/campaign",
        icon: "◉",
        key: "campaign",
      },
      {
        label: "Constituency",
        href: "/parliamentary-candidate/constituency",
        icon: "⌖",
        key: "constituency",
      },
      {
        label: "Polling Stations",
        href: "/parliamentary-candidate/polling-stations",
        icon: "▣",
        key: "polling-stations",
      },
      {
        label: "Field Team",
        href: "/parliamentary-candidate/team",
        icon: "♙",
        key: "team",
      },
    ],
  },

  {
    section: "ELECTION INTELLIGENCE",
    items: [
      {
        label: "Live Results",
        href: "/parliamentary-candidate/results",
        icon: "▤",
        key: "results",
      },
      {
        label: "EC8 Verification",
        href: "/parliamentary-candidate/ec8",
        icon: "✓",
        key: "ec8",
      },
      {
        label: "AI Election Analyzer",
        href: "/parliamentary-candidate/ai-analyzer",
        icon: "✦",
        key: "ai-analyzer",
      },
      {
        label: "Analytics",
        href: "/parliamentary-candidate/analytics",
        icon: "◫",
        key: "analytics",
      },
      {
        label: "Field Reports",
        href: "/parliamentary-candidate/reports",
        icon: "▤",
        key: "reports",
      },
    ],
  },

  {
    section: "CAMPAIGN MANAGEMENT",
    items: [
      {
        label: "Campaign Calendar",
        href: "/parliamentary-candidate/calendar",
        icon: "□",
        key: "calendar",
      },
      {
        label: "Campaign Team",
        href: "/parliamentary-candidate/team",
        icon: "♧",
        key: "campaign-team",
      },
      {
        label: "Media & Communications",
        href: "/parliamentary-candidate/media",
        icon: "◈",
        key: "media",
      },
      {
        label: "Reminders",
        href: "/parliamentary-candidate/reminders",
        icon: "✓",
        key: "reminders",
      },
      {
        label: "Notifications",
        href: "/parliamentary-candidate/notifications",
        icon: "🔔",
        key: "notifications",
      },
    ],
  },

  {
    section: "ACCOUNT",
    items: [
      {
        label: "Profile",
        href: "/profile",
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
   DEMO DATA
   Temporary presentation data only.
============================================================ */

const pollingStations = [
  {
    name: "Central Methodist School",
    code: "PS-001",
    status: "Reporting",
    turnout: "71%",
  },
  {
    name: "Community Basic School",
    code: "PS-002",
    status: "Reporting",
    turnout: "68%",
  },
  {
    name: "Presbyterian Primary",
    code: "PS-003",
    status: "Monitoring",
    turnout: "64%",
  },
  {
    name: "District Assembly Hall",
    code: "PS-004",
    status: "Reporting",
    turnout: "76%",
  },
  {
    name: "Community Centre",
    code: "PS-005",
    status: "Monitoring",
    turnout: "59%",
  },
];

const constituencyMetrics = [
  {
    label: "Constituency Coverage",
    value: "94.6%",
    change: "+4.2%",
    icon: "⌖",
  },
  {
    label: "Polling Stations",
    value: "248",
    change: "236 active",
    icon: "▣",
  },
  {
    label: "Field Personnel",
    value: "684",
    change: "+27",
    icon: "♙",
  },
  {
    label: "Reports Received",
    value: "3,842",
    change: "+184",
    icon: "▤",
  },
];

const reminders = [
  {
    id: "pc-reminder-1",
    title: "Constituency strategy meeting",
    description:
      "Review campaign performance with the constituency team.",
    date: new Date().toISOString(),
    time: "09:00 AM",
    completed: false,
  },
  {
    id: "pc-reminder-2",
    title: "Polling station readiness review",
    description:
      "Review polling station deployment and reporting readiness.",
    date: new Date().toISOString(),
    time: "12:30 PM",
    completed: false,
  },
  {
    id: "pc-reminder-3",
    title: "EC8 verification review",
    description:
      "Review submitted election result documents.",
    date: new Date(
      Date.now() + 86400000
    ).toISOString(),
    time: "10:00 AM",
    completed: false,
  },
];

const notifications = [
  {
    id: "pc-notification-1",
    type: "result",
    title: "New polling station result",
    message:
      "A new result report is ready for review.",
    createdAt: new Date(
      Date.now() - 7 * 60000
    ).toISOString(),
    read: false,
  },
  {
    id: "pc-notification-2",
    type: "report",
    title: "Field report received",
    message:
      "A field coordinator submitted a new report.",
    createdAt: new Date(
      Date.now() - 31 * 60000
    ).toISOString(),
    read: false,
  },
  {
    id: "pc-notification-3",
    type: "security",
    title: "Security review available",
    message:
      "Review recent account activity and sessions.",
    createdAt: new Date(
      Date.now() - 2 * 3600000
    ).toISOString(),
    read: true,
  },
];

/* ============================================================
   PAGE
============================================================ */

export default function ParliamentaryCandidateDashboard() {
  const [activeSection, setActiveSection] =
    useState("overview");

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  return (
    <DashboardShell
      role="parliamentary_candidate"
      navigation={parliamentaryNavigation}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      mobileMenuOpen={mobileMenuOpen}
      onMobileMenuClose={() =>
        setMobileMenuOpen(false)
      }
    >
      <main className="parliamentary-page">

        {/* ==================================================
            CONSTITUENCY HERO
        ================================================== */}

        <section className="candidate-hero">

          <div className="hero-content">

            <span className="hero-label">
              PARLIAMENTARY CAMPAIGN COMMAND
            </span>

            <h1>
              Constituency
              <br />
              Intelligence Center
            </h1>

            <p>
              Manage constituency operations,
              monitor polling stations, review
              field intelligence and track
              election readiness from one
              command center.
            </p>

            <div className="hero-badges">

              <span>
                ● Campaign Active
              </span>

              <span>
                248 Polling Stations
              </span>

              <span>
                Constituency Coverage 94.6%
              </span>

            </div>

          </div>

          <div className="hero-emblem">

            <div className="emblem-ring">

              <div className="emblem-inner">
                PC
              </div>

            </div>

            <span>
              POLISYNC AFRICA
            </span>

          </div>

        </section>

        {/* ==================================================
            KPI CARDS
        ================================================== */}

        <section className="metrics-grid">

          {constituencyMetrics.map(
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
              CONSTITUENCY PERFORMANCE
          ================================================== */}

          <div className="panel performance-panel">

            <PanelHeader
              label="CONSTITUENCY INTELLIGENCE"
              title="Campaign Performance"
              subtitle="Current constituency campaign index"
            />

            <div className="performance-content">

              <div className="score-area">

                <div className="score-ring">

                  <div>

                    <strong>
                      63.8%
                    </strong>

                    <span>
                      Campaign Index
                    </span>

                  </div>

                </div>

                <div className="score-details">

                  <strong>
                    +5.4%
                  </strong>

                  <span>
                    improvement this month
                  </span>

                  <p>
                    Campaign coverage and field
                    reporting are trending positively
                    across the constituency.
                  </p>

                </div>

              </div>

              <div className="progress-list">

                <ProgressRow
                  label="Polling Station Coverage"
                  value={95}
                />

                <ProgressRow
                  label="Field Team Activity"
                  value={86}
                />

                <ProgressRow
                  label="Community Engagement"
                  value={73}
                />

                <ProgressRow
                  label="Election Readiness"
                  value={81}
                />

              </div>

            </div>

          </div>

          {/* ==================================================
              POLLING STATIONS
          ================================================== */}

          <div className="panel polling-panel">

            <PanelHeader
              label="FIELD NETWORK"
              title="Polling Stations"
              subtitle="Live constituency monitoring"
              action="View all"
            />

            <div className="station-list">

              {pollingStations.map(
                (station) => (
                  <div
                    className="station-row"
                    key={station.code}
                  >

                    <div className="station-icon">
                      ▣
                    </div>

                    <div className="station-details">

                      <strong>
                        {station.name}
                      </strong>

                      <span>
                        {station.code}
                      </span>

                    </div>

                    <div className="station-status">

                      <span
                        className={
                          station.status ===
                          "Reporting"
                            ? "status-reporting"
                            : "status-monitoring"
                        }
                      >
                        ●{" "}
                        {station.status}
                      </span>

                      <small>
                        {station.turnout}
                      </small>

                    </div>

                  </div>
                )
              )}

            </div>

          </div>

          {/* ==================================================
              EC8 VERIFICATION
          ================================================== */}

          <div className="panel ec8-panel">

            <PanelHeader
              label="RESULT SECURITY"
              title="EC8 Verification"
              subtitle="Election result document monitoring"
            />

            <div className="ec8-summary">

              <div className="ec8-stat">

                <span>
                  Submitted
                </span>

                <strong>
                  231
                </strong>

              </div>

              <div className="ec8-stat">

                <span>
                  Verified
                </span>

                <strong>
                  218
                </strong>

              </div>

              <div className="ec8-stat">

                <span>
                  Pending
                </span>

                <strong>
                  13
                </strong>

              </div>

            </div>

            <div className="verification-bar">

              <span
                style={{
                  width: "94%",
                }}
              />

            </div>

            <div className="verification-footer">

              <span>
                Verification progress
              </span>

              <strong>
                94%
              </strong>

            </div>

            <button
              type="button"
              className="dark-button"
            >
              Open EC8 Verification
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
                  General-purpose AI plus
                  constituency intelligence.
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
              FIELD OPERATIONS
          ================================================== */}

          <div className="panel field-panel">

            <PanelHeader
              label="FIELD OPERATIONS"
              title="Constituency Field Network"
              subtitle="Current operational status"
            />

            <div className="field-grid">

              <FieldMetric
                icon="♙"
                value="684"
                label="Personnel"
              />

              <FieldMetric
                icon="▣"
                value="248"
                label="Polling Stations"
              />

              <FieldMetric
                icon="⌖"
                value="94.6%"
                label="Coverage"
              />

              <FieldMetric
                icon="✓"
                value="92%"
                label="Readiness"
              />

            </div>

            <div className="network-status">

              <span>
                ● Field network operational
              </span>

              <strong>
                98.1%
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
              title="Constituency Priorities"
              subtitle="Areas requiring attention"
            />

            <PriorityItem
              number="01"
              title="Improve coverage at low-reporting stations"
              description="Several polling stations require additional field attention."
              priority="High"
            />

            <PriorityItem
              number="02"
              title="Review pending EC8 documents"
              description="Thirteen submitted documents remain pending verification."
              priority="High"
            />

            <PriorityItem
              number="03"
              title="Increase community engagement"
              description="AI analysis identifies opportunities for stronger local engagement."
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

        .parliamentary-page {
          min-height: 100vh;
          padding: 20px;
          background:
            radial-gradient(
              circle at 85% 5%,
              rgba(
                43,
                42,
                120,
                0.07
              ),
              transparent 30%
            ),
            #f5f7f6;
          color: #20252c;
        }

        /* ==================================================
           HERO
        ================================================== */

        .candidate-hero {
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
              #17183e 0%,
              #2e317f 48%,
              #075f2b 100%
            );
          color: #ffffff;
          box-shadow:
            0 18px 45px
              rgba(
                28,
                31,
                80,
                0.15
              );
        }

        .candidate-hero::before {
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
          max-width: 760px;
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
          max-width: 650px;
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
          background: #ececf8;
          color: #292d78;
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
          color: #20245e;
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
                30,
                0.035
              );
        }

        .performance-panel {
          grid-column: span 2;
        }

        .ai-panel {
          grid-column: span 2;
          background:
            linear-gradient(
              145deg,
              #101118,
              #171a42
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

        .field-panel {
          grid-column: span 2;
        }

        .priorities-panel {
          grid-column: span 2;
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
          color: #2e3630;
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
          color: #20245e;
          font-size: 7px;
          font-weight: 800;
        }

        /* ==================================================
           PERFORMANCE
        ================================================== */

        .performance-content {
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
              #2d337e 0 63.8%,
              #e9e9e9 63.8% 100%
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
          color: #20245e;
          font-size: 21px;
          font-weight: 900;
        }

        .score-ring span {
          margin-top: 3px;
          color: #929b95;
          font-size: 7px;
        }

        .score-details > strong {
          color: #087532;
          font-size: 17px;
        }

        .score-details > span {
          display: block;
          margin-top: 2px;
          color: #929b95;
          font-size: 7px;
        }

        .score-details p {
          max-width: 190px;
          margin: 8px 0 0;
          color: #7d8780;
          font-size: 8px;
          line-height: 1.5;
        }

        .progress-list {
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
              #2d337e,
              #c9a227
            );
        }

        .progress-row strong {
          color: #465149;
          font-size: 7px;
          text-align: right;
        }

        /* ==================================================
           POLLING STATIONS
        ================================================== */

        .station-list {
          display: flex;
          flex-direction: column;
        }

        .station-row {
          display: grid;
          grid-template-columns:
            29px 1fr auto;
          gap: 8px;
          align-items: center;
          padding: 9px 0;
          border-bottom: 1px solid #edf1ee;
        }

        .station-icon {
          width: 27px;
          height: 27px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: #ececf8;
          color: #292d78;
          font-size: 11px;
        }

        .station-details strong {
          display: block;
          color: #465149;
          font-size: 8px;
        }

        .station-details span {
          display: block;
          margin-top: 2px;
          color: #a0a8a3;
          font-size: 7px;
        }

        .station-status {
          text-align: right;
        }

        .station-status span {
          display: block;
          font-size: 7px;
          font-weight: 800;
        }

        .status-reporting {
          color: #078037;
        }

        .status-monitoring {
          color: #a27400;
        }

        .station-status small {
          display: block;
          margin-top: 3px;
          color: #667169;
          font-size: 7px;
          font-weight: 750;
        }

        /* ==================================================
           EC8
        ================================================== */

        .ec8-summary {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 7px;
        }

        .ec8-stat {
          padding: 10px;
          border-radius: 9px;
          background: #f7f8fb;
          text-align: center;
        }

        .ec8-stat span {
          display: block;
          color: #929b95;
          font-size: 7px;
        }

        .ec8-stat strong {
          display: block;
          margin-top: 4px;
          color: #252965;
          font-size: 18px;
          font-weight: 900;
        }

        .verification-bar {
          height: 7px;
          margin-top: 15px;
          overflow: hidden;
          border-radius: 999px;
          background: #e9ecea;
        }

        .verification-bar span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background:
            linear-gradient(
              90deg,
              #293079,
              #c9a227
            );
        }

        .verification-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 6px;
        }

        .verification-footer span {
          color: #8d9690;
          font-size: 7px;
        }

        .verification-footer strong {
          color: #252965;
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
          background: #171a42;
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
                24,
                27,
                67,
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
           FIELD
        ================================================== */

        .field-grid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 8px;
        }

        .field-metric {
          padding: 13px 8px;
          border-radius: 10px;
          background: #f7f8fb;
          text-align: center;
        }

        .field-metric-icon {
          font-size: 15px;
        }

        .field-metric strong {
          display: block;
          margin-top: 4px;
          color: #252965;
          font-size: 17px;
        }

        .field-metric span {
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
          color: #252965;
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
          background: #ececf8;
          color: #292d78;
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

          .performance-panel,
          .ai-panel,
          .field-panel,
          .priorities-panel {
            grid-column: span 2;
          }

        }

        @media (max-width: 760px) {

          .parliamentary-page {
            padding: 12px;
          }

          .candidate-hero {
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

          .performance-panel,
          .ai-panel,
          .field-panel,
          .priorities-panel {
            grid-column: span 1;
          }

          .performance-content {
            grid-template-columns: 1fr;
          }

          .field-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

        }

        @media (max-width: 500px) {

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .candidate-hero {
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
              95px 1fr 30px;
          }

          .priority-item {
            grid-template-columns:
              27px 1fr;
          }

          .priority-level {
            grid-column: 2;
            justify-self: start;
          }

          .station-row {
            grid-template-columns:
              29px 1fr;
          }

          .station-status {
            grid-column: 2;
            text-align: left;
          }

        }

        @media (
          prefers-reduced-motion: reduce
        ) {

          .candidate-hero::before,
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
   FIELD METRIC
============================================================ */

function FieldMetric({
  icon,
  value,
  label,
}) {
  return (
    <div className="field-metric">

      <div className="field-metric-icon">
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
