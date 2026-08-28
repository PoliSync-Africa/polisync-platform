"use client";

import { useState } from "react";
import superAdminNavigation from "./superAdminNavigation";

export default function DashboardShell({
  children,
  title = "Dashboard",
  subtitle = "",
  role = "user",
  navigation = null,
  activeSection = "overview",
  onSectionChange = null,
  mobileMenuOpen = false,
  onMobileMenuClose = null,
}) {
  const [sidebarOpen, setSidebarOpen] =
    useState(mobileMenuOpen);

  const sections =
    navigation ||
    (role === "super_admin"
      ? superAdminNavigation
      : []);

  const closeSidebar = () => {
    setSidebarOpen(false);

    if (onMobileMenuClose) {
      onMobileMenuClose();
    }
  };

  const openSidebar = () => {
    setSidebarOpen(true);
  };

  const handleNavigation = (item) => {
    if (onSectionChange) {
      onSectionChange(
        item.key || item.href
      );
    }

    closeSidebar();
  };

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
          onClick={closeSidebar}
        />
      )}

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`dashboard-sidebar ${
          sidebarOpen
            ? "dashboard-sidebar-open"
            : ""
        }`}
      >
        {/* ==================================================
            BRAND
        ================================================== */}

        <div className="dashboard-brand">
          <div className="dashboard-brand-mark">
            P
          </div>

          <div>
            <div className="dashboard-brand-name">
              POLISYNC AFRICA
            </div>

            <div className="dashboard-brand-subtitle">
              Political Intelligence Platform
            </div>
          </div>
        </div>

        {/* ==================================================
            NAVIGATION
        ================================================== */}

        <nav className="dashboard-navigation">
          {sections.length > 0 ? (
            sections.map(
              (section, sectionIndex) => (
                <div
                  key={
                    section.section ||
                    sectionIndex
                  }
                >
                  {section.section && (
                    <div className="dashboard-nav-section">
                      {section.section}
                    </div>
                  )}

                  {section.items?.map(
                    (item) => {
                      const itemKey =
                        item.key ||
                        item.href ||
                        item.label;

                      const isActive =
                        activeSection ===
                        itemKey;

                      return (
                        <a
                          key={itemKey}
                          href={item.href || "#"}
                          className={`dashboard-nav-item ${
                            isActive
                              ? "dashboard-nav-item-active"
                              : ""
                          }`}
                          onClick={() =>
                            handleNavigation(
                              item
                            )
                          }
                        >
                          <span className="dashboard-nav-icon">
                            {item.icon}
                          </span>

                          <span className="dashboard-nav-label">
                            {item.label}
                          </span>

                          {item.badge && (
                            <span className="dashboard-nav-badge">
                              !
                            </span>
                          )}
                        </a>
                      );
                    }
                  )}
                </div>
              )
            )
          ) : (
            <>
              <DashboardNavItem
                href="#"
                icon="⌂"
                label="Dashboard"
                active={
                  activeSection ===
                  "overview"
                }
                onClick={() =>
                  onSectionChange?.(
                    "overview"
                  )
                }
              />

              <DashboardNavItem
                href="#"
                icon="◉"
                label="Elections"
              />

              <DashboardNavItem
                href="#"
                icon="▣"
                label="Results"
              />

              <DashboardNavItem
                href="#"
                icon="◫"
                label="Analytics"
              />

              <DashboardNavItem
                href="#"
                icon="◌"
                label="Reports"
              />

              <div className="dashboard-nav-section">
                WORKSPACE
              </div>

              <DashboardNavItem
                href="#"
                icon="✓"
                label="Tasks & Reminders"
              />

              <DashboardNavItem
                href="#"
                icon="◉"
                label="AI Analyzer"
              />

              <DashboardNavItem
                href="#"
                icon="✦"
                label="AI Personal Assistant"
              />

              <DashboardNavItem
                href="#"
                icon="☷"
                label="Messages"
              />

              <DashboardNavItem
                href="#"
                icon="🔔"
                label="Notifications"
              />

              <div className="dashboard-nav-section">
                ACCOUNT
              </div>

              <DashboardNavItem
                href="#"
                icon="♙"
                label="Profile"
              />

              <DashboardNavItem
                href="#"
                icon="⚙"
                label="Privacy & Security"
              />

              <DashboardNavItem
                href="#"
                icon="?"
                label="Help & Support"
              />
            </>
          )}
        </nav>

        {/* ==================================================
            SIDEBAR FOOTER
        ================================================== */}

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
            onClick={openSidebar}
          >
            ☰
          </button>

          <div className="dashboard-header-title">
            <h1>
              {title}
            </h1>

            {subtitle && (
              <p>
                {subtitle}
              </p>
            )}
          </div>

          <div className="dashboard-header-actions">
            {/* ==================================================
                WEATHER
            ================================================== */}

            <div className="dashboard-weather">
              <span className="dashboard-weather-icon">
                ☀️
              </span>

              <div>
                <strong>
                  --°C
                </strong>

                <small>
                  Location unavailable
                </small>
              </div>
            </div>

            {/* ==================================================
                NOTIFICATIONS
            ================================================== */}

            <button
              type="button"
              className="dashboard-header-icon"
              aria-label="Notifications"
            >
              🔔
            </button>

            {/* ==================================================
                MESSAGES
            ================================================== */}

            <button
              type="button"
              className="dashboard-header-icon"
              aria-label="Messages"
            >
              💬
            </button>

            {/* ==================================================
                PROFILE
            ================================================== */}

            <button
              type="button"
              className="dashboard-profile"
              aria-label="Open profile"
            >
              <span className="dashboard-profile-avatar">
                {getInitials(role)}
              </span>

              <span className="dashboard-profile-text">
                <strong>
                  {formatRole(role)}
                </strong>

                <small>
                  Account
                </small>
              </span>

              <span className="dashboard-profile-arrow">
                ▼
              </span>
            </button>
          </div>
        </header>

        {/* ====================================================
            CONTENT
        ==================================================== */}

        <div className="dashboard-content-wrapper">
          {children}
        </div>
      </div>

      {/* ======================================================
          STYLES
      ====================================================== */}

      <style jsx>{`
        .polisync-dashboard {
          min-height: 100vh;
          display: flex;
          background: #f5f8f6;
          color: #26332b;
        }

        /* ==================================================
           SIDEBAR
        ================================================== */

        .dashboard-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 1000;
          width: 250px;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border-right: 1px solid #dfe8e2;
          box-shadow:
            5px 0 25px
              rgba(16, 59, 34, 0.04);
          overflow-y: auto;
        }

        .dashboard-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 21px 17px 18px;
          border-bottom: 1px solid #edf1ee;
        }

        .dashboard-brand-mark {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 2px solid #c9a227;
          border-radius: 11px;
          background: #075f2b;
          color: #ffffff;
          font-size: 19px;
          font-weight: 900;
        }

        .dashboard-brand-name {
          color: #075f2b;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.6px;
        }

        .dashboard-brand-subtitle {
          margin-top: 3px;
          color: #929b95;
          font-size: 7px;
        }

        /* ==================================================
           NAVIGATION
        ================================================== */

        .dashboard-navigation {
          flex: 1;
          padding: 13px 10px;
          overflow-y: auto;
        }

        .dashboard-nav-section {
          margin: 17px 9px 7px;
          color: #a0a8a3;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .dashboard-nav-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 9px;
          min-height: 38px;
          margin: 2px 0;
          padding: 8px 10px;
          border-radius: 9px;
          color: #657069;
          text-decoration: none;
          font-size: 9px;
          font-weight: 650;
          transition:
            background 0.15s ease,
            color 0.15s ease;
        }

        .dashboard-nav-item:hover {
          background: #f0f6f2;
          color: #075f2b;
        }

        .dashboard-nav-item-active {
          background: #075f2b;
          color: #ffffff;
          box-shadow:
            0 5px 14px
              rgba(7, 95, 43, 0.16);
        }

        .dashboard-nav-item-active:hover {
          background: #075f2b;
          color: #ffffff;
        }

        .dashboard-nav-icon {
          width: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 13px;
        }

        .dashboard-nav-label {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .dashboard-nav-badge {
          margin-left: auto;
          min-width: 19px;
          height: 19px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: #c9a227;
          color: #ffffff;
          font-size: 8px;
          font-weight: 900;
        }

        /* ==================================================
           SIDEBAR FOOTER
        ================================================== */

        .dashboard-sidebar-footer {
          padding: 13px;
          border-top: 1px solid #edf1ee;
        }

        .dashboard-role-label {
          color: #a0a8a3;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.9px;
        }

        .dashboard-role {
          margin-top: 5px;
          color: #075f2b;
          font-size: 10px;
          font-weight: 850;
        }

        .dashboard-logout {
          width: 100%;
          margin-top: 10px;
          padding: 8px;
          border: 1px solid #e1e8e3;
          border-radius: 8px;
          background: #ffffff;
          color: #69736d;
          font-size: 8px;
          font-weight: 750;
          cursor: pointer;
        }

        .dashboard-logout:hover {
          border-color: #d3dfd7;
          background: #f7faf8;
          color: #075f2b;
        }

        /* ==================================================
           MAIN
        ================================================== */

        .dashboard-main {
          width: calc(100% - 250px);
          min-height: 100vh;
          margin-left: 250px;
        }

        /* ==================================================
           HEADER
        ================================================== */

        .dashboard-header {
          position: sticky;
          top: 0;
          z-index: 900;
          min-height: 68px;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 18px;
          box-sizing: border-box;
          background: #ffffff;
          border-bottom: 1px solid #e3ebe5;
        }

        .dashboard-menu-button {
          display: none;
          width: 35px;
          height: 35px;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: 1px solid #dfe8e2;
          border-radius: 9px;
          background: #ffffff;
          color: #075f2b;
          font-size: 17px;
          cursor: pointer;
        }

        .dashboard-header-title {
          min-width: 0;
          flex: 1;
        }

        .dashboard-header-title h1 {
          margin: 0;
          color: #075f2b;
          font-size: 18px;
          font-weight: 850;
        }

        .dashboard-header-title p {
          margin: 3px 0 0;
          color: #929b95;
          font-size: 8px;
        }

        .dashboard-header-actions {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .dashboard-weather {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-right: 5px;
          padding-right: 10px;
          border-right: 1px solid #e6ece8;
        }

        .dashboard-weather-icon {
          font-size: 17px;
        }

        .dashboard-weather strong {
          display: block;
          color: #344139;
          font-size: 10px;
        }

        .dashboard-weather small {
          display: block;
          margin-top: 1px;
          color: #9aa29d;
          font-size: 7px;
          white-space: nowrap;
        }

        .dashboard-header-icon {
          width: 33px;
          height: 33px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: 1px solid #e0e8e2;
          border-radius: 9px;
          background: #ffffff;
          font-size: 13px;
          cursor: pointer;
        }

        .dashboard-header-icon:hover {
          background: #f2f7f4;
        }

        .dashboard-profile {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-left: 2px;
          padding: 3px 7px 3px 4px;
          border: 1px solid #e0e8e2;
          border-radius: 999px;
          background: #ffffff;
          cursor: pointer;
        }

        .dashboard-profile-avatar {
          width: 29px;
          height: 29px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #075f2b;
          color: #ffffff;
          font-size: 8px;
          font-weight: 900;
        }

        .dashboard-profile-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .dashboard-profile-text strong {
          max-width: 130px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #344139;
          font-size: 8px;
        }

        .dashboard-profile-text small {
          margin-top: 2px;
          color: #969f99;
          font-size: 7px;
        }

        .dashboard-profile-arrow {
          color: #89928c;
          font-size: 7px;
        }

        /* ==================================================
           CONTENT
        ================================================== */

        .dashboard-content-wrapper {
          width: 100%;
          min-height: calc(100vh - 68px);
        }

        /* ==================================================
           MOBILE OVERLAY
        ================================================== */

        .dashboard-overlay {
          position: fixed;
          inset: 0;
          z-index: 1100;
          border: 0;
          background: rgba(10, 35, 20, 0.35);
          cursor: pointer;
        }

        /* ==================================================
           MOBILE
        ================================================== */

        @media (max-width: 900px) {
          .dashboard-sidebar {
            transform: translateX(-100%);
            transition:
              transform 0.2s ease;
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
          }
        }

        @media (max-width: 650px) {
          .dashboard-header {
            padding: 9px 12px;
          }

          .dashboard-header-title h1 {
            font-size: 15px;
          }

          .dashboard-header-title p {
            display: none;
          }

          .dashboard-weather {
            display: none;
          }

          .dashboard-profile-text,
          .dashboard-profile-arrow {
            display: none;
          }

          .dashboard-profile {
            border: 0;
            padding: 0;
          }
        }

        @media (max-width: 430px) {
          .dashboard-header-actions {
            gap: 4px;
          }

          .dashboard-header-icon {
            width: 31px;
            height: 31px;
          }

          .dashboard-profile-avatar {
            width: 31px;
            height: 31px;
          }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
   FALLBACK NAVIGATION ITEM
============================================================ */

function DashboardNavItem({
  href = "#",
  icon,
  label,
  active = false,
  onClick,
}) {
  return (
    <a
      href={href}
      className={`dashboard-nav-item ${
        active
          ? "dashboard-nav-item-active"
          : ""
      }`}
      onClick={(event) => {
        if (href === "#") {
          event.preventDefault();
        }

        if (onClick) {
          onClick(event);
        }
      }}
    >
      <span className="dashboard-nav-icon">
        {icon}
      </span>

      <span className="dashboard-nav-label">
        {label}
      </span>
    </a>
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
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

/* ============================================================
   INITIALS
============================================================ */

function getInitials(value) {
  const formatted = formatRole(value);

  const words = formatted
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) {
    return "U";
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${words[0][0]}${
    words[words.length - 1][0]
  }`.toUpperCase();
}
