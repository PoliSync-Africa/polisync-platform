"use client";

import DashboardShell from "../../../components/dashboard/DashboardShell";

const CARDS = [
  ["✦", "AI Personal Assistant", "How can I help you today?", "/super-admin/dashboard/intelligence", "ai"],
  ["✓", "Pending Approvals", "", "/super-admin/dashboard/operations", "approvals"],
  ["ϟ", "Quick Actions", "", "/super-admin/dashboard/operations", "quick"],
  ["▥", "Results Overview", "", "/super-admin/results/live", "results"],
  ["◇", "System Health", "", "/super-admin/dashboard/oversight", "health"],
  ["◉", "Results History", "All organizational election results history", "/super-admin/results/history", "history"],
  ["☁", "Weather", "", "/super-admin/dashboard/operations", "weather"],
];

export default function SuperAdminDashboard() {
  return (
    <DashboardShell role="super_admin" title="Super Admin Dashboard" subtitle="Platform overview and control center" activeSection="overview">
      <main className="dashboard-home">
        <section className="dashboard-grid" aria-label="Super Admin dashboard components">
          {CARDS.map(([icon, title, description, href, kind]) => (
            <a href={href} className={`dashboard-card ${kind}`} key={title}>
              <div className="card-icon" aria-hidden="true">{icon}</div>
              <div className="card-content">
                <h2>{title}</h2>
                {description ? <p>{description}</p> : null}
              </div>
              <span className="card-arrow" aria-hidden="true">›</span>
            </a>
          ))}
        </section>

        <div className="dashboard-search-wrap">
          <div className="dashboard-search" role="search">
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input aria-label="Search PoliSync" placeholder="Search candidates, parties, constituencies, polling stations..." />
            <button type="button" aria-label="Open search filters">☷</button>
          </div>
        </div>
      </main>

      <style jsx>{styles}</style>
    </DashboardShell>
  );
}

const styles = `
.dashboard-home{min-height:100%;box-sizing:border-box;padding:clamp(18px,3vw,40px);background-color:#002d18;background-image:linear-gradient(rgba(240,201,79,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(240,201,79,.055) 1px,transparent 1px),radial-gradient(circle at 15% 10%,rgba(18,120,65,.3),transparent 28%),radial-gradient(circle at 88% 80%,rgba(240,205,97,.08),transparent 26%);background-size:44px 44px,44px 44px,auto,auto;color:#fff;overflow-x:hidden}
.dashboard-grid{width:min(100%,1180px);margin:0 auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(18px,2vw,28px)}
.dashboard-card{position:relative;min-height:238px;box-sizing:border-box;display:flex;align-items:center;gap:clamp(18px,2.2vw,30px);padding:clamp(24px,3vw,42px);border:2px solid #f0c94f;border-radius:27px;background:radial-gradient(circle at 70% 45%,rgba(12,110,57,.26),transparent 45%),linear-gradient(145deg,#063f23 0%,#002d18 100%);color:#fff!important;text-decoration:none!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.04),0 10px 26px rgba(0,0,0,.18);overflow:hidden;transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease}
.dashboard-card::before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 20%,rgba(255,255,255,.035) 50%,transparent 80%);transform:translateX(-100%);transition:transform .5s ease}
.dashboard-card:hover{transform:translateY(-4px);border-color:#ffe27a;box-shadow:inset 0 0 0 1px rgba(255,255,255,.05),0 18px 38px rgba(0,0,0,.28)}
.dashboard-card:hover::before{transform:translateX(100%)}
.card-icon{width:clamp(82px,8vw,112px);height:clamp(82px,8vw,112px);flex:0 0 clamp(82px,8vw,112px);display:grid;place-items:center;box-sizing:border-box;border:3px solid #f0c94f;border-radius:50%;background:rgba(0,43,24,.72);color:#ffd45a;font-size:clamp(38px,4vw,56px);line-height:1;box-shadow:0 7px 18px rgba(0,0,0,.22)}
.card-content{min-width:0;padding-right:28px}.card-content h2{margin:0;color:#fff;font-size:clamp(25px,2.5vw,39px);line-height:1.12;font-weight:850;letter-spacing:-.7px;text-shadow:0 2px 6px rgba(0,0,0,.24)}
.card-content p{margin:9px 0 0;max-width:360px;color:#fff;font-size:clamp(15px,1.5vw,20px);line-height:1.45;font-weight:450}
.card-arrow{position:absolute;right:24px;bottom:22px;width:52px;height:52px;display:grid;place-items:center;border:1px solid rgba(240,201,79,.65);border-radius:50%;background:rgba(0,76,39,.78);color:#fff;font-size:43px;line-height:1;font-weight:300;transition:transform .2s ease,background .2s ease}.dashboard-card:hover .card-arrow{transform:translateX(3px);background:rgba(8,103,52,.95)}
.dashboard-search-wrap{width:min(100%,1180px);margin:clamp(20px,3vw,34px) auto 0;padding:0 0 4px}.dashboard-search{display:flex;align-items:center;gap:12px;width:100%;min-height:58px;padding:7px 9px 7px 18px;box-sizing:border-box;border:2px solid #d6aa35;border-radius:18px;background:#f0c94f;color:#002d18;box-shadow:0 10px 28px rgba(0,0,0,.22);transition:transform .2s ease,box-shadow .2s ease}.dashboard-search:focus-within{transform:translateY(-2px);box-shadow:0 14px 32px rgba(0,0,0,.28)}.search-icon{font-size:25px;font-weight:900}.dashboard-search input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:#002d18;font:700 14px/1.3 inherit}.dashboard-search input::placeholder{color:#163c29;opacity:.82}.dashboard-search button{width:42px;height:42px;flex:0 0 42px;border:1px solid rgba(0,45,24,.28);border-radius:12px;background:#002d18;color:#f0c94f;font-size:21px;cursor:pointer}
@media(max-width:760px){.dashboard-home{padding:14px}.dashboard-grid{grid-template-columns:1fr;gap:16px}.dashboard-card{min-height:190px;padding:22px;border-radius:22px}.card-icon{width:76px;height:76px;flex-basis:76px;border-width:2px;font-size:37px}.card-content h2{font-size:26px}.card-content p{font-size:15px}.card-arrow{right:17px;bottom:16px;width:44px;height:44px;font-size:36px}.dashboard-search{min-height:52px;border-radius:15px;padding-left:14px}.dashboard-search input{font-size:12px}.dashboard-search button{width:38px;height:38px;flex-basis:38px}}
@media(max-width:430px){.dashboard-card{min-height:170px;gap:15px;padding:18px}.card-icon{width:64px;height:64px;flex-basis:64px;font-size:31px}.card-content{padding-right:30px}.card-content h2{font-size:22px;letter-spacing:-.3px}.card-content p{font-size:13px}.dashboard-search input{font-size:11px}.dashboard-search{min-height:50px}}
@media(prefers-reduced-motion:reduce){.dashboard-card,.dashboard-card::before,.card-arrow,.dashboard-search{transition:none}}
`;