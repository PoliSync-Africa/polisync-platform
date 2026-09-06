"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const SEARCH_ROUTES = [["Dashboard","/dashboard"],["Campaigns","/campaigns"],["Field Work","/field-work"],["Research & Surveys","/research"],["Elections","/elections"],["Results","/results"],["Ghana News & Intelligence","/news"],["Analytics","/analytics"],["Reports","/reports"],["AI Analyzer","/ai-analyzer"],["AI Personal Assistant","/ai-assistant"],["Messages","/messages"],["Notifications","/notifications"],["Profile","/profile"],["Privacy & Security","/settings/security"],["Calendar","/calendar"],["Organizations","/organizations"],["Candidates","/candidates"],["Polling Stations","/party/polling-stations"],["Live Results","/party/results"]];
const OFFICIAL_LOGO = "/IMG_9654.jpeg";

const roleLabel = (role) => ({
  national_party_admin: "National Admin",
  regional_party_admin: "Regional Admin",
  constituency_admin: "Constituency Admin",
  polling_station_agent: "Polling Station Agent",
  national_observer_admin: "National Admin",
  regional_observer_admin: "Regional Admin",
  constituency_observer_admin: "Constituency Admin",
  observer_polling_station_agent: "Polling Station Agent",
  presidential_candidate: "Presidential Candidate",
  parliamentary_candidate: "Parliamentary Candidate",
  research_institution_admin: "Research Institution Admin",
  researcher: "Researcher",
  individual_researcher: "Individual Researcher",
  organization_member: "Organization Member",
})[role] || String(role || "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function getGreeting() {
  const parts = new Intl.DateTimeFormat(undefined, { hour: "numeric", hour12: false }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
  return hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
}

async function loadDashboardProfile() {
  if (typeof window === "undefined") return null;
  if (window.__polisyncProfilePromise) return window.__polisyncProfilePromise;
  const token = localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || "";
  if (!token) return null;
  const apiBase = String(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  window.__polisyncProfilePromise = fetch(`${apiBase}/api/profile/me`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store" })
    .then((response) => response.ok ? response.json() : null)
    .then((data) => data?.success ? data.user : null)
    .catch(() => null);
  return window.__polisyncProfilePromise;
}

function applyDashboardGreeting(user) {
  if (typeof document === "undefined") return;
  const container = document.querySelector(".reference-welcome");
  if (!container) return;
  const eyebrow = container.querySelector(".eyebrow");
  const heading = container.querySelector(".welcome-name-row h2");
  const pill = container.querySelector(".welcome-name-row .role-pill");
  if (!eyebrow || !heading) return;

  const contexts = Array.isArray(user?.organizationContexts) ? user.organizationContexts : [];
  const existingRole = pill?.textContent?.trim() || "";
  const context = contexts.find((item) => roleLabel(item.role) === existingRole) || contexts[0] || null;
  const firstName = user?.firstName || user?.displayName?.trim()?.split(/\s+/)?.[0] || "there";
  let target = firstName;

  if (context?.organizationName) {
    const organizationName = context.politicalPartyName || context.organizationName;
    target = `${organizationName} ${roleLabel(context.role)}`.trim();
    if (context.role === "polling_station_agent" || context.role === "observer_polling_station_agent") {
      if (context.pollingStationName) target += `, ${context.pollingStationName}`;
    }
  }

  eyebrow.textContent = getGreeting();
  heading.textContent = `Welcome Back, ${target}`;
  if (pill) pill.style.display = "none";
}

export default function PoliSyncBrand({ compact = false }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    const value = q.trim().toLowerCase();
    return value ? SEARCH_ROUTES.filter(([label]) => label.toLowerCase().includes(value)).slice(0, 8) : [];
  }, [q]);

  useEffect(() => {
    let active = true;
    const apply = async () => {
      const user = await loadDashboardProfile();
      if (active) applyDashboardGreeting(user);
    };
    apply();
    const timer = window.setTimeout(() => applyDashboardGreeting(window.__polisyncProfileCache || null), 700);
    return () => { active = false; window.clearTimeout(timer); };
  }, []);

  const go = (href) => { setOpen(false); setQ(""); if (typeof window !== "undefined") window.location.href = href; };

  if (compact) {
    const search = <div className="search-portal" role="search"><div className="search-row"><img src={OFFICIAL_LOGO} alt="PoliSync Africa" className="corner-logo"/><div className="search-box"><span aria-hidden="true">⌕</span><input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={(e) => { if (e.key === "Escape") { setOpen(false); e.currentTarget.blur(); } if (e.key === "Enter" && matches[0]) go(matches[0][1]); }} placeholder="Search PoliSync…" aria-label="Search PoliSync"/></div></div>{open && q.trim() && <div className="search-results">{matches.length ? matches.map(([label, href]) => <button key={href} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => go(href)}><span>⌕</span>{label}</button>) : <div className="no-results">No matching destination</div>}</div>}<style jsx>{`.search-portal{position:fixed;left:50%;bottom:max(12px,env(safe-area-inset-bottom));transform:translateX(-50%);width:min(520px,calc(100vw - 28px));z-index:1100;pointer-events:none}.search-row,.search-results{pointer-events:auto}.search-row{display:flex;align-items:center;gap:9px}.corner-logo{flex:0 0 42px;width:42px;height:42px;object-fit:contain;border-radius:8px}.search-box{flex:1;min-width:0;height:46px;display:flex;align-items:center;gap:8px;padding:0 13px;background:#fff;border:1.5px solid #0a7135;border-radius:14px;box-shadow:0 9px 26px rgba(7,55,28,.16)}.search-box:focus-within{border-color:#c9a227;box-shadow:0 0 0 3px rgba(201,162,39,.12),0 9px 26px rgba(7,55,28,.16)}.search-box>span{color:#075f2b;font-size:21px}.search-box input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#24352b;font-size:13px;font-weight:650}.search-box input::placeholder{color:#8a958e}.search-results{margin:6px 0 51px;padding:7px;background:#fff;border:1px solid #0a7135;border-radius:13px;box-shadow:0 15px 35px rgba(7,45,25,.16);max-height:45vh;overflow:auto}.search-results button{width:100%;display:flex;align-items:center;gap:9px;padding:10px 11px;border:0;border-radius:9px;background:#fff;color:#344139;text-align:left;font-size:12px;font-weight:650;cursor:pointer}.search-results button:hover{background:#edf7f0;color:#075f2b}.no-results{padding:12px;color:#849088;font-size:12px}@media(max-width:760px){.search-portal{left:12px;right:12px;bottom:max(10px,env(safe-area-inset-bottom));transform:none;width:auto}.corner-logo{flex:0 0 36px;width:36px;height:36px}.search-box{height:44px}.search-results{margin-left:45px;max-height:38vh}}@media(max-width:430px){.corner-logo{display:none}.search-results{margin-left:0}.search-box{height:46px;border-radius:13px}}`}</style></div>;
    return typeof document !== "undefined" ? createPortal(search, document.body) : null;
  }

  return <div className="polisync-brand"><img src={OFFICIAL_LOGO} alt="PoliSync Africa — Africa's Political Intelligence Platform" className="polisync-brand-image"/><span className="sr-only">PoliSync Africa — Africa's Political Intelligence Platform</span><style jsx>{`.polisync-brand{width:100%;display:flex;align-items:center;justify-content:center;overflow:hidden}.polisync-brand-image{display:block;width:100%;max-width:238px;max-height:82px;height:auto;object-fit:contain;border-radius:10px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}`}</style></div>;
}
