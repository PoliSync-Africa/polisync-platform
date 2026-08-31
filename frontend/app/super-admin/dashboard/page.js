"use client";

import DashboardShell from "../../../components/dashboard/DashboardShell";
import DashboardPager from "../../../components/dashboard/DashboardPager";

const STATS = [
  ["Users", "0", "👥", "/super-admin/users"],
  ["Organizations", "0", "🏢", "/super-admin/organizations"],
  ["Candidates", "0", "♟", "/super-admin/candidates"],
  ["Elections", "0", "▣", "/super-admin/elections"],
  ["Polling Stations", "0", "⌖", "/super-admin/polling-stations"],
  ["Results Submitted", "0", "📊", "/super-admin/results/live"],
];

const DESTINATIONS = [
  ["✦", "Intelligence", "AI analysis, assistant and results explorer", "/super-admin/dashboard/intelligence"],
  ["ϟ", "Operations", "Approvals, quick actions, weather and reminders", "/super-admin/dashboard/operations"],
  ["◈", "Oversight", "Notifications, complaints, privacy and system health", "/super-admin/dashboard/oversight"],
];

export default function SuperAdminDashboard() {
  return (
    <DashboardShell role="super_admin" title="Super Admin Dashboard" subtitle="Platform overview and control center" activeSection="overview">
      <main className="page">
        <DashboardPager current="/super-admin/dashboard" />

        <section className="hero">
          <div>
            <span>POLISYNC AFRICA • SUPER ADMIN</span>
            <h2>One clear view of the platform.</h2>
            <p>The overview is intentionally focused. Detailed intelligence, operations and oversight now live on dedicated dashboard pages.</p>
          </div>
          <div className="badge">SA</div>
        </section>

        <section className="stats" aria-label="Platform statistics">
          {STATS.map(([label, value, icon, href]) => (
            <a href={href} className="stat" key={label}>
              <span className="stat-icon">{icon}</span>
              <div>
                <small>{label}</small>
                <strong>{value}</strong>
              </div>
              <i>→</i>
            </a>
          ))}
        </section>

        <section className="section-head">
          <div>
            <small>DASHBOARD WORKSPACES</small>
            <h3>Choose a workspace</h3>
          </div>
        </section>

        <section className="destinations" aria-label="Dashboard workspaces">
          {DESTINATIONS.map(([icon, title, desc, href]) => (
            <a href={href} className="destination" key={title}>
              <div className="destination-icon">{icon}</div>
              <div className="destination-copy">
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
              <div className="arrow">↗</div>
            </a>
          ))}
        </section>

        <section className="principle">
          <div className="principle-mark">P</div>
          <div>
            <small>POLISYNC DESIGN PRINCIPLE</small>
            <h3>Less clutter. More control.</h3>
            <p>Each dashboard workspace keeps related tools together, with consistent navigation and a simple Previous / Next flow.</p>
          </div>
        </section>
      </main>

      <style jsx>{styles}</style>
    </DashboardShell>
  );
}

const styles = `
.page{min-height:100%;padding:clamp(12px,2vw,30px);box-sizing:border-box;background:radial-gradient(circle at 10% 0%,rgba(34,150,83,.2),transparent 30%),radial-gradient(circle at 90% 90%,rgba(214,173,53,.1),transparent 25%),#022d16;color:#fff}
.hero{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:14px 2px 24px}
.hero span,.section-head small,.principle small{color:#fff;font-size:9px;font-weight:950;letter-spacing:2px}
.hero h2{max-width:760px;margin:7px 0 5px;color:#fff;font-size:clamp(26px,3.5vw,44px);line-height:1.03;letter-spacing:-.8px}
.hero p{max-width:720px;margin:0;color:#fff;font-size:12px;line-height:1.65}
.badge{width:64px;height:64px;display:grid;place-items:center;flex:0 0 64px;border:2px solid #f0cd61;border-radius:50%;background:linear-gradient(145deg,#075f2b,#043d1d);color:#fff;font-weight:950;box-shadow:0 12px 28px rgba(0,0,0,.2)}
.stats{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));grid-auto-rows:1fr;gap:10px}
.stat{min-width:0;display:flex;align-items:center;gap:9px;padding:12px;border:1px solid rgba(240,205,97,.3);border-radius:15px;background:rgba(7,95,43,.72);color:#fff!important;text-decoration:none!important;transition:transform .2s ease,border-color .2s ease,background .2s ease}
.stat:hover{transform:translateY(-3px);border-color:#f0cd61;background:rgba(7,95,43,.95)}
.stat-icon{width:37px;height:37px;display:grid;place-items:center;flex:0 0 37px;border:1px solid rgba(240,205,97,.55);border-radius:11px;color:#f0cd61}
.stat small{display:block;color:#fff;font-size:7px;font-weight:850;text-transform:uppercase}
.stat strong{display:block;margin-top:3px;color:#fff;font-size:20px}
.stat i{margin-left:auto;color:#fff;font-style:normal}
.section-head{display:flex;justify-content:space-between;align-items:end;margin:27px 2px 10px}
.section-head h3{margin:4px 0 0;color:#fff;font-size:21px}
.destinations{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:1fr;gap:12px}
.destination{position:relative;min-width:0;min-height:185px;padding:19px;display:flex;flex-direction:column;border:1px solid rgba(240,205,97,.38);border-radius:20px;background:linear-gradient(150deg,rgba(7,95,43,.94),rgba(2,45,22,.98));color:#fff!important;text-decoration:none!important;overflow:hidden;transition:transform .25s ease,border-color .25s ease,box-shadow .25s ease}
.destination:after{content:"";position:absolute;width:130px;height:130px;right:-60px;bottom:-70px;border:1px solid rgba(240,205,97,.15);border-radius:50%}
.destination:hover{transform:translateY(-5px);border-color:#f0cd61;box-shadow:0 18px 38px rgba(0,0,0,.22)}
.destination-icon{width:48px;height:48px;display:grid;place-items:center;margin-top:0;border:1px solid #f0cd61;border-radius:14px;color:#f0cd61;font-size:21px}
.destination-copy{margin-top:auto}
.destination h4{margin:13px 0 3px;color:#fff;font-size:18px}
.destination p{margin:0;max-width:260px;color:#fff;font-size:10px;line-height:1.5}
.arrow{position:absolute;right:18px;top:18px;color:#fff;font-size:19px}
.principle{display:flex;align-items:center;gap:14px;margin-top:14px;padding:16px 18px;border:1px solid rgba(240,205,97,.2);border-radius:17px;background:rgba(0,0,0,.12);color:#fff}
.principle-mark{width:38px;height:38px;display:grid;place-items:center;flex:0 0 38px;border-radius:50%;background:#f0cd61;color:#022d16;font-weight:950}
.principle h3{margin:3px 0;color:#fff;font-size:14px}
.principle p{margin:3px 0 0;color:#fff;font-size:9px;line-height:1.5}
@media(max-width:1100px){.stats{grid-template-columns:repeat(3,minmax(0,1fr))}.destinations{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:700px){.stats{grid-template-columns:repeat(2,minmax(0,1fr))}.destinations{grid-template-columns:1fr}.hero{align-items:flex-start}.badge{width:48px;height:48px;flex-basis:48px}.stat{padding:9px}.stat-icon{width:32px;height:32px;flex-basis:32px}.stat strong{font-size:17px}.principle{align-items:flex-start}}
@media(prefers-reduced-motion:reduce){.stat,.destination{transition:none}}
`;
