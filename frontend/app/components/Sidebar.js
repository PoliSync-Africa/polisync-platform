"use client";

import { useState } from "react";

const menu = [
  { label: "Election Center", href: "/elections" },
  { label: "Transmit Results", href: "/submit-result" },
  { label: "Live Results", href: "/results" },
  { label: "Political Parties", href: "/party" },
  { label: "Presidential Candidates", href: "/presidential-candidate" },
  { label: "Parliamentary Candidates", href: "/parliamentary-candidate" },
  { label: "Calendar", href: "/calendar" },
  { label: "Personal Workspace", href: "/personal" },
  { label: "Weather", href: "/weather" },
  { label: "Messages", href: "/messages" },
  { label: "Notifications", href: "/notifications" },
  { label: "AI Analyzer", href: "/ai-analyzer" },
  { label: "Command Center", href: "/command-center" },
  { label: "War Room", href: "/war-room" },
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

        <nav className="polisync-sidebar-nav" aria-label="Election and product navigation">
          {menu.map((item) => (
            <a
              className="polisync-sidebar-item"
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
    </>
  );
}
