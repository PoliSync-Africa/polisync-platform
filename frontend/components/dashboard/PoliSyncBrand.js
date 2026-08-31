"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

const SEARCH_ROUTES = [
  ["Dashboard", "/dashboard"], ["Elections", "/elections"], ["Results", "/results"], ["Analytics", "/analytics"],
  ["Reports", "/reports"], ["AI Analyzer", "/ai-analyzer"], ["AI Personal Assistant", "/ai-assistant"], ["Messages", "/messages"],
  ["Notifications", "/notifications"], ["Profile", "/profile"], ["Privacy & Security", "/settings/security"], ["Organization Profile", "/party/profile"],
  ["National Command", "/party/national"], ["Regional Administration", "/party/regions"], ["Constituencies", "/party/constituencies"],
  ["Polling Stations", "/party/polling-stations"], ["Candidates", "/party/candidates"], ["Polling Agents", "/party/polling-agents"], ["Live Results", "/party/results"],
  ["EC8 Results", "/party/ec8"], ["Communications", "/party/communications"], ["Calendar", "/party/calendar"], ["Complaints", "/party/complaints"],
  ["System Health", "/system-health"], ["Security Status", "/security"], ["User Activity", "/activity"], ["Pending Approvals", "/approvals"],
  ["Party Management", "/party"], ["Candidates Management", "/candidates"], ["Organizations", "/organizations"], ["Users", "/users"],
];

const OFFICIAL_LOGO = "/polisync-brand.svg";

export default function PoliSyncBrand({ compact = false }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];
    return SEARCH_ROUTES.filter(([label]) => label.toLowerCase().includes(value)).slice(0, 8);
  }, [query]);

  const go = (href) => {
    setOpen(false);
    setQuery("");
    if (typeof window !== "undefined") window.location.href = href;
  };

  if (compact) {
    const search = (
      <div className="dashboard-search-portal" role="search">
        <div className="dashboard-search-row">
          <img
            src={OFFICIAL_LOGO}
            alt="PoliSync Africa"
            className="official-corner-logo"
          />
          <div className="search-box">
            <span aria-hidden="true">⌕</span>
            <input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Escape") { setOpen(false); event.currentTarget.blur(); }
                if (event.key === "Enter" && matches[0]) go(matches[0][1]);
              }}
              placeholder="Search PoliSync…"
              aria-label="Search PoliSync"
            />
          </div>
        </div>
        {open && query.trim() && (
          <div className="search-results">
            {matches.length ? matches.map(([label, href]) => (
              <button key={href} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => go(href)}>
                <span>⌕</span>{label}
              </button>
            )) : <div className="no-results">No matching destination</div>}
          </div>
        )}
        <style jsx>{`
          .dashboard-search-portal { position:fixed; top:18px; right:18px; width:420px; z-index:1500; }
          .dashboard-search-row { display:flex; align-items:center; gap:10px; }
          .official-corner-logo { flex:0 0 auto; width:86px; height:44px; object-fit:contain; object-position:center; }
          .search-box { flex:1; width:100%; height:44px; box-sizing:border-box; display:flex; align-items:center; gap:8px; padding:0 13px; background:#fff; border:1.5px solid #dce6df; border-radius:13px; box-shadow:0 7px 22px rgba(7,55,28,.12); }
          .search-box:focus-within { border-color:#c9a227; box-shadow:0 0 0 3px rgba(201,162,39,.12),0 7px 22px rgba(7,55,28,.12); }
          .search-box > span { color:#075f2b; font-size:21px; }
          .search-box input { width:100%; border:0; outline:0; background:transparent; color:#24352b; font-size:13px; font-weight:650; }
          .search-box input::placeholder { color:#8a958e; }
          .search-results { margin-top:6px; margin-left:96px; padding:7px; background:#fff; border:1px solid #dce6df; border-radius:13px; box-shadow:0 15px 35px rgba(7,45,25,.16); }
          .search-results button { width:100%; display:flex; align-items:center; gap:9px; padding:10px 11px; border:0; border-radius:9px; background:#fff; color:#344139; text-align:left; font-size:13px; font-weight:650; cursor:pointer; }
          .search-results button:hover { background:#edf7f0; color:#075f2b; }
          .search-results button span { color:#c9a227; }
          .no-results { padding:12px; color:#849088; font-size:12px; }
          @media (max-width:760px) { .dashboard-search-portal { top:10px; left:10px; right:10px; width:auto; } .official-corner-logo { width:72px; } .search-results { margin-left:82px; } }
        `}</style>
      </div>
    );
    return typeof document !== "undefined" ? createPortal(search, document.body) : null;
  }

  return (
    <div className="polisync-brand">
      <img src={OFFICIAL_LOGO} alt="PoliSync Africa — Africa's Political Intelligence Platform" className="polisync-brand-image" />
      <span className="sr-only">PoliSync Africa — Africa's Political Intelligence Platform</span>
      <style jsx>{`
        .polisync-brand { width:100%; display:flex; align-items:center; justify-content:center; overflow:hidden; }
        .polisync-brand-image { display:block; width:100%; max-width:238px; height:auto; object-fit:contain; }
        .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
      `}</style>
    </div>
  );
}
