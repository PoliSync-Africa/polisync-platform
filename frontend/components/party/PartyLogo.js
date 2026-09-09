"use client";

import { useState } from "react";

const PARTY_LOGOS = {
  npp: "/parties/npp.svg",
  ndc: "/parties/ndc.svg",
  cpp: "/parties/cpp.svg",
  gum: "/parties/gum.svg",
  lpg: "/parties/lpg.svg",
  ppp: "/parties/ppp.svg",
  up: "/parties/up.svg",
  "new-force": "/parties/new-force.svg",
  base: "/parties/base.svg",
  gfp: "/parties/gfp.svg",
  eyekube: "/parties/eyekube.svg",
  independent: "/parties/independent.svg",
};

const PARTY_ALIASES = {
  npp: "npp", "new patriotic party": "npp",
  ndc: "ndc", "national democratic congress": "ndc",
  cpp: "cpp", "convention people's party": "cpp", "convention peoples party": "cpp",
  gum: "gum", "ghana union movement": "gum",
  lpg: "lpg", "liberal party of ghana": "lpg",
  ppp: "ppp", "progressive people's party": "ppp", "progressive peoples party": "ppp",
  up: "up", "united party": "up", "up (movement for change)": "up",
  "new force": "new-force", "the new force": "new-force",
  "the base party": "base", "the base movement": "base", "base movement": "base",
  gfp: "gfp", "ghana freedom party": "gfp",
  pnc: "pnc", "people's national convention": "pnc", "peoples national convention": "pnc",
  "eye kube": "eyekube", "eye kubɛ": "eyekube",
  independent: "independent",
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
  const raw = String(value || "").trim();
  const key = normalizePartyKey(raw);
  if (key === "independent") return "IND";
  if (key === "new-force") return "NF";
  if (key === "base") return "BASE";
  if (key === "eyekube") return "EK";
  if (key === "pnc") return "PNC";
  return String(key || raw || "P").replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase();
}

export default function PartyLogo({ party, alt, size = 40, width, height, className = "" }) {
  const src = getPartyLogo(party);
  const [failed, setFailed] = useState(false);
  const logoWidth = width || size;
  const logoHeight = height || size;

  return (
    <span className={`polisync-party-logo ${className}`.trim()} style={{ width: logoWidth, height: logoHeight }}>
      {src && !failed ? (
        <img src={src} alt={alt || `${party} logo`} onError={() => setFailed(true)} />
      ) : (
        <strong>{partyInitials(party)}</strong>
      )}
      <style jsx>{`
        .polisync-party-logo { display:inline-flex; align-items:center; justify-content:center; overflow:hidden; flex:0 0 auto; border-radius:8px; background:#fff; border:1px solid #e3e9e5; box-sizing:border-box; }
        .polisync-party-logo img { width:100%; height:100%; object-fit:contain; display:block; padding:3px; box-sizing:border-box; }
        .polisync-party-logo strong { color:#075f2b; font-size:${Math.max(9, Math.round(Math.min(logoWidth, logoHeight) / 3.5))}px; font-weight:900; letter-spacing:.2px; }
      `}</style>
    </span>
  );
}
