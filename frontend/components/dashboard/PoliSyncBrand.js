"use client";

import { useEffect, useMemo, useState } from "react";
import PartyLogo from "../party/PartyLogo";

const SEARCH_ROUTES = [
  ["Dashboard", "/dashboard"], ["Elections", "/elections"], ["Results", "/results"], ["Analytics", "/analytics"],
  ["Reports", "/reports"], ["AI Analyzer", "/ai-analyzer"], ["AI Personal Assistant", "/ai-assistant"], ["Messages", "/messages"],
  ["Notifications", "/notifications"], ["Profile", "/profile"], ["Privacy & Security", "/settings/security"], ["Organization Profile", "/party/profile"],
  ["National Command", "/party/national"], ["Regional Administration", "/party/regions"], ["Constituencies", "/party/constituencies"],
  ["Polling Stations", "/party/polling-stations"], ["Candidates", "/party/candidates"], ["Polling Agents", "/party/polling-agents"], ["Live Results", "/party/results"],
  ["EC8 Results", "/party/ec8"], ["Communications", "/party/communications"], ["Calendar", "/party/calendar"], ["Complaints", "/party/complaints"],
];

export default function PoliSyncBrand({ compact = false }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [party, setParty] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("polisync_user") || sessionStorage.getItem("polisync_user");
      if (!raw) return;
      const user = JSON.parse(raw);
      if (user?.role === "party" || user?.organizationType === "Political Party" || user?.partyCode || user?.party) {
        setParty(user?.partyCode || user?.party || user?.organizationCode || user?.organizationName || null);
      }
    } catch {}
  }, []);

  const matches = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];
    return SEARCH_ROUTES.filter(([label]) => label.toLowerCase().includes(value)).slice(0, 6);
  }, [query]);

  const go = (href) => {
    setOpen(false); setQuery("");
    if (typeof window !== "undefined") window.location.href = href;
  };

  if (compact) {
    return (
      <div className="polisync-brand polisync-brand-search" role="search">
        <div className="search-box"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); event.currentTarget.blur(); } if (event.key === "Enter" && matches[0]) go(matches[0][1]); }} placeholder="Search PoliSync…" aria-label="Search PoliSync" /></div>
        {open && query.trim() && <div className="search-results">{matches.length ? matches.map(([label, href]) => <button key={href} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => go(href)}><span>⌕</span>{label}</button>) : <div className="no-results">No matching destination</div>}</div>}
        <style jsx>{`
          .polisync-brand-search { position:relative; width:100%; overflow:visible; }
          .search-box { width:100%; height:42px; box-sizing:border-box; display:flex; align-items:center; gap:8px; padding:0 12px; background:#fff; border:1.5px solid #dce6df; border-radius:13px; box-shadow:0 4px 14px rgba(7,95,43,.06); }
          .search-box:focus-within { border-color:#c9a227; box-shadow:0 0 0 3px rgba(201,162,39,.12); }
          .search-box > span { color:#075f2b; font-size:20px; line-height:1; }
          .search-box input { width:100%; min-width:0; border:0; outline:0; background:transparent; color:#24352b; font-size:13px; font-weight:600; }
          .search-box input::placeholder { color:#8a958e; font-weight:550; }
          .search-results { position:absolute; top:48px; left:0; width:280px; max-height:310px; overflow:auto; padding:7px; box-sizing:border-box; background:#fff; border:1px solid #dce6df; border-radius:13px; box-shadow:0 15px 35px rgba(7,45,25,.16); z-index:2000; }
          .search-results button { width:100%; display:flex; align-items:center; gap:9px; padding:10px 11px; border:0; border-radius:9px; background:#fff; color:#344139; text-align:left; font-size:13px; font-weight:650; cursor:pointer; }
          .search-results button:hover { background:#edf7f0; color:#075f2b; }
          .search-results button span { color:#c9a227; }
          .no-results { padding:12px; color:#849088; font-size:12px; }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`polisync-brand ${party ? "polisync-brand-with-party" : ""}`}>
      <img src="/polisync-brand.svg" alt="PoliSync Africa — Africa's Political Intelligence Platform" className="polisync-brand-image" />
      {party && <PartyLogo party={party} size={54} className="polisync-party-brand-logo" />}
      <span className="sr-only">PoliSync Africa — Africa's Political Intelligence Platform</span>
      <style jsx>{`
        .polisync-brand { width:100%; display:flex; align-items:center; justify-content:center; overflow:hidden; gap:10px; }
        .polisync-brand-image { display:block; width:100%; max-width:238px; height:auto; object-fit:contain; }
        .polisync-brand-with-party .polisync-brand-image { max-width:185px; }
        .polisync-party-brand-logo { flex:0 0 auto; }
        .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
      `}</style>
    </div>
  );
}
