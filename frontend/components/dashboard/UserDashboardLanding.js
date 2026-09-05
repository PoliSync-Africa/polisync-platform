"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "./DashboardShell";
import PoliSyncBrand from "./PoliSyncBrand";
import WeatherCard from "./WeatherCard";
import RemindersPanel from "./RemindersPanel";
import AIPersonalAssistant from "./AIPersonalAssistant";
import AIAnalyzer from "./AIAnalyzer";
import NotificationsPanel from "./NotificationsPanel";
import PrivacySecurityPanel from "./PrivacySecurityPanel";

const getToken = () => typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || "";
const apiBase = () => String(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export default function UserDashboardLanding({ role = "user", title, navigation, activeSection = "overview", onSectionChange, extraContent = null }) {
  const [state, setState] = useState({ loading: true, user: null, metrics: {}, error: "" });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const token = getToken();
        if (!token) throw new Error("Authentication required.");
        const response = await fetch(`${apiBase()}/api/profile/me`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success !== true) throw new Error(data.message || `Unable to load account (${response.status}).`);
        if (!cancelled) setState({ loading: false, user: data.user || null, metrics: data.metrics || {}, error: "" });
      } catch (error) {
        if (!cancelled) setState((current) => ({ ...current, loading: false, error: error.message || "Unable to load account." }));
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const user = state.user || {};
  const roleTitle = title || formatRole(role);
  const displayName = user.displayName || user.firstName || roleTitle;
  const firstName = user.firstName || displayName.split(" ")[0] || "there";

  const stats = useMemo(() => [
    { label: "Organizations", value: state.metrics.organizations, icon: "building", tone: "green" },
    { label: "Assignments", value: state.metrics.assignments, icon: "target", tone: "gold" },
    { label: "Notifications", value: state.metrics.unreadNotifications, icon: "bell", tone: "red" },
    { label: "Results", value: state.metrics.results, icon: "chart", tone: "green" },
  ], [state.metrics]);

  const activity = [
    { icon: "check", title: "Account activity", text: "Your PoliSync workspace is ready.", time: "Now" },
    { icon: "pulse", title: "Workspace sync", text: "Live account metrics are synchronized.", time: "Live" },
    { icon: "shield", title: "Security status", text: user.verified ? "Phone verification is active." : "Complete phone verification for your account badge.", time: "Today" },
  ];

  return (
    <DashboardShell
      role={role}
      navigation={navigation}
      activeSection={activeSection}
      onSectionChange={onSectionChange}
      mobileMenuOpen={mobileMenuOpen}
      onMobileMenuClose={() => setMobileMenuOpen(false)}
      user={user}
    >
      <main className="reference-dashboard">
        <div className="mobile-reference-brand"><PoliSyncBrand compact /></div>

        <header className="reference-welcome">
          <div>
            <span className="eyebrow">WELCOME BACK</span>
            <div className="welcome-name-row">
              <h2>{firstName}</h2>
              <span className="role-pill">{roleTitle}</span>
            </div>
            <p>Your political intelligence workspace, organized around the work that matters most.</p>
          </div>
          <div className="welcome-actions">
            <button type="button" className="round-action" aria-label="Notifications">{icon("bell")}</button>
            <div className="welcome-avatar">{user.profilePhoto ? <img src={user.profilePhoto} alt="" /> : getInitials(displayName)}</div>
          </div>
        </header>

        {state.error && <div className="reference-error">{state.error}</div>}

        <section className="reference-stats" aria-label="Dashboard overview">
          {stats.map((stat) => (
            <article className="stat-card" key={stat.label}>
              <div className={`stat-icon stat-${stat.tone}`}>{icon(stat.icon)}</div>
              <div className="stat-copy">
                <span>{stat.label}</span>
                <strong>{state.loading ? "—" : formatNumber(stat.value)}</strong>
              </div>
            </article>
          ))}
        </section>

        <section className="reference-grid reference-grid-primary">
          <article className="reference-card policy-card">
            <header className="card-heading">
              <div><h3>Policy Impact Overview</h3><span>Live workspace activity</span></div>
              <span className="period-chip">This Month⌄</span>
            </header>
            <div className="chart-wrap">
              <svg className="impact-chart" viewBox="0 0 720 220" role="img" aria-label="Policy impact activity chart">
                <defs>
                  <linearGradient id="impactFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="rgba(21,156,72,.28)" />
                    <stop offset="1" stopColor="rgba(21,156,72,0)" />
                  </linearGradient>
                </defs>
                <g className="chart-grid-lines">
                  <line x1="52" y1="24" x2="688" y2="24" /><line x1="52" y1="67" x2="688" y2="67" /><line x1="52" y1="110" x2="688" y2="110" /><line x1="52" y1="153" x2="688" y2="153" /><line x1="52" y1="196" x2="688" y2="196" />
                </g>
                <path className="chart-area" d="M52 178 C95 170 102 138 145 149 S197 172 230 132 S283 89 319 121 S369 168 404 128 S460 73 493 108 S540 155 575 113 S622 82 688 52 L688 196 L52 196 Z" />
                <path className="chart-line" d="M52 178 C95 170 102 138 145 149 S197 172 230 132 S283 89 319 121 S369 168 404 128 S460 73 493 108 S540 155 575 113 S622 82 688 52" />
                {[52,145,230,319,404,493,575,688].map((x, i) => <circle key={x} className="chart-dot" cx={x} cy={[178,149,132,121,128,108,113,52][i]} r="5" />)}
                <g className="chart-axis"><text x="52" y="216">May 1</text><text x="205" y="216">May 8</text><text x="350" y="216">May 15</text><text x="502" y="216">May 22</text><text x="646" y="216">May 29</text></g>
              </svg>
              <div className="chart-score"><strong>{state.loading ? "—" : `${Math.min(100, Math.max(0, Number(state.metrics.profileCompletion || user.profileCompletion || 0)))}%`}</strong><span>workspace health</span></div>
            </div>
          </article>

          <article className="reference-card engagement-card">
            <header className="card-heading"><div><h3>Regional Engagement</h3><span>Coverage across Africa</span></div><button type="button" className="text-button">View all <span>›</span></button></header>
            <div className="engagement-body">
              <div className="africa-mark" aria-hidden="true"><AfricaMark /></div>
              <div className="region-list">
                {["West Africa", "East Africa", "Central Africa", "Southern Africa", "North Africa"].map((region, index) => (
                  <div className="region-row" key={region}>
                    <span>{region}</span>
                    <div className="region-track"><i style={{ width: `${[72, 63, 48, 59, 41][index]}%` }} /></div>
                    <strong>{[72, 63, 48, 59, 41][index]}%</strong>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </section>

        <section className="reference-card activity-card">
          <header className="card-heading"><div><h3>Recent Activities</h3><span>Latest workspace events</span></div><button type="button" className="text-button">View all <span>›</span></button></header>
          <div className="activity-list">
            {activity.map((item) => (
              <div className="activity-row" key={item.title}>
                <div className="activity-icon">{icon(item.icon)}</div>
                <div className="activity-copy"><strong>{item.title}</strong><span>{item.text}</span></div>
                <time>{item.time}</time>
              </div>
            ))}
          </div>
        </section>

        {extraContent}

        <section className="workspace-tools">
          <div className="tools-heading"><span className="eyebrow">WORKSPACE TOOLS</span><h3>Everything else stays connected.</h3></div>
          <div className="tools-grid">
            <Panel title="Live Weather"><WeatherCard /></Panel>
            {role === "super_admin" && <Panel title="AI Personal Assistant"><AIPersonalAssistant /></Panel>}
            <Panel title="AI Election Intelligence"><AIAnalyzer /></Panel>
            <Panel title="Reminders"><RemindersPanel /></Panel>
            <Panel title="Notifications"><NotificationsPanel /></Panel>
            <Panel title="Privacy & Security"><PrivacySecurityPanel /></Panel>
          </div>
        </section>
      </main>

      <style jsx>{styles}</style>
    </DashboardShell>
  );
}

function Panel({ title, children }) {
  return <section className="tool-panel"><header>{title}</header><div>{children}</div></section>;
}

function formatRole(role) {
  return String(role || "user").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString() : "0";
}

function getInitials(name) {
  return String(name || "P").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "P";
}

function icon(name) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" };
  const paths = {
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    building: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M11 21v-3h2v3" /></>,
    target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><path d="m16.5 7.5 4-4M18 3.5h2.5V6" /></>,
    chart: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="m7 15 4-4 3 2 5-6" /><path d="M16 7h3v3" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    pulse: <><path d="M3 12h4l2-7 4 14 2-7h6" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.2 8.2-8 10-4.8-1.8-8-5-8-10V6l8-3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
  };
  return <svg {...common}>{paths[name] || paths.chart}</svg>;
}

function AfricaMark() {
  return <svg viewBox="0 0 160 190" className="africa-svg" aria-hidden="true"><path d="M78 5c12 2 19 10 28 15l7 14 15 8 1 15 10 12-6 17 7 17-10 16-8 15-8 18-13 12-6 19-15 9-12-11-10-17-11-7-2-18-9-11 3-17-9-12 9-14-2-17 9-10 5-17 13-7 4-11 15-4Z" /><path d="m106 157 13 7 11-4 6 7-8 10-14 2-10-8Z" /></svg>;
}

const styles = `
.reference-dashboard{min-height:100%;padding:clamp(18px,2.6vw,34px);background:#f7faf8;color:#193127;box-sizing:border-box}
.mobile-reference-brand{display:none}
.reference-welcome{display:flex;align-items:center;justify-content:space-between;gap:18px;margin:0 0 18px}
.eyebrow{display:block;color:#c39a1f;font-size:10px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase}
.welcome-name-row{display:flex;align-items:center;gap:10px;margin:5px 0 4px}.welcome-name-row h2{margin:0;color:#075f2b;font-size:clamp(25px,2.5vw,34px);line-height:1.05;letter-spacing:-.7px}.role-pill{display:inline-flex;align-items:center;min-height:22px;padding:0 9px;border-radius:999px;background:#159c48;color:#fff;font-size:9px;font-weight:900;letter-spacing:.2px}.reference-welcome p{max-width:620px;margin:0;color:#6b7b72;font-size:12px;line-height:1.5}.welcome-actions{display:flex;align-items:center;gap:10px}.round-action{width:42px;height:42px;display:grid;place-items:center;border:1px solid #dce6df;border-radius:50%;background:#fff;color:#075f2b;box-shadow:0 5px 18px rgba(16,59,34,.06);cursor:pointer}.round-action svg{width:18px}.welcome-avatar{width:42px;height:42px;display:grid;place-items:center;overflow:hidden;border:2px solid #fff;border-radius:50%;background:#075f2b;color:#fff;font-size:12px;font-weight:900;box-shadow:0 3px 12px rgba(16,59,34,.12)}.welcome-avatar img{width:100%;height:100%;object-fit:cover}
.reference-error{margin-bottom:14px;padding:12px 14px;border:1px solid #efd0d0;border-radius:12px;background:#fff5f5;color:#a00000;font-size:11px}
.reference-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;margin-bottom:14px}.stat-card{min-height:92px;display:flex;align-items:center;gap:12px;padding:13px 14px;background:#fff;border:1px solid #e0e9e3;border-radius:15px;box-shadow:0 5px 20px rgba(22,63,39,.035);box-sizing:border-box}.stat-icon{width:42px;height:42px;flex:0 0 42px;display:grid;place-items:center;border-radius:12px}.stat-icon svg{width:20px}.stat-green{background:#edf8f0;color:#0b9b43}.stat-gold{background:#fbf5e5;color:#c49a1f}.stat-red{background:#fff0f0;color:#e73a3a}.stat-copy span{display:block;color:#7b8981;font-size:9px;font-weight:700}.stat-copy strong{display:block;margin-top:4px;color:#075f2b;font-size:23px;line-height:1}
.reference-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(330px,.75fr);gap:14px;margin-bottom:14px}.reference-card{background:#fff;border:1px solid #e0e9e3;border-radius:16px;box-shadow:0 6px 24px rgba(22,63,39,.035);overflow:hidden}.card-heading{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 16px 10px}.card-heading h3{margin:0;color:#24362d;font-size:14px;letter-spacing:-.1px}.card-heading span{color:#8a968f;font-size:9px}.card-heading>div span{display:block;margin-top:3px}.period-chip{padding:6px 9px;border:1px solid #e1ebe4;border-radius:9px;background:#f8fbf9;color:#607068!important;font-weight:700;white-space:nowrap}.text-button{border:0;background:transparent;color:#07833a;font-size:10px;font-weight:800;cursor:pointer}.text-button span{font-size:16px;vertical-align:-1px;color:#07833a}
.chart-wrap{position:relative;padding:2px 14px 10px}.impact-chart{display:block;width:100%;height:auto;min-height:190px}.chart-grid-lines line{stroke:#e9efeb;stroke-width:1}.chart-area{fill:url(#impactFill)}.chart-line{fill:none;stroke:#13a14b;stroke-width:4;stroke-linecap:round}.chart-dot{fill:#159c48;stroke:#fff;stroke-width:2}.chart-axis text{fill:#8a958f;font-size:10px;font-weight:600}.chart-score{position:absolute;right:28px;top:20px;display:flex;flex-direction:column;align-items:center;padding:5px 8px;border-radius:8px;background:#159c48;color:#fff;box-shadow:0 4px 10px rgba(21,156,72,.18)}.chart-score strong{font-size:13px}.chart-score span{font-size:7px;opacity:.9}
.engagement-body{display:grid;grid-template-columns:125px minmax(0,1fr);align-items:center;gap:12px;padding:2px 16px 17px}.africa-mark{display:grid;place-items:center;height:210px}.africa-svg{width:112px;height:170px}.africa-svg path{fill:#dff4e5;stroke:#159c48;stroke-width:3;stroke-linejoin:round}.region-list{display:grid;gap:13px}.region-row{display:grid;grid-template-columns:90px minmax(50px,1fr) 31px;align-items:center;gap:7px}.region-row>span{color:#4e5d55;font-size:9px;font-weight:650}.region-row strong{color:#4e5d55;font-size:9px;text-align:right}.region-track{height:7px;overflow:hidden;border-radius:999px;background:#edf1ee}.region-track i{display:block;height:100%;border-radius:999px;background:#18a84f}
.activity-card{margin-bottom:16px}.activity-list{border-top:1px solid #eef2ef}.activity-row{display:flex;align-items:center;gap:11px;padding:11px 16px;border-bottom:1px solid #eef2ef}.activity-row:last-child{border-bottom:0}.activity-icon{width:30px;height:30px;flex:0 0 30px;display:grid;place-items:center;border-radius:50%;background:#eef8f1;color:#079340}.activity-icon svg{width:15px}.activity-copy{min-width:0;flex:1}.activity-copy strong,.activity-copy span{display:block}.activity-copy strong{color:#34443b;font-size:10px}.activity-copy span{margin-top:2px;color:#7d8982;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.activity-row time{color:#98a29d;font-size:8px;white-space:nowrap}
.workspace-tools{margin-top:18px}.tools-heading{margin:0 0 10px}.tools-heading h3{margin:4px 0 0;color:#075f2b;font-size:18px}.tools-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.tool-panel{min-width:0;background:#fff;border:1px solid #e0e9e3;border-radius:15px;overflow:hidden;box-shadow:0 5px 20px rgba(22,63,39,.03)}.tool-panel>header{padding:11px 14px;background:#f7faf8;border-bottom:1px solid #edf1ee;color:#68756d;font-size:9px;font-weight:900;letter-spacing:1px;text-transform:uppercase}.tool-panel>div{padding:10px;min-height:120px}
@media(max-width:980px){.reference-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.reference-grid{grid-template-columns:1fr}.engagement-body{grid-template-columns:150px minmax(0,1fr)}}
@media(max-width:760px){.reference-dashboard{padding:14px 12px 24px}.mobile-reference-brand{display:block;margin:0 0 13px}.mobile-reference-brand :global(.polisync-brand-image){width:170px;max-width:55vw}.reference-welcome{align-items:flex-start;margin-bottom:15px}.reference-welcome p{font-size:10px;max-width:470px}.welcome-actions{padding-top:2px}.round-action{width:36px;height:36px}.welcome-avatar{width:36px;height:36px}.welcome-name-row h2{font-size:23px}.role-pill{font-size:8px}.reference-stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.stat-card{min-height:78px;padding:10px}.stat-icon{width:36px;height:36px;flex-basis:36px;border-radius:10px}.stat-copy strong{font-size:19px}.stat-copy span{font-size:8px}.tools-grid{grid-template-columns:1fr}.engagement-body{grid-template-columns:100px minmax(0,1fr);padding-left:12px;padding-right:12px}.africa-mark{height:175px}.africa-svg{width:88px;height:145px}.region-row{grid-template-columns:76px minmax(40px,1fr) 28px}.region-row>span{font-size:8px}.activity-row{padding:10px 12px}.card-heading{padding-left:12px;padding-right:12px}}
@media(max-width:430px){.welcome-actions{gap:6px}.welcome-actions .round-action{display:none}.reference-welcome p{display:none}.reference-stats{grid-template-columns:1fr 1fr}.stat-card{gap:8px}.stat-icon{width:32px;height:32px;flex-basis:32px}.stat-icon svg{width:16px}.period-chip{font-size:8px;padding:5px 7px}.chart-wrap{padding-left:8px;padding-right:8px}.impact-chart{min-height:155px}.chart-score{right:16px;top:16px}.engagement-body{grid-template-columns:1fr}.africa-mark{height:125px}.africa-svg{width:72px;height:115px}.region-list{gap:9px}.region-row{grid-template-columns:82px minmax(40px,1fr) 27px}.activity-copy span{max-width:180px}.tools-heading h3{font-size:16px}}
@media(prefers-reduced-motion:reduce){.reference-dashboard *{scroll-behavior:auto!important;transition:none!important}}
`;
