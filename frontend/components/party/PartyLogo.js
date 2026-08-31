"use client";

import { useState } from "react";

const PARTY_LOGOS = {
  npp: "/parties/npp.svg", ndc: "/parties/ndc.svg", cpp: "/parties/cpp.svg", gum: "/parties/gum.svg",
  lpg: "/parties/lpg.svg", ppp: "/parties/ppp.svg", up: "/parties/up.svg", "new-force": "/parties/new-force.svg",
  base: "/parties/base.svg", gfp: "/parties/gfp.svg", eyekube: "/parties/eyekube.svg", independent: "/parties/independent.svg",
};

const PARTY_ALIASES = {
  "new patriotic party": "npp", "national democratic congress": "ndc", "convention people's party": "cpp", "convention peoples party": "cpp",
  "ghana union movement": "gum", "liberal party of ghana": "lpg", "progressive people's party": "ppp", "progressive peoples party": "ppp",
  "united party": "up", "the new force": "new-force", "the base movement": "base", "base movement": "base",
  "ghana freedom party": "gfp", "eye kubɛ": "eyekube", "eye kube": "eyekube", independent: "independent",
};

export function normalizePartyKey(value) {
  const raw = String(value || "").trim().toLowerCase();
  return PARTY_LOGOS[raw] ? raw : PARTY_ALIASES[raw] || null;
}

export function getPartyLogo(value) {
  const key = normalizePartyKey(value);
  return key ? PARTY_LOGOS[key] : null;
}

function partyInitials(value) {
  const key = normalizePartyKey(value) || String(value || "").trim();
  if (key === "independent") return "IND";
  return String(key || "P").replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase();
}

export default function PartyLogo({ party, alt, size = 48, className = "" }) {
  const src = getPartyLogo(party);
  const [failed, setFailed] = useState(false);
  if (!src) return null;

  return (
    <span className={`polisync-party-logo ${className}`.trim()} style={{ width: size, height: size }}>
      {!failed ? <img src={src} alt={alt || `${party} logo`} onError={() => setFailed(true)} /> : <strong>{partyInitials(party)}</strong>}
      <style jsx>{`
        .polisync-party-logo { display:inline-flex; align-items:center; justify-content:center; overflow:hidden; flex:0 0 auto; border-radius:12px; background:#fff; border:1px solid #e3e9e5; }
        .polisync-party-logo img { width:100%; height:100%; object-fit:contain; display:block; }
        .polisync-party-logo strong { color:#075f2b; font-size:${Math.max(10, Math.round(size / 4))}px; font-weight:900; }
      `}</style>
    </span>
  );
}
