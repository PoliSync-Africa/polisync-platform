"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function NotesNavInjector() {
  const pathname = usePathname();

  useEffect(() => {
    let attempts = 0;
    let timer;
    const inject = () => {
      if (document.querySelector('a[href="/notes"]')) return true;
      const groups = Array.from(document.querySelectorAll(".dashboard-nav-group"));
      const workspace = groups.find((group) => String(group.querySelector(".dashboard-nav-section")?.textContent || "").trim().toUpperCase() === "ALL WORKSPACES");
      if (!workspace) return false;
      const link = document.createElement("a");
      link.href = "/notes";
      link.className = "dashboard-nav-item";
      link.setAttribute("data-notes-nav", "true");
      link.innerHTML = '<span class="dashboard-nav-icon" aria-hidden="true">📝</span><span class="dashboard-nav-label">Notes</span>';
      workspace.appendChild(link);
      return true;
    };

    const tryInject = () => {
      if (inject() || attempts++ >= 20) return;
      timer = window.setTimeout(tryInject, 150);
    };
    tryInject();
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
