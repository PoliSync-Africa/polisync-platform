"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function NotesNavInjector() {
  const pathname = usePathname();

  useEffect(() => {
    let observer;
    let timer;
    const inject = () => {
      const groups = Array.from(document.querySelectorAll(".dashboard-nav-group"));
      const workspace = groups.find((group) => String(group.querySelector(".dashboard-nav-section")?.textContent || "").trim().toUpperCase() === "ALL WORKSPACES");
      if (!workspace || workspace.querySelector('a[href="/notes"]')) return;
      const link = document.createElement("a");
      link.href = "/notes";
      link.className = "dashboard-nav-item";
      link.setAttribute("data-notes-nav", "true");
      link.innerHTML = '<span class="dashboard-nav-icon" aria-hidden="true">📝</span><span class="dashboard-nav-label">Notes</span>';
      link.addEventListener("click", () => { document.querySelector(".dashboard-sidebar")?.classList.remove("mobile-open"); });
      workspace.appendChild(link);
    };
    inject();
    observer = new MutationObserver(inject);
    observer.observe(document.body, { childList: true, subtree: true });
    timer = window.setTimeout(inject, 500);
    return () => { observer?.disconnect(); window.clearTimeout(timer); };
  }, [pathname]);

  return null;
}
