"use client";

import { useEffect, useMemo, useState } from "react";

const SECTIONS = [
  ["terms", "Terms & Conditions"],
  ["acceptable-use", "Acceptable Use"],
  ["privacy", "Privacy & Data"],
  ["elections", "Election Results"],
  ["ai", "AI Policy"],
  ["security", "Security"],
  ["copyright", "Copyright & IP"],
  ["disclaimer", "Disclaimers"],
];

const SECTION_TEXT = {
  terms: {
    title: "Terms & Conditions",
    text: "Use of PoliSync Africa is subject to applicable law, these public policies, role-based permissions and any additional terms presented for a specific service. Users must provide truthful information, protect their credentials and use the platform only for lawful purposes.",
  },
  "acceptable-use": {
    title: "Acceptable Use",
    text: "Users must not impersonate others, submit knowingly false election information, bypass security controls, misuse private data, deploy malicious code, harass users, conduct unlawful surveillance, or use PoliSync to facilitate fraud, threats, phishing or other unlawful conduct.",
  },
  privacy: {
    title: "Privacy & Data",
    text: "PoliSync collects and processes information needed for account security, authentication, organizational administration, communications, platform operations and other disclosed purposes. Location-aware features require user permission where required. Users should be provided appropriate privacy controls and legally required rights.",
  },
  elections: {
    title: "Election Results",
    text: "Election results may be submitted by authorized polling-station users and transmitted through organizational workflows. Results can be preliminary, pending, disputed or verified within PoliSync. Platform processing does not by itself constitute legal certification by an election authority.",
  },
  ai: {
    title: "AI Policy",
    text: "AI features are assistance tools. AI output may be inaccurate, incomplete or biased and must be independently reviewed before consequential use. AI output must not be presented as official electoral certification or fabricated evidence.",
  },
  security: {
    title: "Security",
    text: "Users must safeguard passwords, OTPs, recovery codes and sessions. PoliSync may require periodic re-verification and may record security-sensitive administrative actions for protection, auditing and incident response, subject to applicable law.",
  },
  copyright: {
    title: "Copyright & Intellectual Property",
    text: "Except where otherwise stated, PoliSync Africa software, original documentation, interface design, branding, logos and other original platform materials are protected by applicable intellectual-property laws. User-submitted content remains subject to the rights the user lawfully holds.",
  },
  disclaimer: {
    title: "Disclaimers",
    text: "PoliSync Africa is a technology and information platform. Data may originate from users, organizations, public sources, third parties or automated systems and may not always be independently verified. Weather, maps, AI output, election data and other third-party services can contain errors or outages.",
  },
};

export default function PoliciesPage() {
  const [active, setActive] = useState("terms");
  const section = useMemo(() => SECTION_TEXT[active], [active]);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
    if (hash && SECTION_TEXT[hash]) setActive(hash);
  }, []);

  return (
    <main className="page">
      <div className="shell">
        <header className="header">
          <div>
            <div className="eyebrow">POLISYNC AFRICA • TECHNOLOGY • POWER • ELECTIONS</div>
            <h1>Public Policies & Legal Notices</h1>
            <p>Version 1.0 • Effective 31 August 2026</p>
          </div>
          <a href="/" className="home">Back to PoliSync</a>
        </header>

        <div className="layout">
          <nav className="nav" aria-label="Policy sections">
            {SECTIONS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={active === key ? "active" : ""}
                onClick={() => {
                  setActive(key);
                  if (typeof window !== "undefined") window.history.replaceState({}, "", `/policies#${key}`);
                }}
              >
                {label}
              </button>
            ))}
          </nav>

          <article className="content">
            <h2>{section.title}</h2>
            <p>{section.text}</p>

            <div className="notice">
              <strong>Legal review notice</strong>
              <span>
                This public policy framework is not legal advice and should be reviewed by qualified counsel for the jurisdictions in which PoliSync Africa operates before being adopted as the final contractual terms.
              </span>
            </div>

            <section className="copyright">
              <h3>© 2026 PoliSync Africa</h3>
              <p>All rights reserved, subject to applicable law, third-party rights, open-source licenses and authorized uses.</p>
            </section>
          </article>
        </div>
      </div>

      <style jsx>{`
        .page{min-height:100vh;background:#f4f8f5;padding:24px;box-sizing:border-box;color:#24322a}.shell{max-width:1120px;margin:0 auto}.header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:18px}.eyebrow{color:#c9a227;font-size:10px;font-weight:900;letter-spacing:1.4px}.header h1{margin:6px 0 5px;color:#075f2b;font-size:32px}.header p{margin:0;color:#77847c;font-size:11px}.home{padding:10px 12px;border-radius:10px;text-decoration:none;background:#075f2b;color:#fff;font-size:11px;font-weight:800}.layout{display:grid;grid-template-columns:240px minmax(0,1fr);gap:14px}.nav,.content{background:#fff;border:1px solid #dce6df;border-radius:16px}.nav{padding:10px;height:max-content}.nav button{display:block;width:100%;border:0;background:transparent;text-align:left;padding:11px 12px;border-radius:10px;color:#445149;font-size:11px;font-weight:800;cursor:pointer}.nav button:hover,.nav button.active{background:#edf7f0;color:#075f2b}.content{padding:24px}.content h2{margin:0;color:#075f2b;font-size:25px}.content>p{color:#536159;line-height:1.75;font-size:13px}.notice{display:grid;gap:5px;margin-top:22px;padding:15px;border:1px solid rgba(201,162,39,.5);border-radius:12px;background:#fffaf0}.notice strong{color:#8d6f09;font-size:11px}.notice span{color:#675d3b;font-size:11px;line-height:1.6}.copyright{margin-top:16px;padding-top:16px;border-top:1px solid #edf1ee}.copyright h3{margin:0 0 5px;color:#075f2b;font-size:14px}.copyright p{margin:0;color:#77847c;font-size:10px}@media(max-width:720px){.page{padding:12px}.header{display:block}.home{display:inline-block;margin-top:10px}.layout{grid-template-columns:1fr}.nav{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.content{padding:18px}.header h1{font-size:26px}}
      `}</style>
    </main>
  );
}
