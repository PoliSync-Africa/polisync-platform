"use client";

import { useState } from "react";

export default function PrivacySecurityPanel({
  user = null,
}) {
  const [settings, setSettings] = useState({
    showOnlineStatus: true,
    showLastSeen: true,
    allowMessages: true,
    loginAlerts: true,
  });

  const [showSessions, setShowSessions] =
    useState(false);

  const [saved, setSaved] = useState(false);

  const updateSetting = (key) => {
    setSettings((current) => ({
      ...current,
      [key]: !current[key],
    }));

    setSaved(false);
  };

  const saveSettings = async () => {
    /*
     * Backend persistence will be connected to the
     * authenticated privacy/security endpoint.
     *
     * For now this updates the dashboard state without
     * pretending that the backend has already saved it.
     */

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  return (
    <section className="polisync-security-panel">
      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="security-header">
        <div className="security-title-area">
          <div className="security-icon">
            🔐
          </div>

          <div>
            <span className="security-label">
              ACCOUNT PROTECTION
            </span>

            <h2>
              Privacy & Security
            </h2>

            <p>
              Control your privacy, visibility and
              account security.
            </p>
          </div>
        </div>

        <div className="security-status">
          <span />
          Protected
        </div>
      </div>

      {/* ====================================================
          PRIVACY
      ==================================================== */}

      <div className="security-section">
        <div className="security-section-heading">
          <strong>Privacy</strong>

          <span>
            Choose what other users can see.
          </span>
        </div>

        <SecurityToggle
          title="Show Online Status"
          description="Allow others to see when you are online."
          checked={settings.showOnlineStatus}
          onChange={() =>
            updateSetting("showOnlineStatus")
          }
        />

        <SecurityToggle
          title="Show Last Seen"
          description="Allow others to see your most recent activity time."
          checked={settings.showLastSeen}
          onChange={() =>
            updateSetting("showLastSeen")
          }
        />

        <SecurityToggle
          title="Allow Messages"
          description="Allow permitted users to contact you through PoliSync."
          checked={settings.allowMessages}
          onChange={() =>
            updateSetting("allowMessages")
          }
        />
      </div>

      {/* ====================================================
          SECURITY
      ==================================================== */}

      <div className="security-section">
        <div className="security-section-heading">
          <strong>Security</strong>

          <span>
            Protect your account from unauthorized access.
          </span>
        </div>

        <SecurityToggle
          title="Login Security Alerts"
          description="Receive alerts when important login activity occurs."
          checked={settings.loginAlerts}
          onChange={() =>
            updateSetting("loginAlerts")
          }
        />

        <SecurityAction
          icon="🔑"
          title="Change Password"
          description="Update your PoliSync Africa account password."
          action="Change"
        />

        <SecurityAction
          icon="📱"
          title="Login Verification"
          description="Manage additional verification required during login."
          action="Manage"
        />
      </div>

      {/* ====================================================
          ACTIVE SESSIONS
      ==================================================== */}

      <div className="security-section">
        <button
          type="button"
          className="sessions-heading"
          onClick={() =>
            setShowSessions(
              (current) => !current
            )
          }
        >
          <div>
            <strong>
              Active Sessions
            </strong>

            <span>
              Review devices currently signed in
              to your account.
            </span>
          </div>

          <span>
            {showSessions ? "▲" : "▼"}
          </span>
        </button>

        {showSessions && (
          <div className="sessions-list">
            <SessionItem
              device="Current device"
              location="Current session"
              status="Active now"
              current
            />

            <SessionItem
              device="Other sessions"
              location="No additional sessions loaded"
              status="Not available"
            />
          </div>
        )}
      </div>

      {/* ====================================================
          SAVE
      ==================================================== */}

      <div className="security-footer">
        <div className="security-save-message">
          {saved && (
            <>
              <span>✓</span>
              Preferences updated locally.
            </>
          )}
        </div>

        <button
          type="button"
          className="save-security-button"
          onClick={saveSettings}
        >
          Save Preferences
        </button>
      </div>

      {/* ====================================================
          ACCOUNT SAFETY
      ==================================================== */}

      <div className="security-notice">
        <span>🛡️</span>

        <p>
          Never share your password, login
          verification codes or authentication
          tokens with anyone. PoliSync Africa will
          never ask you to disclose them.
        </p>
      </div>

      <style jsx>{`
        .polisync-security-panel {
          width: 100%;
          padding: 22px;
          border: 1px solid #e3ebe5;
          border-radius: 18px;
          background: #ffffff;
          box-shadow:
            0 8px 24px rgba(17, 65, 36, 0.05);
        }

        /* ==================================================
           HEADER
        ================================================== */

        .security-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
        }

        .security-title-area {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .security-icon {
          width: 43px;
          height: 43px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 13px;
          background: #eaf5ee;
          border: 1px solid #d9e9de;
          font-size: 20px;
        }

        .security-label {
          display: block;
          color: #c9a227;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1.1px;
        }

        .security-title-area h2 {
          margin: 3px 0 0;
          color: #075f2b;
          font-size: 18px;
          font-weight: 850;
        }

        .security-title-area p {
          margin: 3px 0 0;
          color: #818a84;
          font-size: 10px;
          line-height: 1.4;
        }

        .security-status {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border-radius: 999px;
          background: #eef8f1;
          color: #267043;
          font-size: 8px;
          font-weight: 800;
          white-space: nowrap;
        }

        .security-status span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #0a8f3c;
        }

        /* ==================================================
           SECTIONS
        ================================================== */

        .security-section {
          margin-top: 20px;
          padding-top: 17px;
          border-top: 1px solid #edf1ee;
        }

        .security-section-heading {
          margin-bottom: 9px;
        }

        .security-section-heading strong {
          display: block;
          color: #344139;
          font-size: 12px;
          font-weight: 850;
        }

        .security-section-heading span {
          display: block;
          margin-top: 3px;
          color: #929b95;
          font-size: 9px;
        }

        /* ==================================================
           TOGGLE
        ================================================== */

        .security-toggle {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 11px 0;
          border: 0;
          border-bottom: 1px solid #f0f3f1;
          background: transparent;
          text-align: left;
        }

        .security-toggle:last-child {
          border-bottom: 0;
        }

        .security-toggle-text {
          min-width: 0;
          flex: 1;
        }

        .security-toggle-text strong {
          display: block;
          color: #445149;
          font-size: 11px;
          font-weight: 750;
        }

        .security-toggle-text span {
          display: block;
          margin-top: 3px;
          color: #929b95;
          font-size: 8px;
          line-height: 1.4;
        }

        .security-switch {
          position: relative;
          width: 39px;
          height: 22px;
          flex-shrink: 0;
          border-radius: 999px;
          background: #cbd5ce;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .security-switch-active {
          background: #075f2b;
        }

        .security-switch-knob {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow:
            0 1px 4px rgba(0, 0, 0, 0.18);
          transition: transform 0.15s ease;
        }

        .security-switch-active
          .security-switch-knob {
          transform: translateX(17px);
        }

        /* ==================================================
           ACTIONS
        ================================================== */

        .security-action {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 0;
          border: 0;
          border-bottom: 1px solid #f0f3f1;
          background: transparent;
          text-align: left;
          cursor: pointer;
        }

        .security-action:last-child {
          border-bottom: 0;
        }

        .security-action-icon {
          width: 31px;
          height: 31px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 9px;
          background: #f3f7f4;
          font-size: 14px;
        }

        .security-action-content {
          min-width: 0;
          flex: 1;
        }

        .security-action-content strong {
          display: block;
          color: #445149;
          font-size: 11px;
        }

        .security-action-content span {
          display: block;
          margin-top: 3px;
          color: #929b95;
          font-size: 8px;
          line-height: 1.4;
        }

        .security-action-arrow {
          color: #8b948e;
          font-size: 13px;
        }

        /* ==================================================
           SESSIONS
        ================================================== */

        .sessions-heading {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 0;
          border: 0;
          background: transparent;
          color: inherit;
          text-align: left;
          cursor: pointer;
        }

        .sessions-heading strong {
          display: block;
          color: #344139;
          font-size: 12px;
        }

        .sessions-heading div span {
          display: block;
          margin-top: 3px;
          color: #929b95;
          font-size: 9px;
        }

        .sessions-heading > span {
          color: #7f8982;
          font-size: 10px;
        }

        .sessions-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-top: 12px;
        }

        .session-item {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 10px;
          border: 1px solid #e7eee9;
          border-radius: 10px;
          background: #fbfdfb;
        }

        .session-icon {
          width: 31px;
          height: 31px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: #eaf5ee;
          font-size: 14px;
        }

        .session-content {
          min-width: 0;
          flex: 1;
        }

        .session-content strong {
          display: block;
          color: #46534b;
          font-size: 10px;
        }

        .session-content span {
          display: block;
          margin-top: 2px;
          color: #929b95;
          font-size: 8px;
        }

        .session-status {
          color: #6e7972;
          font-size: 8px;
          font-weight: 750;
          white-space: nowrap;
        }

        .session-current {
          color: #0a8f3c;
        }

        /* ==================================================
           FOOTER
        ================================================== */

        .security-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 18px;
          padding-top: 15px;
          border-top: 1px solid #edf1ee;
        }

        .security-save-message {
          min-height: 20px;
          color: #0a8f3c;
          font-size: 8px;
        }

        .security-save-message span {
          margin-right: 4px;
          font-weight: 900;
        }

        .save-security-button {
          padding: 9px 13px;
          border: 0;
          border-radius: 9px;
          background: #075f2b;
          color: #ffffff;
          font-size: 10px;
          font-weight: 850;
          cursor: pointer;
        }

        .save-security-button:hover {
          background: #064d24;
        }

        /* ==================================================
           NOTICE
        ================================================== */

        .security-notice {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          margin-top: 14px;
          padding: 9px 10px;
          border: 1px solid #eee7c9;
          border-radius: 9px;
          background: #fbfaf4;
        }

        .security-notice span {
          font-size: 11px;
        }

        .security-notice p {
          margin: 0;
          color: #837b5a;
          font-size: 8px;
          line-height: 1.5;
        }

        /* ==================================================
           MOBILE
        ================================================== */

        @media (max-width: 600px) {
          .polisync-security-panel {
            padding: 17px;
          }

          .security-title-area p {
            display: none;
          }

          .security-status {
            padding: 4px 6px;
          }

          .security-footer {
            align-items: stretch;
            flex-direction: column;
          }

          .save-security-button {
            width: 100%;
          }
        }

        @media (max-width: 420px) {
          .security-status {
            display: none;
          }

          .security-icon {
            width: 38px;
            height: 38px;
          }

          .security-title-area h2 {
            font-size: 16px;
          }
        }
      `}</style>
    </section>
  );
}

/* ============================================================
   SECURITY TOGGLE
============================================================ */

function SecurityToggle({
  title,
  description,
  checked,
  onChange,
}) {
  return (
    <button
      type="button"
      className="security-toggle"
      onClick={onChange}
      aria-pressed={checked}
    >
      <span className="security-toggle-text">
        <strong>{title}</strong>

        <span>{description}</span>
      </span>

      <span
        className={`security-switch ${
          checked
            ? "security-switch-active"
            : ""
        }`}
        aria-hidden="true"
      >
        <span className="security-switch-knob" />
      </span>
    </button>
  );
}

/* ============================================================
   SECURITY ACTION
============================================================ */

function SecurityAction({
  icon,
  title,
  description,
  action,
}) {
  return (
    <button
      type="button"
      className="security-action"
      onClick={() => {
        /*
         * Navigation/actions will be connected to the
         * appropriate security routes later.
         */
        console.info(
          `PoliSync security action: ${action}`
        );
      }}
    >
      <span className="security-action-icon">
        {icon}
      </span>

      <span className="security-action-content">
        <strong>{title}</strong>

        <span>{description}</span>
      </span>

      <span className="security-action-arrow">
        ›
      </span>
    </button>
  );
}

/* ============================================================
   SESSION ITEM
============================================================ */

function SessionItem({
  device,
  location,
  status,
  current = false,
}) {
  return (
    <div className="session-item">
      <div className="session-icon">
        💻
      </div>

      <div className="session-content">
        <strong>{device}</strong>

        <span>{location}</span>
      </div>

      <span
        className={`session-status ${
          current
            ? "session-current"
            : ""
        }`}
      >
        {status}
      </span>
    </div>
  );
}
