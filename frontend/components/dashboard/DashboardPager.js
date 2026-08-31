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
    <nav className="dashboard-pager" aria-label="Dashboard sections">
      <div className="pager-track">
        {DASHBOARD_PAGES.map((page, i) => (
          <Link
            key={page.href}
            href={page.href}
            className={`pager-step ${i === safeIndex ? "active" : ""}`}
            aria-current={i === safeIndex ? "page" : undefined}
          >
            <span className="step-icon" aria-hidden="true">{page.icon}</span>
            <span className="step-copy">
              <strong>{page.label}</strong>
              <small>Workspace</small>
            </span>
          </Link>
        ))}
      </div>

      <div className="pager-controls">
        <Link href={previous.href} className="pager-button" aria-label={`Previous: ${previous.label}`}>
          <span aria-hidden="true">‹</span>
          <span>Previous</span>
        </Link>
        <div className="pager-position" aria-hidden="true">
          <span>{String(safeIndex + 1).padStart(2, "0")}</span>
          <i>/</i>
          <span>{String(DASHBOARD_PAGES.length).padStart(2, "0")}</span>
        </div>
        <Link href={next.href} className="pager-button pager-button-next" aria-label={`Next: ${next.label}`}>
          <span>Next</span>
          <span aria-hidden="true">›</span>
        </Link>
      </div>

      <style jsx>{`
        .dashboard-pager {
          margin: 0 0 22px;
          padding: 14px;
          border: 1px solid rgba(232, 193, 66, 0.78);
          border-radius: 22px;
          background: linear-gradient(180deg, rgba(3, 49, 24, 0.98), rgba(2, 39, 19, 0.98));
          box-shadow: 0 16px 34px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255,255,255,.03);
        }

        .pager-track {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .pager-step {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 12px 13px;
          border: 1px solid rgba(214, 181, 62, 0.36);
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.015);
          color: #fff !important;
          text-decoration: none !important;
          transition: transform 180ms cubic-bezier(.2,.8,.2,1), background 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
        }

        .pager-step:hover {
          transform: translateY(-2px);
          background: rgba(255,255,255,.045);
          border-color: rgba(242,210,101,.9);
          box-shadow: 0 10px 20px rgba(0,0,0,.14);
        }

        .pager-step.active {
          background: linear-gradient(180deg, rgba(10, 101, 47, .98), rgba(6, 80, 37, .98));
          border-color: #f0cd61;
          box-shadow: 0 8px 18px rgba(0,0,0,.16), inset 0 1px 0 rgba(255,255,255,.05);
        }

        .step-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          flex: 0 0 42px;
          border: 1px solid rgba(240,205,97,.72);
          border-radius: 13px;
          color: #f7d96b;
          background: rgba(0, 0, 0, .08);
          font-size: 20px;
          line-height: 1;
        }

        .step-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .step-copy strong {
          color: #fff;
          font-size: 15px;
          line-height: 1.2;
          font-weight: 850;
          letter-spacing: -.1px;
        }

        .step-copy small {
          color: rgba(255,255,255,.66);
          font-size: 9px;
          line-height: 1.2;
        }

        .pager-controls {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 12px;
          margin-top: 13px;
          padding-top: 13px;
          border-top: 1px solid rgba(255,255,255,.08);
        }

        .pager-button {
          display: inline-flex;
          align-items: center;
          justify-content: flex-start;
          gap: 8px;
          min-height: 42px;
          padding: 0 14px;
          border: 1px solid rgba(240,205,97,.52);
          border-radius: 12px;
          background: rgba(255,255,255,.025);
          color: #fff !important;
          text-decoration: none !important;
          font-size: 11px;
          font-weight: 850;
          transition: transform 170ms cubic-bezier(.2,.8,.2,1), background 170ms ease, border-color 170ms ease;
        }

        .pager-button span:first-child {
          color: #f6d665;
          font-size: 22px;
          line-height: 1;
        }

        .pager-button:hover {
          transform: translateY(-1px);
          background: rgba(240,205,97,.10);
          border-color: #f0cd61;
        }

        .pager-button-next {
          justify-content: flex-end;
        }

        .pager-button-next span:last-child {
          color: #f6d665;
          font-size: 22px;
          line-height: 1;
        }

        .pager-position {
          display: flex;
          align-items: baseline;
          gap: 5px;
          color: rgba(255,255,255,.58);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .8px;
        }

        .pager-position span:first-child {
          color: #f6d665;
          font-size: 13px;
        }

        .pager-position i {
          font-style: normal;
          color: rgba(255,255,255,.35);
        }

        @media (max-width: 800px) {
          .pager-track { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 520px) {
          .dashboard-pager { padding: 10px; border-radius: 18px; }
          .pager-track { gap: 8px; }
          .pager-step { padding: 10px; gap: 9px; }
          .step-icon { width: 36px; height: 36px; flex-basis: 36px; font-size: 17px; }
          .step-copy strong { font-size: 13px; }
          .step-copy small { font-size: 8px; }
          .pager-controls { gap: 8px; }
          .pager-button { min-height: 38px; padding: 0 10px; font-size: 10px; }
          .pager-button span:first-child, .pager-button-next span:last-child { font-size: 19px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .pager-step, .pager-button { transition: none; }
        }
      `}</style>
    </nav>
  );
}
