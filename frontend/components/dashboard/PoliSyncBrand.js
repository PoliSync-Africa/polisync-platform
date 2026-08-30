"use client";

export default function PoliSyncBrand({ compact = false }) {
  return (
    <div className={`polisync-brand ${compact ? "polisync-brand-compact" : ""}`}>
      <img
        src="/polisync-brand.svg"
        alt="PoliSync Africa — Africa's Political Intelligence Platform"
        className="polisync-brand-image"
      />
      <span className="sr-only">
        PoliSync Africa — Africa's Political Intelligence Platform
      </span>

      <style jsx>{`
        .polisync-brand {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .polisync-brand-image {
          display: block;
          width: 100%;
          max-width: 238px;
          height: auto;
          object-fit: contain;
        }

        .polisync-brand-compact .polisync-brand-image {
          max-width: 135px;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </div>
  );
}
