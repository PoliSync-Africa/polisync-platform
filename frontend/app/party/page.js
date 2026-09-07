"use client";

import { useState } from "react";

import DashboardShell from "../../components/dashboard/DashboardShell";
import WeatherCard from "../../components/dashboard/WeatherCard";
import RemindersPanel from "../../components/dashboard/RemindersPanel";
import AIPersonalAssistant from "../../components/dashboard/AIPersonalAssistant";
import AIAnalyzer from "../../components/dashboard/AIAnalyzer";
import NotificationsPanel from "../../components/dashboard/NotificationsPanel";
import PrivacySecurityPanel from "../../components/dashboard/PrivacySecurityPanel";

const partyNavigation = [
  { section: "PARTY COMMAND", items: [
    { label: "Dashboard", href: "/party", icon: "⌂", key: "overview" },
    { label: "National Command", href: "/party/national", icon: "◎", key: "national" },
    { label: "Regional Administration", href: "/party/regions", icon: "⌖", key: "regions" },
    { label: "Constituencies", href: "/party/constituencies", icon: "▦", key: "constituencies" },
    { label: "Polling Stations", href: "/party/polling-stations", icon: "▣", key: "polling-stations" },
  ]},
  { section: "PARTY OPERATIONS", items: [
    { label: "Members", href: "/party/members", icon: "♙", key: "members" },
    { label: "Party Administrators", href: "/party/administrators", icon: "♚", key: "administrators" },
    { label: "Deployment Center", href: "/party/deployments", icon: "⇄", key: "deployments" },
    { label: "Polling Agents", href: "/party/polling-agents", icon: "♟", key: "agents" },
    { label: "Candidates", href: "/party/candidates", icon: "★", key: "candidates" },
    { label: "Field Operations", href: "/party/field", icon: "⌁", key: "field" },
  ]},
  { section: "ELECTION MANAGEMENT", items: [
    { label: "Live Results", href: "/party/results", icon: "▤", key: "results" },
    { label: "EC8 Results", href: "/party/ec8", icon: "✓", key: "ec8" },
    { label: "Election Analyzer", href: "/party/ai-analyzer", icon: "✦", key: "ai-analyzer" },
    { label: "Analytics", href: "/party/analytics", icon: "◫", key: "analytics" },
    { label: "Reports", href: "/party/reports", icon: "▥", key: "reports" },
  ]},
  { section: "MANAGEMENT", items: [
    { label: "Communications", href: "/party/communications", icon: "◈", key: "communications" },
    { label: "Calendar", href: "/party/calendar", icon: "□", key: "calendar" },
    { label: "Finance", href: "/party/finance", icon: "₵", key: "finance" },
    { label: "Complaints", href: "/party/complaints", icon: "!", key: "complaints" },
    { label: "Reminders", href: "/party/reminders", icon: "✓", key: "reminders" },
    { label: "Notifications", href: "/party/notifications", icon: "♧", key: "notifications" },
  ]},
  { section: "ACCOUNT", items: [
    { label: "Organization Profile", href: "/party/profile", icon: "♙", key: "profile" },
    { label: "Privacy & Security", href: "/settings/security", icon: "♢", key: "security" },
  ]},
];

const partyMetrics = [
  { label: "Party Membership", value: "482,640", change: "+4.8%", icon: "♙" },
  { label: "Active Regions", value: "16 / 16", change: "100%", icon: "⌖" },
  { label: "Constituencies", value: "276", change: "All mapped", icon: "▦" },
  { label: "Polling Network", value: "38,622", change: "+1,240", icon: "▣" },
];

const regionalPerformance = [
  { name: "Greater Accra", score: 78, change: "+5.4%" },
  { name: "Ashanti", score: 73, change: "+4.1%" },
  { name: "Eastern", score: 69, change: "+3.7%" },
  { name: "Bono East", score: 66, change: "+6.2%" },
  { name: "Northern", score: 61, change: "+2.9%" },
];

const operations = [
  { icon: "♙", value: "482,640", label: "Members" },
  { icon: "♚", value: "16", label: "Regional Teams" },
  { icon: "♟", value: "38,622", label: "Polling Agents" },
  { icon: "▤", value: "24,842", label: "Reports" },
];

const reminders = [
  { id: "party-reminder-1", title: "National executive briefing", description: "Review national field and regional performance.", date: new Date().toISOString(), time: "09:00 AM", completed: false },
  { id: "party-reminder-2", title: "Regional administrators meeting", description: "Review regional operational updates.", date: new Date().toISOString(), time: "12:00 PM", completed: false },
  { id: "party-reminder-3", title: "Election results readiness review", description: "Review polling station reporting readiness.", date: new Date(Date.now() + 86400000).toISOString(), time: "10:30 AM", completed: false },
];

const notifications = [
  { id: "party-notification-1", type: "result", title: "New election report", message: "New polling station information is available.", createdAt: new Date(Date.now() - 5 * 60000).toISOString(), read: false },
  { id: "party-notification-2", type: "report", title: "Regional report received", message: "A regional administrator submitted a report.", createdAt: new Date(Date.now() - 34 * 60000).toISOString(), read: false },
  { id: "party-notification-3", type: "security", title: "Security activity", message: "Review recent account sessions.", createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), read: true },
];

