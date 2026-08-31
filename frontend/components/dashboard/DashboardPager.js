"use client";

import Link from "next/link";

export const DASHBOARD_PAGES = [
  { href: "/super-admin/dashboard", label: "Overview", short: "01", icon: "⌂" },
  { href: "/super-admin/dashboard/intelligence", label: "Intelligence", short: "02", icon: "✦" },
  { href: "/super-admin/dashboard/operations", label: "Operations", short: "03", icon: "ϟ" },
  { href: "/super-admin/dashboard/oversight", label: "Oversight", short: "04", icon: "◈" },
];

export default function DashboardPager({ current }) {
  const index = DASHBOARD_PAGES.findIndex((page) => page.href === current);
  const safeIndex = index < 0 ? 0 : index;
  const previous = DASHBOARD_PAGES[(safeIndex - 1 + DASHBOARD_PAGES.length) % DASHBOARD_PAGES.length];
  const next = DASHBOARD_PAGES[(safeIndex + 1) % DASHBOARD_PAGES.length];

  return (
    <div className="dashboard-pager">
      <div className="pager-track" aria-label="Dashboard sections">
        {DASHBOARD_PAGES.map((page, i) => (
          <Link key={page.href} href={page.href} className={`pager-step ${i === safeIndex ? "active" : ""}`} aria-current={i === safeIndex ? "page" : undefined}>
            <span className="step-icon">{page.icon}</span>
            <span><small>{page.short}</small><strong>{page.label}</strong></span>
          </Link>
        ))}
      </div>
      <div className="pager-controls">
        <Link href={previous.href} className="pager-button" aria-label={`Previous: ${previous.label}`}><span>←</span><span className="pager-button-copy"><small>Previous</small><strong>{previous.label}</strong></span></Link>
        <div className="pager-position"><span>{String(safeIndex + 1).padStart(2, "0")}</span><i>/</i><span>{String(DASHBOARD_PAGES.length).padStart(2, "0")}</span></div>
        <Link href={next.href} className="pager-button next" aria-label={`Next: ${next.label}`}><span className="pager-button-copy"><small>Next</small><strong>{next.label}</strong></span><span>→</span></Link>
      </div>
      <style jsx>{`
        .dashboard-pager{margin:0 0 18px;padding:10px;border:1px solid rgba(214,173,53,.42);border-radius:20px;background:rgba(2,45,22,.72);box-shadow:0 14px 38px rgba(0,0,0,.18);backdrop-filter:blur(14px);animation:pagerIn .45s ease both}.pager-track{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.pager-step{display:flex;align-items:center;gap:9px;min-width:0;padding:10px 12px;border:1px solid rgba(255,255,255,.08);border-radius:13px;color:#cbd9d0;text-decoration:none;transition:transform .2s ease,background .2s ease,border-color .2s ease}.pager-step:hover{transform:translateY(-2px);border-color:rgba(240,205,97,.55);background:rgba(255,255,255,.06)}.pager-step.active{background:linear-gradient(135deg,rgba(7,95,43,.95),rgba(10,73,38,.7));border-color:#f0cd61;color:#fff;box-shadow:0 8px 22px rgba(0,0,0,.16)}.step-icon{width:34px;height:34px;display:grid;place-items:center;flex:0 0 34px;border:1px solid rgba(240,205,97,.45);border-radius:10px;color:#f0cd61;font-size:16px}.pager-step small{display:block;color:#91a99d;font-size:7px;letter-spacing:1px;font-weight:900}.pager-step strong{display:block;margin-top:2px;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pager-controls{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;margin-top:9px;padding-top:9px;border-top:1px solid rgba(255,255,255,.07)}.pager-button{display:flex;align-items:center;gap:9px;min-width:0;padding:8px 10px;border:1px solid rgba(240,205,97,.24);border-radius:11px;color:#fff;text-decoration:none;background:rgba(255,255,255,.025);transition:all .2s ease}.pager-button:hover{border-color:#f0cd61;background:rgba(240,205,97,.08);transform:translateX(-2px)}.pager-button.next{justify-content:flex-end}.pager-button.next:hover{transform:translateX(2px)}.pager-button>span:last-child,.pager-button>span:first-child{color:#f0cd61;font-size:17px}.pager-button-copy small{display:block;color:#8fa399;font-size:7px;text-transform:uppercase;letter-spacing:1px}.pager-button-copy strong{display:block;margin-top:2px;font-size:10px}.pager-position{display:flex;align-items:center;gap:5px;color:#8fa399;font-size:10px}.pager-position span:first-child{color:#f0cd61;font-weight:900}.pager-position i{font-style:normal;opacity:.5}@keyframes pagerIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}@media(max-width:650px){.pager-track{grid-template-columns:repeat(2,minmax(0,1fr))}.pager-step{padding:8px}.pager-controls{grid-template-columns:1fr auto 1fr}.pager-button-copy{display:none}.pager-button{justify-content:center}.pager-button.next{justify-content:center}}@media(prefers-reduced-motion:reduce){.dashboard-pager,.pager-step,.pager-button{animation:none;transition:none}}
      `}</style>
    </div>
  );
}
