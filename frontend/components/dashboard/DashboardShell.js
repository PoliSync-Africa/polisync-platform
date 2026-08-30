"use client";

import { useEffect, useMemo, useState } from "react";
import superAdminNavigation from "./superAdminNavigation";
import PoliSyncBrand from "./PoliSyncBrand";

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
  const [sidebarOpen, setSidebarOpen] = useState(Boolean(mobileMenuOpen));

  useEffect(() => {
    setSidebarOpen(Boolean(mobileMenuOpen));
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  const sections = useMemo(() => {
    if (Array.isArray(navigation)) return navigation;
    if (role === "super_admin" && Array.isArray(superAdminNavigation)) {
      return superAdminNavigation;
    }
    return [];
  }, [navigation, role]);

  const closeSidebar = () => {
    setSidebarOpen(false);
    onMobileMenuClose?.();
  };

  const displayRole = formatRole(role);
  const displayName = user?.displayName || user?.firstName || user?.name || displayRole;
  const initials = getInitials(displayName);

  const handleNavigation = (item, event) => {
    const itemKey = item?.key || item?.href || item?.label || "overview";
    if (!item?.href || item.href === "#") event?.preventDefault();
    onSectionChange?.(itemKey);
    closeSidebar();
  };

  return (
    <div className="polisync-dashboard">
      {sidebarOpen && (
        <button
          type="button"
          className="dashboard-overlay"
          aria-label="Close navigation"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`dashboard-sidebar ${sidebarOpen ? "dashboard-sidebar-open" : ""}`}
        aria-label="Dashboard navigation"
      >
        <div className="dashboard-brand">
          <PoliSyncBrand />
          <button
            type="button"
            className="dashboard-sidebar-close"
            aria-label="Close navigation"
            onClick={closeSidebar}
          >
            ×
          </button>
        </div>

        <nav className="dashboard-navigation">
          {sections.length > 0 ? (
            sections.map((section, sectionIndex) => {
              const sectionKey = section?.section || section?.key || `section-${sectionIndex}`;
              const items = Array.isArray(section?.items) ? section.items : [];
              return (
                <div className="dashboard-nav-group" key={sectionKey}>
                  {section?.section && <div className="dashboard-nav-section">{section.section}</div>}
                  {items.map((item, itemIndex) => {
                    const itemKey = item?.key || item?.href || item?.label || `item-${sectionIndex}-${itemIndex}`;
                    const isActive = activeSection === itemKey || activeSection === item?.key;
                    return (
                      <a
                        key={itemKey}
                        href={item?.href || "#"}
                        className={`dashboard-nav-item ${isActive ? "dashboard-nav-item-active" : ""}`}
                        aria-current={isActive ? "page" : undefined}
                        onClick={(event) => handleNavigation(item, event)}
                      >
                        <span className="dashboard-nav-icon" aria-hidden="true">{item?.icon || "•"}</span>
                        <span className="dashboard-nav-label">{item?.label || "Untitled"}</span>
                        {item?.badge != null && <span className="dashboard-nav-badge">{item.badge === true ? "!" : item.badge}</span>}
                      </a>
                    );
                  })}
                </div>
              );
            })
          ) : (
            <FallbackNavigation activeSection={activeSection} onSectionChange={onSectionChange} onNavigate={closeSidebar} />
          )}
        </nav>

        <div className="dashboard-sidebar-footer">
          <div className="dashboard-role-label">CURRENT ROLE</div>
          <div className="dashboard-role">{displayRole}</div>
          <button
            type="button"
            className="dashboard-logout"
            onClick={() => {
              closeSidebar();
              onSignOut?.();
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-header">
          <button
            type="button"
            className="dashboard-menu-button"
            aria-label="Open navigation"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          <div className="dashboard-header-brand">
            <PoliSyncBrand compact />
          </div>

          <div className="dashboard-header-title">
            <h1>{title || "Dashboard"}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>

          <div className="dashboard-header-actions">
            <div className="dashboard-weather" aria-label="Live weather">
              <span className="dashboard-weather-icon" aria-hidden="true">🌤️</span>
              <div>
                <strong>Live</strong>
                <small>Weather</small>
              </div>
            </div>

            <button type="button" className="dashboard-header-icon" aria-label="Notifications">🔔</button>
            <button type="button" className="dashboard-header-icon" aria-label="Messages">💬</button>

            <button type="button" className="dashboard-profile" aria-label={`Open ${displayRole} profile`}>
              <span className="dashboard-profile-avatar">{initials}</span>
              <span className="dashboard-profile-text">
                <strong>{displayName}</strong>
                <small>Account</small>
              </span>
              <span className="dashboard-profile-arrow" aria-hidden="true">▼</span>
            </button>
          </div>
        </header>

        <main className="dashboard-content-wrapper">{children}</main>
      </div>

      <style jsx>{`
        .polisync-dashboard {
          --green: #075f2b;
          --gold: #c9a227;
          --text: #1f2d25;
          --muted: #66736b;
          --light: #849088;
          --border: #dce6df;
          width: 100%;
          min-height: 100vh;
          display: flex;
          background: #f4f7f5;
          color: var(--text);
        }

        .dashboard-sidebar {
          position: fixed;
          inset: 0 auto 0 0;
          z-index: 1200;
          width: 280px;
          display: flex;
          flex-direction: column;
          background: #fff;
          border-right: 1px solid var(--border);
          box-shadow: 8px 0 30px rgba(16,59,34,.06);
          overflow: hidden;
          transform: translateX(0);
          transition: transform 180ms ease;
        }

        .dashboard-brand {
          min-height: 106px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 16px;
          border-bottom: 1px solid #edf1ee;
          background: #fff;
        }

        .dashboard-brand :global(.polisync-brand-image) {
          max-width: 232px;
        }

        .dashboard-sidebar-close {
          display: none;
          width: 38px;
          height: 38px;
          margin-left: auto;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: #fff;
          color: var(--green);
          font-size: 24px;
          cursor: pointer;
        }

        .dashboard-navigation {
          flex: 1;
          min-height: 0;
          padding: 16px 12px;
          overflow-y: auto;
        }

        .dashboard-nav-group + .dashboard-nav-group { margin-top: 20px; }
        .dashboard-nav-section {
          margin: 0 10px 8px;
          color: var(--light);
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 1px;
          text-transform: uppercase;
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
          font-weight: 650;
          transition: background 140ms ease, color 140ms ease;
        }

        .dashboard-nav-item:hover { background: #eaf5ee; color: var(--green); }
        .dashboard-nav-item-active { background: var(--green); color: #fff; box-shadow: 0 6px 18px rgba(7,95,43,.18); }
        .dashboard-nav-item-active:hover { background: var(--green); color: #fff; }
        .dashboard-nav-icon { width: 25px; flex: 0 0 25px; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; }
        .dashboard-nav-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .dashboard-nav-badge { min-width: 23px; height: 23px; margin-left: auto; padding: 0 6px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; background: var(--gold); color: #fff; font-size: 11px; font-weight: 900; }

        .dashboard-sidebar-footer { padding: 15px; border-top: 1px solid #edf1ee; background: #fbfcfb; }
        .dashboard-role-label { color: var(--light); font-size: 10px; font-weight: 850; letter-spacing: 1px; }
        .dashboard-role { margin-top: 5px; color: var(--green); font-size: 14px; font-weight: 850; }
        .dashboard-logout { width: 100%; min-height: 42px; margin-top: 11px; padding: 9px 12px; border: 1px solid var(--border); border-radius: 9px; background: #fff; color: #59655e; font-size: 13px; font-weight: 750; cursor: pointer; }
        .dashboard-logout:hover { background: #f5f9f6; color: var(--green); }

        .dashboard-main { width: calc(100% - 280px); min-width: 0; min-height: 100vh; margin-left: 280px; }

        .dashboard-header {
          position: sticky;
          top: 0;
          z-index: 900;
          min-height: 80px;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 22px;
          box-sizing: border-box;
          background: rgba(255,255,255,.97);
          border-bottom: 1px solid #e1e9e3;
          backdrop-filter: blur(10px);
        }

        .dashboard-menu-button { display: none; width: 44px; height: 44px; flex: 0 0 44px; align-items: center; justify-content: center; padding: 0; border: 1px solid var(--border); border-radius: 10px; background: #fff; color: var(--green); font-size: 21px; cursor: pointer; }

        .dashboard-header-brand {
          width: 142px;
          flex: 0 0 142px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dashboard-header-brand :global(.polisync-brand-image) { max-width: 138px; }
        .dashboard-header-title { min-width: 0; flex: 1; }
        .dashboard-header-title h1 { margin: 0; color: var(--green); font-size: clamp(21px,2vw,29px); line-height: 1.15; font-weight: 850; letter-spacing: -.35px; }
        .dashboard-header-title p { margin: 5px 0 0; color: var(--muted); font-size: 13px; line-height: 1.4; }

        .dashboard-header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .dashboard-weather { display: flex; align-items: center; gap: 8px; min-width: 86px; padding-right: 12px; border-right: 1px solid #e4ebe6; }
        .dashboard-weather-icon { font-size: 21px; }
        .dashboard-weather strong { display: block; color: #344139; font-size: 12px; }
        .dashboard-weather small { display: block; margin-top: 2px; color: var(--light); font-size: 9px; }

        .dashboard-header-icon { width: 42px; height: 42px; flex: 0 0 42px; display: grid; place-items: center; padding: 0; border: 1px solid var(--border); border-radius: 10px; background: #fff; font-size: 18px; cursor: pointer; }
        .dashboard-header-icon:hover { background: #f2f7f4; }
        .dashboard-profile { min-height: 44px; display: flex; align-items: center; gap: 9px; padding: 4px 10px 4px 5px; border: 1px solid var(--border); border-radius: 999px; background: #fff; cursor: pointer; }
        .dashboard-profile-avatar { width: 35px; height: 35px; flex: 0 0 35px; display: grid; place-items: center; border-radius: 50%; background: var(--green); color: #fff; font-size: 11px; font-weight: 900; border: 2px solid var(--gold); }
        .dashboard-profile-text { min-width: 0; display: flex; flex-direction: column; align-items: flex-start; }
        .dashboard-profile-text strong { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #344139; font-size: 12px; }
        .dashboard-profile-text small { margin-top: 3px; color: var(--light); font-size: 10px; }
        .dashboard-profile-arrow { color: #7b8780; font-size: 9px; }
        .dashboard-content-wrapper { width: 100%; min-width: 0; min-height: calc(100vh - 80px); }
        .dashboard-overlay { position: fixed; inset: 0; z-index: 1150; border: 0; background: rgba(7,34,19,.48); cursor: pointer; }

        @media (max-width: 1200px) {
          .dashboard-header-brand { display: none; }
        }

        @media (max-width: 1100px) {
          .dashboard-sidebar { transform: translateX(-105%); }
          .dashboard-sidebar-open { transform: translateX(0); }
          .dashboard-sidebar-close { display: block; }
          .dashboard-main { width: 100%; margin-left: 0; }
          .dashboard-menu-button { display: inline-flex; }
          .dashboard-header { padding: 10px 18px; }
        }

        @media (max-width: 760px) {
          .dashboard-header { min-height: 68px; gap: 8px; padding: 9px 12px; }
          .dashboard-header-title h1 { font-size: 19px; }
          .dashboard-header-title p, .dashboard-weather { display: none; }
          .dashboard-header-actions { gap: 5px; }
          .dashboard-header-icon { width: 38px; height: 38px; flex-basis: 38px; font-size: 17px; }
          .dashboard-profile { min-height: 38px; padding: 0; border: 0; }
          .dashboard-profile-text, .dashboard-profile-arrow { display: none; }
          .dashboard-profile-avatar { width: 38px; height: 38px; flex-basis: 38px; }
          .dashboard-content-wrapper { min-height: calc(100vh - 68px); }
        }

        @media (max-width: 430px) {
          .dashboard-sidebar { width: min(88vw,320px); }
          .dashboard-menu-button { width: 38px; height: 38px; flex-basis: 38px; font-size: 18px; }
          .dashboard-header-title h1 { font-size: 17px; }
          .dashboard-header-icon { width: 36px; height: 36px; flex-basis: 36px; }
          .dashboard-profile-avatar { width: 36px; height: 36px; flex-basis: 36px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .dashboard-sidebar, .dashboard-nav-item { transition: none; }
        }
      `}</style>
    </div>
  );
}

function FallbackNavigation({ activeSection, onSectionChange, onNavigate }) {
  const items = [
    ["overview", "⌂", "Dashboard"],
    ["elections", "◉", "Elections"],
    ["results", "▣", "Results"],
    ["analytics", "◫", "Analytics"],
    ["reports", "◌", "Reports"],
    ["tasks", "✓", "Tasks & Reminders"],
    ["ai-analyzer", "◉", "AI Analyzer"],
    ["ai-assistant", "✦", "AI Personal Assistant"],
    ["messages", "☷", "Messages"],
    ["notifications", "🔔", "Notifications"],
    ["profile", "♙", "Profile"],
    ["privacy-security", "⚙", "Privacy & Security"],
    ["help", "?", "Help & Support"],
  ];

  return (
    <>
      <div className="dashboard-nav-section">WORKSPACE</div>
      {items.map(([key, icon, label]) => {
        const active = activeSection === key;
        return (
          <a
            key={key}
            href="#"
            className={`dashboard-nav-item ${active ? "dashboard-nav-item-active" : ""}`}
            aria-current={active ? "page" : undefined}
            onClick={(event) => {
              event.preventDefault();
              onSectionChange?.(key);
              onNavigate?.();
            }}
          >
            <span className="dashboard-nav-icon" aria-hidden="true">{icon}</span>
            <span className="dashboard-nav-label">{label}</span>
          </a>
        );
      })}
    </>
  );
}

function formatRole(role) {
  if (!role) return "User";
  return String(role).replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getInitials(value) {
  const words = String(value || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "U";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}
