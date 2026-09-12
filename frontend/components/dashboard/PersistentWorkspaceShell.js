"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const GROUPS = [
  { label: "CORE WORKSPACE", items: [["⌂", "Home", "/dashboard"], ["◉", "Campaigns", "/campaigns"], ["⚑", "Field Work", "/field-work"], ["⌕", "Research & Surveys", "/research"], ["•", "Elections", "/elections"], ["↗", "Results", "/results"]] },
  { label: "OPERATIONS", items: [["◌", "Ghana News & Intelligence", "/news"], ["□", "Calendar", "/calendar"], ["◯", "Messages", "/messages"], ["♧", "Notifications", "/notifications"]] },
  { label: "INTELLIGENCE", items: [["✦", "AI Analyzer", "/ai-analyzer"]] },
  { label: "ACCOUNT", items: [["♙", "Profile", "/profile"], ["⚿", "Privacy & Security", "/settings/security"]] },
];

const PUBLIC_PATHS = ["/login", "/forgot-password", "/setup"];

function hasSession() {
  try {
    return ["polisync_token", "authToken", "accessToken", "token", "polisync_user"]
      .some((key) => Boolean(localStorage.getItem(key) || sessionStorage.getItem(key)));
  } catch {
    return false;
  }
}

export default function PersistentWorkspaceShell() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const publicPage = pathname === "/" || PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
    if (publicPage || !hasSession()) {
      setVisible(false);
      return undefined;
    }

    let timer = 0;
    const sync = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        setVisible(!document.querySelector(".dashboard-sidebar"));
      }, 0);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="polisync-persistent-workspace" aria-label="PoliSync Africa workspace">
      <aside className="polisync-persistent-sidebar">
        <div className="polisync-persistent-brand"><strong>POLISYNC AFRICA</strong><span>POLITICAL TECHNOLOGY PLATFORM</span></div>
        <nav>
          {GROUPS.map((group) => (
            <div className="polisync-persistent-group" key={group.label}>
              <div className="polisync-persistent-heading">{group.label}</div>
              {group.items.map(([icon, label, href]) => (
                <a key={href} href={href} className={pathname === href || pathname.startsWith(`${href}/`) ? "active" : ""}>
                  <i aria-hidden="true">{icon}</i><span>{label}</span>
                </a>
              ))}
            </div>
          ))}
        </nav>
        <div className="polisync-persistent-footer">Workspace navigation stays available across pages.</div>
      </aside>
    </div>
  );
}
