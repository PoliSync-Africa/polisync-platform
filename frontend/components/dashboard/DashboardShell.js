"use client";

import { useState } from "react";
import superAdminNavigation from "./superAdminNavigation";
export default function DashboardShell({
  export default function DashboardShell({
  children,
  title = "Dashboard",
  subtitle = "",
  role = "user",
  navigation = null,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="polisync-dashboard">
      {/* ======================================================
          MOBILE OVERLAY
      ====================================================== */}

      {sidebarOpen && (
        <button
          type="button"
          className="dashboard-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`dashboard-sidebar ${
          sidebarOpen ? "dashboard-sidebar-open" : ""
        }`}
      >
        <div className="dashboard-brand">
          <div className="dashboard-brand-mark">P</div>

          <div>
            <div className="dashboard-brand-name">
              POLISYNC AFRICA
            </div>

            <div className="dashboard-brand-subtitle">
              Political Intelligence Platform
            </div>
          </div>
        </div>

        <nav className="dashboard-navigation">
          <nav className="dashboard-navigation">
  {(navigation || (role === "super_admin" ? superAdminNavigation : [])).map(
    (section, sectionIndex) => (
      <div key={section.section || sectionIndex}>
        {section.section && (
          <div className="dashboard-nav-section">
            {section.section}
          </div>
        )}

        {section.items?.map((item) => (
          <a
            key={item.key || item.href}
            href={item.href}
            className={`dashboard-nav-item ${
              item.active ? "dashboard-nav-item-active" : ""
            }`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="dashboard-nav-icon">
              {item.icon}
            </span>

            <span>{item.label}</span>

            {item.badge && (
              <span
                style={{
                  marginLeft: "auto",
                  minWidth: "20px",
                  height: "20px",
                  padding: "0 6px",
                  borderRadius: "999px",
                  background: "#C9A227",
                  color: "#ffffff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: "800",
                }}
              >
                !
              </span>
            )}
          </a>
        ))}
      </div>
    )
  )}
</nav>
      
        <div className="dashboard-sidebar-footer">
          <div className="dashboard-role-label">
            CURRENT ROLE
          </div>

          <div className="dashboard-role">
            {formatRole(role)}
          </div>

          <button
            type="button"
            className="dashboard-logout"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* ======================================================
          MAIN AREA
      ====================================================== */}

      <div className="dashboard-main">
        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="dashboard-header">
          <button
            type="button"
            className="dashboard-menu-button"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          <div className="dashboard-header-title">
            <h1>{title}</h1>

            {subtitle && (
              <p>{subtitle}</p>
            )}
          </div>

          <div className="dashboard-header-actions">
            {/* Weather */}

            <div className="dashboard-weather">
              <span className="dashboard-weather-icon">
                ☀️
              </span>

              <div>
                <strong>--°C</strong>
                <small>Location unavailable</small>
              </div>
            </div>

            {/* Notifications */}

            <button
              type="button"
              className="dashboard-header-button"
              aria-label="Notifications"
            >
              🔔
              <span className="dashboard-notification-dot" />
            </button>

            {/* Messages */}

            <button
              type="button"
              className="dashboard-header-button"
              aria-label="Messages"
            >
              💬
            </button>

            {/* Profile */}

            <button
              type="button"
              className="dashboard-profile-button"
              aria-label="Open profile"
            >
              <span className="dashboard-avatar">
                P
              </span>

              <span className="dashboard-profile-text">
                <strong>PoliSync User</strong>
                <small>{formatRole(role)}</small>
              </span>
            </button>
          </div>
        </header>

        {/* ====================================================
            CONTENT
        ==================================================== */}

        <main className="dashboard-content">
          {children}
        </main>
      </div>

      {/* ======================================================
          STYLES
      ====================================================== */}

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f7faf8;
        }

        .polisync-dashboard {
          min-height: 100vh;
          display: flex;
          background: #f7faf8;
          color: #17231c;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        /* ====================================================
           SIDEBAR
        ==================================================== */

        .dashboard-sidebar {
          position: fixed;
          inset: 0 auto 0 0;
          width: 270px;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border-right: 1px solid #e7ece8;
          z-index: 100;
          overflow-y: auto;
        }

        .dashboard-brand {
          min-height: 82px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px 20px;
          border-bottom: 1px solid #edf1ee;
        }

        .dashboard-brand-mark {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #075f2b;
          color: #ffffff;
          font-size: 22px;
          font-weight: 800;
          border: 2px solid #c9a227;
        }

        .dashboard-brand-name {
          color: #075f2b;
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 0.4px;
        }

        .dashboard-brand-subtitle {
          margin-top: 3px;
          color: #7a837d;
          font-size: 10px;
        }

        .dashboard-navigation {
          flex: 1;
          padding: 18px 12px;
        }

        .dashboard-nav-section {
          margin: 23px 10px 8px;
          color: #9aa39d;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .dashboard-nav-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 44px;
          margin: 3px 0;
          padding: 10px 13px;
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: #536059;
          font-size: 14px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
        }

        .dashboard-nav-item:hover {
          background: #f1f7f3;
          color: #075f2b;
        }

        .dashboard-nav-item-active {
          background: #eaf5ee;
          color: #075f2b;
          font-weight: 800;
        }

        .dashboard-nav-icon {
          width: 23px;
          text-align: center;
          font-size: 17px;
        }

        .dashboard-sidebar-footer {
          padding: 16px;
          border-top: 1px solid #edf1ee;
        }

        .dashboard-role-label {
          color: #9aa39d;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .dashboard-role {
          margin-top: 4px;
          color: #075f2b;
          font-size: 13px;
          font-weight: 800;
        }

        .dashboard-logout {
          width: 100%;
          margin-top: 12px;
          padding: 10px;
          border: 1px solid #e2e8e4;
          border-radius: 9px;
          background: #ffffff;
          color: #68736c;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        /* ====================================================
           MAIN
        ==================================================== */

        .dashboard-main {
          width: calc(100% - 270px);
          margin-left: 270px;
          min-height: 100vh;
        }

        /* ====================================================
           HEADER
        ==================================================== */

        .dashboard-header {
          min-height: 82px;
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 14px 28px;
          background: #ffffff;
          border-bottom: 1px solid #e7ece8;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .dashboard-header-title {
          flex: 1;
          min-width: 0;
        }

        .dashboard-header-title h1 {
          margin: 0;
          color: #075f2b;
          font-size: 23px;
          line-height: 1.2;
          font-weight: 850;
        }

        .dashboard-header-title p {
          margin: 5px 0 0;
          color: #7a837d;
          font-size: 12px;
        }

        .dashboard-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .dashboard-weather {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 11px;
          border: 1px solid #e6ece8;
          border-radius: 11px;
          background: #fbfdfb;
        }

        .dashboard-weather-icon {
          font-size: 20px;
        }

        .dashboard-weather strong {
          display: block;
          color: #075f2b;
          font-size: 13px;
        }

        .dashboard-weather small {
          display: block;
          margin-top: 1px;
          color: #8a928d;
          font-size: 9px;
        }

        .dashboard-header-button {
          position: relative;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e6ece8;
          border-radius: 10px;
          background: #ffffff;
          cursor: pointer;
          font-size: 17px;
        }

        .dashboard-header-button:hover {
          background: #f2f7f4;
        }

        .dashboard-notification-dot {
          position: absolute;
          width: 7px;
          height: 7px;
          top: 8px;
          right: 8px;
          border-radius: 50%;
          background: #c9a227;
          border: 1px solid #ffffff;
        }

        .dashboard-profile-button {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 5px 8px 5px 5px;
          border: 1px solid #e6ece8;
          border-radius: 12px;
          background: #ffffff;
          cursor: pointer;
        }

        .dashboard-avatar {
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #075f2b;
          color: #ffffff;
          font-weight: 800;
        }

        .dashboard-profile-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .dashboard-profile-text strong {
          color: #29332d;
          font-size: 11px;
        }

        .dashboard-profile-text small {
          margin-top: 2px;
          color: #89928c;
          font-size: 9px;
        }

        .dashboard-menu-button {
          display: none;
          width: 40px;
          height: 40px;
          border: 1px solid #e6ece8;
          border-radius: 10px;
          background: #ffffff;
          font-size: 20px;
          cursor: pointer;
        }

        /* ====================================================
           CONTENT
        ==================================================== */

        .dashboard-content {
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
          padding: 28px;
        }

        .dashboard-overlay {
          display: none;
        }

        /* ====================================================
           TABLET
        ==================================================== */

        @media (max-width: 1100px) {
          .dashboard-sidebar {
            width: 235px;
          }

          .dashboard-main {
            width: calc(100% - 235px);
            margin-left: 235px;
          }

          .dashboard-header {
            padding: 14px 20px;
          }

          .dashboard-content {
            padding: 22px 20px;
          }

          .dashboard-profile-text {
            display: none;
          }
        }

        /* ====================================================
           MOBILE
        ==================================================== */

        @media (max-width: 760px) {
          .dashboard-sidebar {
            transform: translateX(-100%);
            transition: transform 0.2s ease;
            width: min(290px, 86vw);
          }

          .dashboard-sidebar-open {
            transform: translateX(0);
          }

          .dashboard-main {
            width: 100%;
            margin-left: 0;
          }

          .dashboard-menu-button {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .dashboard-header {
            min-height: 70px;
            gap: 9px;
            padding: 10px 14px;
          }

          .dashboard-header-title h1 {
            font-size: 18px;
          }

          .dashboard-header-title p {
            display: none;
          }

          .dashboard-weather {
            display: none;
          }

          .dashboard-header-button {
            width: 37px;
            height: 37px;
          }

          .dashboard-profile-button {
            padding: 4px;
            border: 0;
          }

          .dashboard-content {
            padding: 16px 13px 28px;
          }

          .dashboard-overlay {
            position: fixed;
            inset: 0;
            display: block;
            padding: 0;
            border: 0;
            background: rgba(0, 0, 0, 0.28);
            z-index: 90;
          }
        }

        /* ====================================================
           SMALL PHONES
        ==================================================== */

        @media (max-width: 420px) {
          .dashboard-header-actions {
            gap: 4px;
          }

          .dashboard-header-button {
            width: 34px;
            height: 34px;
            font-size: 15px;
          }

          .dashboard-avatar {
            width: 32px;
            height: 32px;
          }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
   NAVIGATION ITEM
============================================================ */

function DashboardNavItem({
  icon,
  label,
  active = false,
}) {
  return (
    <button
      type="button"
      className={`dashboard-nav-item ${
        active ? "dashboard-nav-item-active" : ""
      }`}
    >
      <span className="dashboard-nav-icon">
        {icon}
      </span>

      <span>{label}</span>
    </button>
  );
}

/* ============================================================
   ROLE FORMATTER
============================================================ */

function formatRole(role) {
  if (!role) {
    return "User";
  }

  return String(role)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
