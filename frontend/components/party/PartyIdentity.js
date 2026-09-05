"use client";

import PartyLogo from "./PartyLogo";

export default function PartyIdentity({ party, name, logoWidth = 58, logoHeight = 40, className = "" }) {
  const label = name || party || "Political Party";

  return (
    <span className={`polisync-party-identity ${className}`.trim()}>
      <span className="polisync-party-identity-logo" style={{ width: logoWidth, height: logoHeight }}>
        <PartyLogo party={party} alt={`${label} logo`} size={logoHeight} />
      </span>
      <strong>{label}</strong>
      <style jsx>{`
        .polisync-party-identity {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          vertical-align: middle;
        }
        .polisync-party-identity-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          overflow: hidden;
          border: 1px solid rgba(214,173,53,.55);
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 3px 10px rgba(0,0,0,.12);
        }
        .polisync-party-identity-logo :global(.polisync-party-logo) {
          width: 100% !important;
          height: 100% !important;
          border: 0 !important;
          border-radius: 7px !important;
        }
        .polisync-party-identity strong {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: inherit;
          font-size: 13px;
          font-weight: 850;
        }
      `}</style>
    </span>
  );
}
