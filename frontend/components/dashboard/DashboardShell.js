"use client";

import { useEffect, useMemo, useState } from "react";
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
  user = null,
  onSignOut = null,
}) {
  const [sidebarOpen, setSidebarOpen] =
    useState(Boolean(mobileMenuOpen));

  useEffect(() => {
    setSidebarOpen(Boolean(mobileMenuOpen));
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!sidebarOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [sidebarOpen]);

  const sections = useMemo(() => {
    if (Array.isArray(navigation)) {
      return navigation;
    }

    if (
      role === "super_admin" &&
      Array.isArray(superAdminNavigation)
    ) {
      return superAdminNavigation;
    }

    return [];
  }, [navigation, role]);

  const closeSidebar = () => {
    setSidebarOpen(false);

    if (onMobileMenuClose) {
      onMobileMenuClose();
    }
  };

  const openSidebar = () => {
    setSidebarOpen(true);
  };

  const handleNavigation = (
    item,
    event
  ) => {
    const itemKey =
      item?.key ||
      item?.href ||
      item?.label ||
      "overview";

    if (
      !item?.href ||
      item.href === "#"
    ) {
      event?.preventDefault();
    }

    if (onSectionChange) {
      onSectionChange(itemKey);
    }

    closeSidebar();
  };

  const displayTitle =
    title || "Dashboard";

  const displayRole =
    formatRole(role);

  const displayName =
    user?.displayName ||
    user?.firstName ||
    displayRole;

  const initials =
    getInitials(displayName);

  return (
    <div className="polisync-dashboard">
      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {sidebarOpen && (
        <button
          type="button"
          className="dashboard-overlay"
          aria-label="Close navigation"
          onClick={closeSidebar}
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`dashboard-sidebar ${
          sidebarOpen
            ? "dashboard-sidebar-open"
            : ""
        }`}
        aria-label="Dashboard navigation"
      >
        {/* BRAND */}

        <div className="dashboard-brand">
          <div
            className="dashboard-brand-mark"
            aria-hidden="true"
          >
            P
          </div>

          <div className="dashboard-brand-copy">
            <div className="dashboard-brand-name">
              POLISYNC AFRICA
            </div>

            <div className="dashboard-brand-subtitle">
              Political Intelligence Platform
            </div>
          </div>

          <button
            type="button"
            className="dashboard-sidebar-close"
            aria-label="Close navigation"
            onClick={closeSidebar}
          >
            ×
          </button>
        </div>

        {/* NAVIGATION */}

        <nav className="dashboard-navigation">
          {sections.length > 0 ? (
            sections.map(
              (
                section,
                sectionIndex
              ) => {
                const sectionKey =
                  section?.section ||
                  section?.key ||
                  `section-${sectionIndex}`;

                const items =
                  Array.isArray(
                    section?.items
                  )
                    ? section.items
                    : [];

                return (
                  <div
                    className="dashboard-nav-group"
                    key={sectionKey}
                  >
                    {section?.section && (
                      <div className="dashboard-nav-section">
                        {section.section}
                      </div>
                    )}

                    {items.map(
                      (
                        item,
                        itemIndex
                      ) => {
                        const itemKey =
                          item?.key ||
                          item?.href ||
                          item?.label ||
                          `item-${sectionIndex}-${itemIndex}`;

                        const isActive =
                          activeSection ===
                            itemKey ||
                          activeSection ===
                            item?.key;

                        return (
                          <a
                            key={itemKey}
                            href={
                              item?.href ||
                              "#"
                            }
                            className={`dashboard-nav-item ${
                              isActive
                                ? "dashboard-nav-item-active"
                                : ""
                            }`}
                            aria-current={
                              isActive
                                ? "page"
                                : undefined
                            }
                            onClick={(
                              event
                            ) =>
                              handleNavigation(
                                item,
                                event
                              )
                            }
                          >
                            <span
                              className="dashboard-nav-icon"
                              aria-hidden="true"
                            >
                              {item?.icon ||
                                "•"}
                            </span>

                            <span className="dashboard-nav-label">
                              {item?.label ||
                                "Untitled"}
                            </span>

                            {item?.badge !=
                              null && (
                              <span className="dashboard-nav-badge">
                                {item.badge ===
                                true
                                  ? "!"
                                  : item.badge}
                              </span>
                            )}
                          </a>
                        );
                      }
                    )}
                  </div>
                );
              }
            )
          ) : (
            <FallbackNavigation
              activeSection={
                activeSection
              }
              onSectionChange={
                onSectionChange
              }
              onNavigate={
                closeSidebar
              }
            />
          )}
        </nav>

        {/* SIDEBAR FOOTER */}

        <div className="dashboard-sidebar-footer">
          <div className="dashboard-role-label">
            CURRENT ROLE
          </div>

          <div className="dashboard-role">
            {displayRole}
          </div>

          <button
            type="button"
            className="dashboard-logout"
            onClick={() => {
              closeSidebar();

              if (onSignOut) {
                onSignOut();
              }
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN AREA
      ===================================================== */}

      <div className="dashboard-main">
        {/* ===================================================
            SINGLE SHARED HEADER
        =================================================== */}

        <header className="dashboard-header">
          <button
            type="button"
            className="dashboard-menu-button"
            aria-label="Open navigation"
            aria-expanded={
              sidebarOpen
            }
            onClick={
              openSidebar
            }
          >
            ☰
          </button>

          <div className="dashboard-header-title">
            <h1>
              {displayTitle}
            </h1>

            {subtitle ? (
              <p>
                {subtitle}
              </p>
            ) : null}
          </div>

          <div className="dashboard-header-actions">
            {/* WEATHER */}

            <div
              className="dashboard-weather"
              aria-label="Weather unavailable"
            >
              <span
                className="dashboard-weather-icon"
                aria-hidden="true"
              >
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

            {/* NOTIFICATIONS */}

            <button
              type="button"
              className="dashboard-header-icon"
              aria-label="Notifications"
            >
              🔔
            </button>

            {/* MESSAGES */}

            <button
              type="button"
              className="dashboard-header-icon"
              aria-label="Messages"
            >
              💬
            </button>

            {/* PROFILE */}

            <button
              type="button"
              className="dashboard-profile"
              aria-label={`Open ${displayRole} profile`}
            >
              <span className="dashboard-profile-avatar">
                {initials}
              </span>

              <span className="dashboard-profile-text">
                <strong>
                  {displayName}
                </strong>

                <small>
                  Account
                </small>
              </span>

              <span
                className="dashboard-profile-arrow"
                aria-hidden="true"
              >
                ▼
              </span>
            </button>
          </div>
        </header>

        {/* ===================================================
            PAGE CONTENT
        =================================================== */}

        <main className="dashboard-content-wrapper">
          {children}
        </main>
      </div>

      {/* =====================================================
          STYLES
      ===================================================== */}

      <style jsx>{`
        .polisync-dashboard {
          --polisync-green-950: #04351a;
          --polisync-green-900: #064a24;
          --polisync-green-800: #075421;
          --polisync-green-700: #075f2b;
          --polisync-green-600: #087a37;
          --polisync-green-100: #eaf5ee;

          --polisync-gold: #c9a227;
          --polisync-gold-light: #f7efd0;

          --polisync-text: #1f2d25;
          --polisync-muted: #66736b;
          --polisync-light-text: #849088;

          --polisync-border: #dce6df;
          --polisync-surface: #ffffff;
          --polisync-background: #f4f7f5;

          width: 100%;
          min-height: 100vh;
          display: flex;
          background: var(
            --polisync-background
          );
          color: var(
            --polisync-text
          );
        }

        /* ===================================================
           SIDEBAR
        =================================================== */

        .dashboard-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;

          z-index: 1200;

          width: 280px;

          display: flex;
          flex-direction: column;

          background: var(
            --polisync-surface
          );

          border-right: 1px solid
            var(--polisync-border);

          box-shadow:
            8px 0 30px
              rgba(
                16,
                59,
                34,
                0.06
              );

          overflow: hidden;

          transform: translateX(0);

          transition:
            transform
              180ms ease;
        }

        .dashboard-brand {
          min-height: 80px;

          display: flex;
          align-items: center;

          gap: 12px;

          padding: 16px 18px;

          border-bottom: 1px solid
            #edf1ee;
        }

        .dashboard-brand-mark {
          width: 46px;
          height: 46px;

          flex: 0 0 46px;

          display: grid;
          place-items: center;

          border: 2px solid
            var(--polisync-gold);

          border-radius: 12px;

          background:
            var(--polisync-green-700);

          color: #ffffff;

          font-size: 22px;
          font-weight: 900;
        }

        .dashboard-brand-copy {
          min-width: 0;
        }

        .dashboard-brand-name {
          color:
            var(--polisync-green-700);

          font-size: 14px;
          line-height: 1.2;

          font-weight: 900;

          letter-spacing: 0.6px;
        }

        .dashboard-brand-subtitle {
          margin-top: 4px;

          color:
            var(--polisync-light-text);

          font-size: 11px;
          line-height: 1.35;
        }

        .dashboard-sidebar-close {
          display: none;

          width: 38px;
          height: 38px;

          margin-left: auto;

          border: 1px solid
            var(--polisync-border);

          border-radius: 10px;

          background: #ffffff;

          color:
            var(--polisync-green-700);

          font-size: 24px;

          cursor: pointer;
        }

        /* ===================================================
           NAVIGATION
        =================================================== */

        .dashboard-navigation {
          flex: 1;

          min-height: 0;

          padding: 16px 12px;

          overflow-y: auto;

          overscroll-behavior:
            contain;
        }

        .dashboard-nav-group
          + .dashboard-nav-group {
          margin-top: 20px;
        }

        .dashboard-nav-section {
          margin:
            0 10px 8px;

          color:
            var(--polisync-light-text);

          font-size: 11px;
          line-height: 1.2;

          font-weight: 850;

          letter-spacing: 1px;

          text-transform:
            uppercase;
        }

        .dashboard-nav-item {
          position: relative;

          width: 100%;
          min-height: 46px;

          display: flex;
          align-items: center;

          gap: 11px;

          box-sizing: border-box;

          margin: 3px 0;

          padding: 10px 11px;

          border-radius: 10px;

          color: #56635b;

          text-decoration: none;

          font-size: 14px;
          line-height: 1.25;

          font-weight: 650;

          transition:
            background 140ms
              ease,
            color 140ms ease;
        }

        .dashboard-nav-item:hover {
          background:
            var(--polisync-green-100);

          color:
            var(--polisync-green-700);
        }

        .dashboard-nav-item-active {
          background:
            var(--polisync-green-700);

          color: #ffffff;

          box-shadow:
            0 6px 18px
              rgba(
                7,
                95,
                43,
                0.18
              );
        }

        .dashboard-nav-item-active:hover {
          background:
            var(--polisync-green-700);

          color: #ffffff;
        }

        .dashboard-nav-icon {
          width: 25px;

          flex: 0 0 25px;

          display: inline-flex;

          align-items: center;
          justify-content: center;

          font-size: 18px;
        }

        .dashboard-nav-label {
          min-width: 0;

          overflow: hidden;

          text-overflow:
            ellipsis;

          white-space: nowrap;
        }

        .dashboard-nav-badge {
          min-width: 23px;
          height: 23px;

          margin-left: auto;

          padding: 0 6px;

          box-sizing: border-box;

          display: inline-flex;

          align-items: center;
          justify-content: center;

          border-radius: 999px;

          background:
            var(--polisync-gold);

          color: #ffffff;

          font-size: 11px;

          font-weight: 900;
        }

        /* ===================================================
           SIDEBAR FOOTER
        =================================================== */

        .dashboard-sidebar-footer {
          padding: 15px;

          border-top: 1px solid
            #edf1ee;

          background: #fbfcfb;
        }

        .dashboard-role-label {
          color:
            var(--polisync-light-text);

          font-size: 10px;

          font-weight: 850;

          letter-spacing: 1px;
        }

        .dashboard-role {
          margin-top: 5px;

          color:
            var(--polisync-green-700);

          font-size: 14px;

          font-weight: 850;
        }

        .dashboard-logout {
          width: 100%;

          min-height: 42px;

          margin-top: 11px;

          padding: 9px 12px;

          border: 1px solid
            var(--polisync-border);

          border-radius: 9px;

          background: #ffffff;

          color: #59655e;

          font-size: 13px;

          font-weight: 750;

          cursor: pointer;
        }

        .dashboard-logout:hover {
          background: #f5f9f6;

          border-color: #cbd9d0;

          color:
            var(--polisync-green-700);
        }

        /* ===================================================
           MAIN
        =================================================== */

        .dashboard-main {
          width:
            calc(100% - 280px);

          min-width: 0;

          min-height: 100vh;

          margin-left: 280px;
        }

        /* ===================================================
           SINGLE HEADER
        =================================================== */

        .dashboard-header {
          position: sticky;

          top: 0;

          z-index: 900;

          min-height: 80px;

          display: flex;

          align-items: center;

          gap: 16px;

          padding: 12px 24px;

          box-sizing: border-box;

          background:
            rgba(
              255,
              255,
              255,
              0.97
            );

          border-bottom: 1px solid
            #e1e9e3;

          backdrop-filter:
            blur(10px);
        }

        .dashboard-menu-button {
          display: none;

          width: 44px;
          height: 44px;

          flex: 0 0 44px;

          align-items: center;
          justify-content: center;

          padding: 0;

          border: 1px solid
            var(--polisync-border);

          border-radius: 10px;

          background: #ffffff;

          color:
            var(--polisync-green-700);

          font-size: 21px;

          cursor: pointer;
        }

        .dashboard-header-title {
          min-width: 0;
          flex: 1;
        }

        .dashboard-header-title h1 {
          margin: 0;

          color:
            var(--polisync-green-700);

          font-size:
            clamp(
              21px,
              2vw,
              29px
            );

          line-height: 1.15;

          font-weight: 850;

          letter-spacing:
            -0.35px;
        }

        .dashboard-header-title p {
          margin: 5px 0 0;

          color:
            var(--polisync-muted);

          font-size: 13px;

          line-height: 1.4;
        }

        .dashboard-header-actions {
          display: flex;

          align-items: center;

          gap: 8px;

          flex-shrink: 0;
        }

        /* ===================================================
           WEATHER
        =================================================== */

        .dashboard-weather {
          display: flex;

          align-items: center;

          gap: 9px;

          min-width: 130px;

          margin-right: 4px;

          padding-right: 13px;

          border-right: 1px solid
            #e4ebe6;
        }

        .dashboard-weather-icon {
          font-size: 23px;
        }

        .dashboard-weather strong {
          display: block;

          color: #344139;

          font-size: 14px;
        }

        .dashboard-weather small {
          display: block;

          margin-top: 2px;

          color:
            var(--polisync-light-text);

          font-size: 11px;

          white-space: nowrap;
        }

        /* ===================================================
           HEADER BUTTONS
        =================================================== */

        .dashboard-header-icon {
          width: 42px;
          height: 42px;

          flex: 0 0 42px;

          display: grid;

          place-items: center;

          padding: 0;

          border: 1px solid
            var(--polisync-border);

          border-radius: 10px;

          background: #ffffff;

          font-size: 18px;

          cursor: pointer;
        }

        .dashboard-header-icon:hover {
          background: #f2f7f4;

          border-color:
            #cddbd2;
        }

        /* ===================================================
           PROFILE
        =================================================== */

        .dashboard-profile {
          min-height: 44px;

          display: flex;

          align-items: center;

          gap: 9px;

          margin-left: 2px;

          padding:
            4px 10px
            4px 5px;

          border: 1px solid
            var(--polisync-border);

          border-radius: 999px;

          background: #ffffff;

          cursor: pointer;
        }

        .dashboard-profile-avatar {
          width: 35px;
          height: 35px;

          flex: 0 0 35px;

          display: grid;

          place-items: center;

          border-radius: 50%;

          background:
            var(--polisync-green-700);

          color: #ffffff;

          font-size: 11px;

          font-weight: 900;
        }

        .dashboard-profile-text {
          min-width: 0;

          display: flex;

          flex-direction: column;

          align-items: flex-start;
        }

        .dashboard-profile-text strong {
          max-width: 180px;

          overflow: hidden;

          text-overflow:
            ellipsis;

          white-space: nowrap;

          color: #344139;

          font-size: 12px;

          line-height: 1.2;
        }

        .dashboard-profile-text small {
          margin-top: 3px;

          color:
            var(--polisync-light-text);

          font-size: 10px;
        }

        .dashboard-profile-arrow {
          color: #7b8780;

          font-size: 9px;
        }

        /* ===================================================
           CONTENT
        =================================================== */

        .dashboard-content-wrapper {
          width: 100%;

          min-width: 0;

          min-height:
            calc(100vh - 80px);
        }

        /* ===================================================
           MOBILE OVERLAY
        =================================================== */

        .dashboard-overlay {
          position: fixed;

          inset: 0;

          z-index: 1150;

          border: 0;

          background:
            rgba(
              7,
              34,
              19,
              0.48
            );

          cursor: pointer;
        }

        /* ===================================================
           TABLET
        =================================================== */

        @media (max-width: 1100px) {
          .dashboard-sidebar {
            width: 280px;

            transform:
              translateX(
                -105%
              );
          }

          .dashboard-sidebar-open {
            transform:
              translateX(0);
          }

          .dashboard-sidebar-close {
            display: block;
          }

          .dashboard-main {
            width: 100%;

            margin-left: 0;
          }

          .dashboard-menu-button {
            display: inline-flex;
          }

          .dashboard-header {
            padding:
              11px 18px;
          }
        }

        /* ===================================================
           MOBILE
        =================================================== */

        @media (max-width: 760px) {
          .dashboard-header {
            min-height: 68px;

            gap: 9px;

            padding:
              9px 12px;
          }

          .dashboard-header-title h1 {
            font-size: 19px;
          }

          .dashboard-header-title p {
            display: none;
          }

          .dashboard-weather {
            display: none;
          }

          .dashboard-header-actions {
            gap: 5px;
          }

          .dashboard-header-icon {
            width: 38px;
            height: 38px;

            flex-basis: 38px;

            font-size: 17px;
          }

          .dashboard-profile {
            min-height: 38px;

            margin-left: 0;

            padding: 0;

            border: 0;
          }

          .dashboard-profile-text,
          .dashboard-profile-arrow {
            display: none;
          }

          .dashboard-profile-avatar {
            width: 38px;
            height: 38px;

            flex-basis: 38px;
          }

          .dashboard-content-wrapper {
            min-height:
              calc(
                100vh - 68px
              );
          }
        }

        /* ===================================================
           SMALL PHONES
        =================================================== */

        @media (max-width: 430px) {
          .dashboard-sidebar {
            width:
              min(
                88vw,
                320px
              );
          }

          .dashboard-menu-button {
            width: 38px;
            height: 38px;

            flex-basis: 38px;

            font-size: 18px;
          }

          .dashboard-header-title h1 {
            font-size: 17px;
          }

          .dashboard-header-icon {
            width: 36px;
            height: 36px;

            flex-basis: 36px;
          }

          .dashboard-profile-avatar {
            width: 36px;
            height: 36px;

            flex-basis: 36px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .dashboard-sidebar,
          .dashboard-nav-item {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
   FALLBACK NAVIGATION
============================================================ */

function FallbackNavigation({
  activeSection,
  onSectionChange,
  onNavigate,
}) {
  const items = [
    {
      key: "overview",
      href: "#",
      icon: "⌂",
      label: "Dashboard",
    },
    {
      key: "elections",
      href: "#",
      icon: "◉",
      label: "Elections",
    },
    {
      key: "results",
      href: "#",
      icon: "▣",
      label: "Results",
    },
    {
      key: "analytics",
      href: "#",
      icon: "◫",
      label: "Analytics",
    },
    {
      key: "reports",
      href: "#",
      icon: "◌",
      label: "Reports",
    },
    {
      key: "tasks",
      href: "#",
      icon: "✓",
      label: "Tasks & Reminders",
    },
    {
      key: "ai-analyzer",
      href: "#",
      icon: "◉",
      label: "AI Analyzer",
    },
    {
      key: "ai-assistant",
      href: "#",
      icon: "✦",
      label: "AI Personal Assistant",
    },
    {
      key: "messages",
      href: "#",
      icon: "☷",
      label: "Messages",
    },
    {
      key: "notifications",
      href: "#",
      icon: "🔔",
      label: "Notifications",
    },
    {
      key: "profile",
      href: "#",
      icon: "♙",
      label: "Profile",
    },
    {
      key: "privacy-security",
      href: "#",
      icon: "⚙",
      label: "Privacy & Security",
    },
    {
      key: "help",
      href: "#",
      icon: "?",
      label: "Help & Support",
    },
  ];

  return (
    <>
      <div className="dashboard-nav-section">
        WORKSPACE
      </div>

      {items.map((item) => {
        const active =
          activeSection ===
          item.key;

        return (
          <a
            key={item.key}
            href={item.href}
            className={`dashboard-nav-item ${
              active
                ? "dashboard-nav-item-active"
                : ""
            }`}
            aria-current={
              active
                ? "page"
                : undefined
            }
            onClick={(event) => {
              event.preventDefault();

              if (onSectionChange) {
                onSectionChange(
                  item.key
                );
              }

              if (onNavigate) {
                onNavigate();
              }
            }}
          >
            <span
              className="dashboard-nav-icon"
              aria-hidden="true"
            >
              {item.icon}
            </span>

            <span className="dashboard-nav-label">
              {item.label}
            </span>
          </a>
        );
      })}
    </>
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
    .replace(
      /[-_]/g,
      " "
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

/* ============================================================
   INITIALS
============================================================ */

function getInitials(value) {
  const formatted =
    formatRole(value);

  const words =
    formatted
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
