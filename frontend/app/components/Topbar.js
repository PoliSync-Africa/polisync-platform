"use client";

export default function Topbar() {
  return (
    <header className="polisync-topbar">
      <div className="polisync-topbar-title">
        <h2>Command Center</h2>
      </div>

      <div className="polisync-topbar-actions">
        <button type="button" className="polisync-notification" aria-label="Notifications">
          <span aria-hidden="true">🔔</span>
        </button>

        <button type="button" className="polisync-profile" aria-label="Open profile">
          D
        </button>
      </div>
    </header>
  );
}