export default function PoliticalPartyDashboard() {
  const [activeSection, setActiveSection] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <DashboardShell role="party" navigation={partyNavigation} activeSection={activeSection} onSectionChange={setActiveSection} mobileMenuOpen={mobileMenuOpen} onMobileMenuClose={() => setMobileMenuOpen(false)}>
      <main className="party-page">
        <section className="party-hero"><div className="hero-content"><span className="hero-label">POLITICAL PARTY COMMAND CENTER</span><h1>National Party<br />Operations Center</h1><p>Coordinate national, regional, constituency and polling-station operations through one secure PoliSync command center.</p><div className="hero-badges"><span>● Organization Active</span><span>16 Regions</span><span>276 Constituencies</span><span>38,622 Polling Stations</span></div></div><div className="hero-emblem"><div className="emblem-ring"><div className="emblem-inner">PS</div></div><span>POLISYNC AFRICA</span></div></section>
        <section className="metrics-grid">{partyMetrics.map(metric => <div className="metric-card" key={metric.label}><div className="metric-icon">{metric.icon}</div><div><span>{metric.label}</span><strong>{metric.value}</strong><small>↗ {metric.change}</small></div></div>)}</section>
        <section className="dashboard-grid">
          <div className="panel operations-overview"><PanelHeader label="NATIONAL OPERATIONS" title="Party Performance" subtitle="Current organizational readiness" /><div className="operations-content"><div className="organization-score"><div className="score-ring"><div><strong>76.4%</strong><span>Readiness Index</span></div></div><div className="score-info"><strong>+6.8%</strong><span>improvement this month</span><p>Party field operations, regional coverage and polling network readiness continue to improve.</p></div></div><div className="readiness-bars"><ProgressRow label="Regional Coverage" value={100} /><ProgressRow label="Constituency Coverage" value={94} /><ProgressRow label="Polling Agent Deployment" value={88} /><ProgressRow label="Reporting Readiness" value={82} /></div></div></div>
          <div className="panel regional-panel"><PanelHeader label="REGIONAL PERFORMANCE" title="Regional Activity" subtitle="Compare party operations" action="View all" /><div className="regional-list">{regionalPerformance.map((region,index) => <div className="regional-row" key={region.name}><div className="region-number">{String(index+1).padStart(2,"0")}</div><div className="region-details"><strong>{region.name}</strong><div className="region-track"><span style={{width:`${region.score}%`}} /></div></div><div className="region-score"><strong>{region.score}%</strong><small>{region.change}</small></div></div>)}</div></div>
          <div className="panel hierarchy-panel"><PanelHeader label="ORGANIZATIONAL STRUCTURE" title="Party Administration" subtitle="Your approved operational hierarchy" /><div className="hierarchy-map"><HierarchyNode icon="♚" title="National Admin" count="1" /><div className="hierarchy-line">↓</div><HierarchyNode icon="◎" title="Regional Admins" count="16" /><div className="hierarchy-line">↓</div><HierarchyNode icon="⌖" title="Constituency Admins" count="276" /><div className="hierarchy-line">↓</div><HierarchyNode icon="♟" title="Polling Agents" count="38,622" /></div></div>
          <div className="panel results-panel"><PanelHeader label="ELECTION OPERATIONS" title="Results Network" subtitle="Current reporting readiness" /><div className="results-grid"><ResultMetric label="Reports Received" value="24,842" icon="▤" /><ResultMetric label="Verified" value="23,406" icon="✓" /><ResultMetric label="Pending" value="1,436" icon="◷" /><ResultMetric label="Coverage" value="94.1%" icon="◎" /></div></div>
          <div className="panel operations-panel"><PanelHeader label="OPERATIONS" title="Party Network" subtitle="Current operational footprint" /><div className="operations-grid">{operations.map(item => <div className="operation-card" key={item.label}><span>{item.icon}</span><strong>{item.value}</strong><small>{item.label}</small></div>)}</div></div>
          <div className="panel assistant-panel"><PanelHeader label="POLISYNC AI" title="Political Intelligence Assistant" subtitle="Operational intelligence for party administrators" /><AIPersonalAssistant /></div>
          <div className="panel reminders-panel"><PanelHeader label="SCHEDULE" title="Upcoming Reminders" subtitle="Important party activities" /><RemindersPanel reminders={reminders} /></div>
          <div className="panel notifications-panel"><PanelHeader label="ACTIVITY" title="Recent Notifications" subtitle="Latest party activity" /><NotificationsPanel notifications={notifications} /></div>
          <div className="panel analyzer-panel"><PanelHeader label="AI ANALYTICS" title="Election Intelligence" subtitle="Analyze political and electoral information" /><AIAnalyzer /></div>
          <div className="panel privacy-panel"><PanelHeader label="SECURITY" title="Privacy & Security" subtitle="Protect the party organization and its users" /><PrivacySecurityPanel /></div>
          <div className="panel weather-panel"><WeatherCard /></div>
        </section>
      </main>
    </DashboardShell>
  );
}

function PanelHeader({ label, title, subtitle, action }) { return <div className="panel-header"><div><span>{label}</span><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action && <button type="button">{action} →</button>}</div>; }
function ProgressRow({ label, value }) { return <div className="progress-row"><div><span>{label}</span><strong>{value}%</strong></div><div className="progress-track"><span style={{width:`${value}%`}} /></div></div>; }
function HierarchyNode({ icon, title, count }) { return <div className="hierarchy-node"><span>{icon}</span><strong>{title}</strong><small>{count}</small></div>; }
function ResultMetric({ label, value, icon }) { return <div className="result-metric"><span>{icon}</span><strong>{value}</strong><small>{label}</small></div>; }
