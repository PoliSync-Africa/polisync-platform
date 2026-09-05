"use client";

import { useState } from "react";

const menu = [
  "Dashboard",
  "Elections",
  "Results",
  "Campaign",
  "Research",
  "Support",
  "Settings"
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="mobile-sidebar-toggle"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <button
          type="button"
          className="mobile-sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`polisync-sidebar${open ? " is-open" : ""}`}>
        <div className="polisync-sidebar-brand">POLISYNC</div>

        <nav className="polisync-sidebar-nav" aria-label="Primary navigation">
          {menu.map((item) => (
            <button
              type="button"
              className="polisync-sidebar-item"
              key={item}
              onClick={() => setOpen(false)}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
