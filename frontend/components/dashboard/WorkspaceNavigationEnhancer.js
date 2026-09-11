"use client";

import { useEffect } from "react";

const GROUPS = [
  {
    label: "CORE WORKSPACE",
    items: ["/campaigns", "/field-work", "/research", "/elections", "/results"],
  },
  {
    label: "OPERATIONS",
    items: ["/news", "/calendar", "/messages", "/notifications"],
  },
  {
    label: "INTELLIGENCE",
    items: ["/ai-analyzer"],
  },
  {
    label: "ACCOUNT",
    items: ["/profile", "/settings/security"],
  },
];

function arrangeWorkspaceNavigation() {
  const navigation = document.querySelector(".dashboard-navigation");
  if (!navigation) return;

  const source = Array.from(navigation.querySelectorAll(".dashboard-nav-group")).find((group) =>
    group.querySelector(".dashboard-nav-section")?.textContent?.trim() === "ALL WORKSPACES"
  );
  if (!source || source.dataset.polisyncArranged === "true") return;

  const links = new Map(
    Array.from(source.querySelectorAll(".dashboard-nav-item")).map((link) => [link.getAttribute("href"), link])
  );
  if (!links.size) return;

  const observer = window.__polisyncWorkspaceObserver;
  observer?.disconnect();

  const fragment = document.createDocumentFragment();
  const used = new Set();

  for (const group of GROUPS) {
    const wrapper = document.createElement("div");
    wrapper.className = "dashboard-nav-group dashboard-nav-group-workspace";

    const heading = document.createElement("div");
    heading.className = "dashboard-nav-section";
    heading.textContent = group.label;
    wrapper.appendChild(heading);

    for (const href of group.items) {
      const link = links.get(href);
      if (link) {
        wrapper.appendChild(link);
        used.add(href);
      }
    }

    if (wrapper.querySelector(".dashboard-nav-item")) fragment.appendChild(wrapper);
  }

  for (const [href, link] of links) {
    if (used.has(href) || href === "/dashboard") continue;
    const wrapper = document.createElement("div");
    wrapper.className = "dashboard-nav-group dashboard-nav-group-workspace";
    const heading = document.createElement("div");
    heading.className = "dashboard-nav-section";
    heading.textContent = "MORE";
    wrapper.appendChild(heading);
    wrapper.appendChild(link);
    fragment.appendChild(wrapper);
  }

  source.replaceChildren();
  source.dataset.polisyncArranged = "true";
  source.classList.add("dashboard-workspace-root");
  source.appendChild(fragment);
  source.querySelectorAll(".dashboard-nav-section").forEach((heading) => {
    heading.setAttribute("aria-hidden", "true");
  });

  const restored = window.__polisyncWorkspaceObserver;
  restored?.observe(navigation, { childList: true, subtree: true });
}

export default function WorkspaceNavigationEnhancer() {
  useEffect(() => {
    let timer = 0;
    const run = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(arrangeWorkspaceNavigation, 0);
    };

    const observer = new MutationObserver(run);
    window.__polisyncWorkspaceObserver = observer;
    observer.observe(document.body, { childList: true, subtree: true });
    run();

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      if (window.__polisyncWorkspaceObserver === observer) delete window.__polisyncWorkspaceObserver;
    };
  }, []);

  return null;
}
