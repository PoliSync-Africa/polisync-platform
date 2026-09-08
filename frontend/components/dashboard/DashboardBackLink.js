"use client";

import { usePathname } from "next/navigation";

const ROOT_PATHS = new Set(["/", "/dashboard"]);

export default function DashboardBackLink() {
  const pathname = usePathname();

  if (!pathname || ROOT_PATHS.has(pathname)) return null;

  const goBack = () => {
    if (typeof window === "undefined") return;
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="dashboard-back-link-wrap">
      <a
        href="#previous-page"
        className="dashboard-back-link"
        onClick={(event) => {
          event.preventDefault();
          goBack();
        }}
        aria-label="Go to previous page"
      >
        <span aria-hidden="true">‹</span> BACK
      </a>
      <style jsx>{`
        .dashboard-back-link-wrap {
          position: fixed;
          top: 112px;
          left: 300px;
          z-index: 1050;
          pointer-events: none;
        }
        .dashboard-back-link {
          pointer-events: auto;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 2px;
          color: #075f2b;
          background: transparent;
          border: 0;
          text-decoration: none;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.2px;
          cursor: pointer;
        }
        .dashboard-back-link span {
          font-size: 17px;
          line-height: 10px;
          font-weight: 500;
        }
        .dashboard-back-link:hover {
          color: #9b7b12;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        @media (max-width: 900px) {
          .dashboard-back-link-wrap { left: 18px; top: 92px; }
        }
        @media (max-width: 520px) {
          .dashboard-back-link-wrap { top: 86px; left: 14px; }
          .dashboard-back-link { font-size: 9px; }
        }
      `}</style>
    </div>
  );
}
