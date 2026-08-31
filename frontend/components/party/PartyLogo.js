"use client";

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
  "new patriotic party": "npp",
  "national democratic congress": "ndc",
  "convention people's party": "cpp",
  "convention peoples party": "cpp",
  "ghana union movement": "gum",
  "liberal party of ghana": "lpg",
  "progressive people's party": "ppp",
  "progressive peoples party": "ppp",
  "united party": "up",
  "the new force": "new-force",
  "the base movement": "base",
  "base movement": "base",
  "ghana freedom party": "gfp",
  "ghana union movement": "gum",
  "eye kubɛ": "eyekube",
  "eye kube": "eyekube",
  "ghana union movement": "gum",
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

export default function PartyLogo({ party, alt, size = 48, className = "" }) {
  const src = getPartyLogo(party);
  if (!src) return null;

  return (
    <span className={`polisync-party-logo ${className}`.trim()} style={{ width: size, height: size }}>
      <img src={src} alt={alt || `${party} logo`} />
      <style jsx>{`
        .polisync-party-logo { display:inline-flex; align-items:center; justify-content:center; overflow:hidden; flex:0 0 auto; border-radius:12px; background:#fff; border:1px solid #e3e9e5; }
        .polisync-party-logo img { width:100%; height:100%; object-fit:contain; display:block; }
      `}</style>
    </span>
  );
}
