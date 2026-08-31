"use client";

import Link from "next/link";

export const DASHBOARD_PAGES = [
  { href: "/super-admin/dashboard", label: "Overview", icon: "⌂" },
  { href: "/super-admin/dashboard/intelligence", label: "Intelligence", icon: "✦" },
  { href: "/super-admin/dashboard/operations", label: "Operations", icon: "ϟ" },
  { href: "/super-admin/dashboard/oversight", label: "Oversight", icon: "◈" },
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
          <Link
            key={page.href}
            href={page.href}
            className={`pager-step ${i === safeIndex ? "active" : ""}`}
            aria-current={i === safeIndex ? "page" : undefined}
          >
            <span className="step-icon">{page.icon}</span>
            <strong>{page.label}</strong>
          </Link>
        ))}
      </div>

      <div className="pager-controls">
        <Link href={previous.href} className="pager-button" aria-label={`Previous: ${previous.label}`}>
          ←
        </Link>
        <Link href={next.href} className="pager-button next" aria-label={`Next: ${next.label}`}>
          →
        </Link>
      </div>

      <style jsx>{`
        .dashboard-pager {
          margin: 0 0 18px;
          padding: 10px;
          border: 1px solid rgba(214,173,53,.42);
          border-radius: 20px;
          background: rgba(2,45,22,.72);
          box-shadow: 0 14px 38px rgba(0,0,0,.18);
          backdrop-filter: blur(14px);
        }

        .pager-track {
          display: grid;
          grid-template-columns: repeat(4,minmax(0,1fr));
          gap: 7px;
        }

        .pager-step {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
          padding: 10px 12px;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 13px;
          color: #fff !important;
          text-decoration: none !important;
          font-weight: 800;
          transition: transform .2s ease, background .2s ease, border-color .2s ease;
        }

        .pager-step:hover {
          transform: translateY(-2px);
          border-color: #f0cd61;
          background: rgba(255,255,255,.06);
        }

        .pager-step.active {
          background: rgba(7,95,43,.95);
          border-color: #f0cd61;
          color: #fff !important;
          box-shadow: 0 8px 22px rgba(0,0,0,.16);
        }

        .step-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          flex: 0 0 34px;
          border: 1px solid rgba(240,205,97,.45);
          border-radius: 10px;
          color: #f0cd61;
          font-size: 16px;
        }

        .pager-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 9px;
          padding-top: 9px;
          border-top: 1px solid rgba(255,255,255,.07);
        }

        .pager-button {
          width: 38px;
          height: 32px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(240,205,97,.28);
          border-radius: 10px;
          color: #fff !important;
          text-decoration: none !important;
          background: rgba(255,255,255,.025);
          font-size: 18px;
          font-weight: 800;
        }

        .pager-button:hover {
          border-color: #f0cd61;
          background: rgba(240,205,97,.08);
        }

        @media(max-width:650px) {
          .pager-track { grid-template-columns: repeat(2,minmax(0,1fr)); }
          .pager-step { padding: 9px; }
          .pager-step strong { font-size: 12px; }
        }
      `}</style>
    </div>
  );
}
