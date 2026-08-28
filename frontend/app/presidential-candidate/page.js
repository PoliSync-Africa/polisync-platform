"use client";

import { useState } from "react";

import DashboardShell from "../../components/dashboard/DashboardShell";
import WeatherCard from "../../components/dashboard/WeatherCard";
import RemindersPanel from "../../components/dashboard/RemindersPanel";
import AIPersonalAssistant from "../../components/dashboard/AIPersonalAssistant";
import AIAnalyzer from "../../components/dashboard/AIAnalyzer";
import NotificationsPanel from "../../components/dashboard/NotificationsPanel";
import PrivacySecurityPanel from "../../components/dashboard/PrivacySecurityPanel";

const presidentialNavigation = [
  {
    section: "CAMPAIGN COMMAND",
    items: [
      {
        label: "Dashboard",
        href: "/presidential-candidate",
        icon: "⌂",
        key: "overview",
      },
      {
        label: "Campaign Overview",
        href: "/presidential-candidate/campaign",
        icon: "◉",
        key: "campaign",
      },
      {
        label: "Regional Performance",
        href: "/presidential-candidate/regions",
        icon: "◒",
        key: "regions",
      },
      {
        label: "Field Operations",
        href: "/presidential-candidate/field",
        icon: "⌖",
        key: "field",
      },
      {
        label: "Campaign Team",
        href: "/presidential-candidate/team",
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
        href: "/presidential-candidate/results",
        icon: "▣",
        key: "results",
      },
      {
        label: "AI Election Analyzer",
        href: "/presidential-candidate/ai-analyzer",
        icon: "✦",
        key: "ai-analyzer",
      },
      {
        label: "Analytics",
        href: "/presidential-candidate/analytics",
        icon: "◫",
        key: "analytics",
      },
      {
        label: "Field Reports",
        href: "/presidential-candidate/reports",
        icon: "▤",
        key: "reports",
      },
    ],
  },

  {
    section: "CAMPAIGN MANAGEMENT",
    items: [
      {
        label: "Media & Communications",
        href: "/presidential-candidate/media",
        icon: "◈",
        key: "media",
      },
      {
        label: "Campaign Calendar",
        href: "/presidential-candidate/calendar",
        icon: "□",
        key: "calendar",
      },
      {
        label: "Finance",
        href: "/presidential-candidate/finance",
        icon: "₵",
        key: "finance",
      },
      {
        label: "Reminders",
        href: "/presidential-candidate/reminders",
        icon: "✓",
        key: "reminders",
      },
      {
        label: "Notifications",
        href: "/presidential-candidate/notifications",
        icon: "♧",
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

export default function PresidentialCandidateDashboard() {
  const [activeSection, setActiveSection] =
    useState("overview");

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const user = {
    displayName: "Presidential Candidate",
    firstName: "Presidential",
    platformRole: "presidential_candidate",
  };

  const reminders = [
    {
      id: "pc-reminder-1",
      title: "Regional campaign briefing",
      description:
        "Review regional campaign performance.",
      date: new Date().toISOString(),
      time: "09:00 AM",
      completed: false,
    },
    {
      id: "pc-reminder-2",
      title: "Media strategy meeting",
      description:
        "Review upcoming communications schedule.",
      date: new Date().toISOString(),
      time: "01:00 PM",
      completed: false,
    },
    {
      id: "pc-reminder-3",
      title: "Campaign finance review",
      description:
        "Review campaign expenditure report.",
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
      title: "Results intelligence updated",
      message:
        "New field results are available for analysis.",
      createdAt: new Date(
        Date.now() - 8 * 60000
      ).toISOString(),
      read: false,
    },
    {
      id: "pc-notification-2",
      type: "report",
      title: "Regional report received",
      message:
        "A new campaign report has been submitted.",
      createdAt: new Date(
        Date.now() - 42 * 60000
      ).toISOString(),
      read: false,
    },
    {
      id: "pc-notification-3",
      type: "reminder",
      title: "Upcoming campaign activity",
      message:
        "You have campaign activities scheduled today.",
      createdAt: new Date(
        Date.now() - 2 * 3600000
      ).toISOString(),
      read: true,
    },
  ];

  const regions = [
    {
      name: "Greater Accra",
      score: "68%",
      trend: "+4.8%",
    },
    {
      name: "Ashanti",
      score: "61%",
      trend: "+3.2%",
    },
    {
      name: "Eastern",
      score: "57%",
      trend: "+2.7%",
    },
    {
      name: "Bono East",
      score: "54%",
      trend: "+5.1%",
    },
    {
      name: "Northern",
      score: "49%",
      trend: "+1.9%",
    },
  ];

  const campaignMetrics = [
    {
      label: "National Reach",
      value: "74.8%",
      change: "+6.2%",
      icon: "🌍",
    },
    {
      label: "Field Teams",
      value: "1,284",
      change: "+18",
      icon: "👥",
    },
    {
      label: "Active Regions",
      value: "16 / 16",
      change: "100%",
      icon: "📍",
    },
    {
      label: "Field Reports",
      value: "8,421",
      change: "+312",
      icon: "📄",
    },
  ];

  return (
    <DashboardShell
      role="presidential_candidate"
      navigation={presidentialNavigation}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      mobileMenuOpen={mobileMenuOpen}
      onMobileMenuClose={() =>
        setMobileMenuOpen(false)
      }
    >
      <div className="presidential-page">
        {/* ==================================================
            CANDIDATE HERO
        ================================================== */}

        <section className="candidate-hero">
          <div className="hero-content">
            <span className="hero-label">
              PRESIDENTIAL CAMPAIGN COMMAND
            </span>

            <h1>
              National Campaign
              <br />
              Intelligence Center
            </h1>

            <p>
              Monitor campaign operations,
              field intelligence, regional
              performance and election
              developments from one command
              center.
            </p>

            <div className="hero-badges">
              <span>
                ● Campaign Active
              </span>

              <span>
                16 Regions
              </span>

              <span>
                National Coverage
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
            CAMPAIGN METRICS
        ================================================== */}

        <section className="metrics-grid">
          {campaignMetrics.map(
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
            MAIN GRID
        ================================================== */}

        <section className="dashboard-grid">
          {/* NATIONAL PERFORMANCE */}

          <div className="panel national-panel">
            <PanelHeader
              label="NATIONAL OVERVIEW"
              title="Campaign Performance"
              subtitle="National campaign intelligence"
            />

            <div className="performance-content">
              <div className="national-score">
                <div className="score-ring">
                  <div>
                    <strong>
                      64.2%
                    </strong>

                    <span>
                      Current Index
                    </span>
                  </div>
                </div>

                <div className="score-info">
                  <strong>
                    +5.7%
                  </strong>

                  <span>
                    improvement this month
                  </span>

                  <p>
                    Campaign activity,
                    regional engagement and
                    field intelligence are
                    trending positively.
                  </p>
                </div>
              </div>

              <div className="performance-bars">
                <ProgressRow
                  label="Public Engagement"
                  value={78}
                />

                <ProgressRow
                  label="Regional Coverage"
                  value={100}
                />

                <ProgressRow
                  label="Field Activity"
                  value={84}
                />

                <ProgressRow
                  label="Campaign Readiness"
                  value={71}
                />
              </div>
            </div>
          </div>

          {/* REGIONAL PERFORMANCE */}

          <div className="panel">
            <PanelHeader
              label="REGIONAL INTELLIGENCE"
              title="Regional Performance"
              subtitle="Compare campaign activity"
              action="View all"
            />

            <div className="region-list">
              {regions.map(
                (region, index) => (
                  <div
                    className="region-row"
                    key={region.name}
                  >
                    <div className="region-number">
                      {String(
                        index + 1
                      ).padStart(2, "0")}
                    </div>

                    <div className="region-name">
                      <strong>
                        {region.name}
                      </strong>

                      <div className="region-bar">
                        <span
                          style={{
                            width:
                              region.score,
                          }}
                        />
                      </div>
                    </div>

                    <div className="region-score">
                      <strong>
                        {region.score}
                      </strong>

                      <small>
                        {region.trend}
                      </small>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* AI ANALYZER */}

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
                  Election Analyzer
                </h2>

                <p>
                  General-purpose and
                  election intelligence.
                </p>
              </div>
            </div>

            <AIAnalyzer />
          </div>

          {/* WEATHER */}

          <WeatherCard />

          {/* REMINDERS */}

          <RemindersPanel
            initialReminders={reminders}
          />

          {/* AI PERSONAL ASSISTANT */}

          <AIPersonalAssistant />

          {/* CAMPAIGN OPERATIONS */}

          <div className="panel operations-panel">
            <PanelHeader
              label="FIELD OPERATIONS"
              title="Campaign Operations"
              subtitle="Live campaign activity"
            />

            <div className="operations-grid">
              <OperationCard
                icon="👥"
                value="1,284"
                label="Field Personnel"
              />

              <OperationCard
                icon="📍"
                value="16"
                label="Regions Active"
              />

              <OperationCard
                icon="🏛️"
                value="276"
                label="Constituencies"
              />

              <OperationCard
                icon="📊"
                value="8,421"
                label="Reports"
              />
            </div>

            <div className="operations-status">
              <span>
                ● Field network operational
              </span>

              <strong>
                94.7%
              </strong>
            </div>
          </div>

          {/* NOTIFICATIONS */}

          <NotificationsPanel
            initialNotifications={
              notifications
            }
          />

          {/* CAMPAIGN PRIORITIES */}

          <div className="panel priorities-panel">
            <PanelHeader
              label="AI RECOMMENDATIONS"
              title="Campaign Priorities"
              subtitle="Areas requiring attention"
            />

            <PriorityItem
              number="01"
              title="Strengthen Northern Region field activity"
              description="AI analysis indicates an opportunity to improve campaign engagement."
              priority="High"
            />

            <PriorityItem
              number="02"
              title="Increase regional communications"
              description="Several regions show increased demand for campaign information."
              priority="Medium"
            />

            <PriorityItem
              number="03"
              title="Review constituency reports"
              description="New reports require campaign leadership review."
              priority="Medium"
            />
          </div>

          {/* PRIVACY */}

          <PrivacySecurityPanel />
        </section>
      </div>

      <style jsx>{`
        .presidential-page {
          min-height: 100vh;
          padding: 20px;
          background:
            radial-gradient(
              circle at 85% 5%,
              rgba(115, 28, 49, 0.08),
              transparent 30%
            ),
            #f5f7f6;
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
          border: 1px solid rgba(
            201,
            162,
            39,
            0.72
          );
          border-radius: 18px;
          background:
            linear-gradient(
              125deg,
              #4a1424 0%,
              #701f39 45%,
              #075f2b 100%
            );
          color: #ffffff;
          box-shadow:
            0 18px 45px
              rgba(40, 20, 28, 0.16);
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
          animation: heroShine 7s
            ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes heroShine {
          0% {
            transform: translateX(-80%);
          }

          55%,
          100% {
            transform: translateX(80%);
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
          color: rgba(
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
          background: rgba(
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
          background: rgba(
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
          color: rgba(
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
              0.5
            );
          border-radius: 13px;
          background: #ffffff;
          box-shadow:
            0 5px 17px
              rgba(20, 40, 30, 0.04);
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
                0.9
              ),
              transparent
            );
          animation: borderShine 8s
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
          transform: translateY(-2px);
          box-shadow:
            0 10px 25px
              rgba(30, 45, 35, 0.08);
        }

        .metric-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 11px;
          background: #f5e9ed;
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
          color: #401523;
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
            repeat(3, minmax(0, 1fr));
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
              0.52
            );
          border-radius: 14px;
          background: #ffffff;
          box-shadow:
            0 5px 18px
              rgba(20, 40, 30, 0.035);
        }

        .national-panel {
          grid-column: span 2;
        }

        .ai-panel {
          grid-column: span 2;
          background:
            linear-gradient(
              145deg,
              #171313,
              #29151c
            );
          color: #ffffff;
          border-color:
            rgba(
              201,
              162,
              39,
              0.75
            );
        }

        .operations-panel {
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
          color: #2e382f;
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
           PERFORMANCE
        ================================================== */

        .performance-content {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 25px;
          align-items: center;
        }

        .national-score {
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
              #751f3a 0 64.2%,
              #e9e9e9 64.2% 100%
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
          color: #481526;
          font-size: 21px;
          font-weight: 900;
        }

        .score-ring span {
          margin-top: 3px;
          color: #929b95;
          font-size: 7px;
        }

        .score-info > strong {
          color: #087532;
          font-size: 17px;
        }

        .score-info > span {
          display: block;
          margin-top: 2px;
          color: #929b95;
          font-size: 7px;
        }

        .score-info p {
          max-width: 190px;
          margin: 8px 0 0;
          color: #7d8780;
          font-size: 8px;
          line-height: 1.5;
        }

        .performance-bars {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        .progress-row {
          display: grid;
          grid-template-columns: 110px 1fr 35px;
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
              #701f39,
              #c9a227
            );
        }

        .progress-row strong {
          color: #465149;
          font-size: 7px;
          text-align: right;
        }

        /* ==================================================
           REGIONS
        ================================================== */

        .region-list {
          display: flex;
          flex-direction: column;
        }

        .region-row {
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

        .region-name strong {
          color: #4a554d;
          font-size: 8px;
        }

        .region-bar {
          height: 4px;
          margin-top: 5px;
          overflow: hidden;
          border-radius: 999px;
          background: #edf1ee;
        }

        .region-bar span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: #751f3a;
        }

        .region-score {
          text-align: right;
        }

        .region-score strong {
          display: block;
          color: #401523;
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
          background: rgba(
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
          color: rgba(
            255,
            255,
            255,
            0.55
          );
          font-size: 8px;
        }

        .ai-panel :global(
          .polisync-ai-analyzer
        ) {
          border-color:
            rgba(
              230,
              200,
              90,
              0.45
            );
          background: rgba(
            255,
            255,
            255,
            0.035
          );
        }

        /* ==================================================
           OPERATIONS
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
          background: #faf8f9;
          text-align: center;
        }

        .operation-card-icon {
          font-size: 16px;
        }

        .operation-card strong {
          display: block;
          margin-top: 5px;
          color: #401523;
          font-size: 17px;
        }

        .operation-card span {
          display: block;
          margin-top: 2px;
          color: #89928c;
          font-size: 7px;
        }

        .operations-status {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 11px;
          padding-top: 10px;
          border-top: 1px solid #edf1ee;
        }

        .operations-status span {
          color: #078037;
          font-size: 8px;
          font-weight: 750;
        }

        .operations-status strong {
          color: #401523;
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
          background: #f5e9ed;
          color: #751f3a;
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
              repeat(2, minmax(0, 1fr));
          }

          .national-panel,
          .ai-panel,
          .operations-panel,
          .priorities-panel {
            grid-column: span 2;
          }
        }

        @media (max-width: 760px) {
          .presidential-page {
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

          .national-panel,
          .ai-panel,
          .operations-panel,
          .priorities-panel {
            grid-column: span 1;
          }

          .performance-content {
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

          .candidate-hero {
            border-radius: 13px;
          }

          .hero-content h1 {
            font-size: 22px;
          }

          .hero-content p {
            font-size: 9px;
          }

          .national-score {
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
        }

        @media (
          prefers-reduced-motion: reduce
        ) {
          .candidate-hero::before,
          .metric-card::before,
          .panel::before {
            animation: none;
          }

          .metric-card {
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

        <h2>{title}</h2>

        {subtitle && (
          <p>{subtitle}</p>
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
   PROGRESS
============================================================ */

function ProgressRow({
  label,
  value,
}) {
  return (
    <div className="progress-row">
      <label>{label}</label>

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

      <strong>{value}</strong>

      <span>{label}</span>
    </div>
  );
}

/* ============================================================
   PRIORITY
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
        <strong>{title}</strong>

        <p>{description}</p>
      </div>

      <span className="priority-level">
        {priority}
      </span>
    </div>
  );
}
