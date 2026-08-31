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

      <div className="pager-controls" aria-label="Dashboard pager controls">
        <Link href={previous.href} className="pager-button" aria-label={`Previous: ${previous.label}`}>
          <span className="pager-arrow">‹</span>
          <span className="pager-label">Previous</span>
        </Link>

        <div className="pager-indicator" aria-live="polite">
          <strong>{String(safeIndex + 1).padStart(2, "0")}</strong>
          <span>/</span>
          <span>{String(DASHBOARD_PAGES.length).padStart(2, "0")}</span>
        </div>

        <Link href={next.href} className="pager-button" aria-label={`Next: ${next.label}`}>
          <span className="pager-label">Next</span>
          <span className="pager-arrow">›</span>
        </Link>
      </div>

      <style jsx>{`
        .dashboard-pager {
          margin: 0 0 20px;
          padding: 12px;
          border: 1px solid #f0cd61;
          border-radius: 20px;
          background: linear-gradient(180deg, rgba(3,43,22,.96), rgba(4,57,28,.96));
          box-shadow: 0 16px 34px rgba(0,0,0,.16);
        }

        .pager-track {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
        }

        .pager-step {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          padding: 11px 12px;
          border: 1px solid rgba(240,205,97,.3);
          border-radius: 13px;
          color: #ffffff !important;
          text-decoration: none !important;
          font-size: 16px;
          line-height: 1.2;
          font-weight: 800;
          transition: transform 180ms ease, background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
        }

        .pager-step:hover {
          transform: translateY(-1px);
          background: rgba(255,255,255,.05);
          border-color: #f0cd61;
          box-shadow: 0 8px 20px rgba(0,0,0,.12);
        }

        .pager-step.active {
          background: #075f2b;
          border-color: #f6d66d;
          color: #ffffff !important;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.06), 0 8px 22px rgba(0,0,0,.14);
        }

        .step-icon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          flex: 0 0 38px;
          border: 1px solid rgba(240,205,97,.55);
          border-radius: 11px;
          color: #f6d66d;
          font-size: 18px;
          font-weight: 900;
        }

        .pager-controls {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 12px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(255,255,255,.1);
        }

        .pager-button {
          min-width: 112px;
          height: 38px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 12px;
          border: 1px solid #f0cd61;
          border-radius: 11px;
          background: rgba(7,95,43,.55);
          color: #ffffff !important;
          text-decoration: none !important;
          font-size: 12px;
          line-height: 1;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .35px;
          transition: transform 180ms ease, background-color 180ms ease, box-shadow 180ms ease;
        }

        .pager-button:last-child { justify-self: end; }

        .pager-button:hover {
          transform: translateY(-1px);
          background: #0a7135;
          box-shadow: 0 8px 18px rgba(0,0,0,.14);
        }

        .pager-arrow {
          color: #f6d66d;
          font-size: 24px;
          font-weight: 500;
          line-height: .8;
        }

        .pager-label {
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
        }

        .pager-indicator {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 7px;
          color: rgba(255,255,255,.78);
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }

        .pager-indicator strong {
          color: #f6d66d;
          font-size: 16px;
        }

        @media (max-width: 650px) {
          .pager-track { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .pager-step { font-size: 14px; padding: 10px; }
          .step-icon { width: 34px; height: 34px; flex-basis: 34px; }
          .pager-button { min-width: 96px; }
        }

        @media (max-width: 420px) {
          .pager-controls { gap: 7px; }
          .pager-button { min-width: 84px; padding: 0 8px; }
          .pager-label { font-size: 9px; }
          .pager-arrow { font-size: 21px; }
          .pager-indicator { font-size: 9px; gap: 5px; }
          .pager-indicator strong { font-size: 14px; }
        }
      `}</style>
    </div>
  );
}
