"use client";

const POLISYNC_LOGO_SRC =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aGB0dICwkHh0rIB0eJDUqLS8vLzA1NjY3PDk8Pj8BCgoKDgwOGw8PGT...";

export default function PoliSyncBrand({ compact = false }) {
  return (
    <div className={`polisync-brand ${compact ? "polisync-brand-compact" : ""}`}>
      <img
        src={POLISYNC_LOGO_SRC}
        alt="PoliSync Africa — Africa's Political Intelligence Platform"
        className="polisync-brand-image"
      />
      {!compact && (
        <div className="polisync-brand-accessible-text">
          <strong>PoliSync Africa</strong>
          <span>AFRICA'S POLITICAL INTELLIGENCE PLATFORM</span>
        </div>
      )}

      <style jsx>{`
        .polisync-brand {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          overflow: hidden;
        }

        .polisync-brand-image {
          display: block;
          width: 100%;
          max-width: 238px;
          height: auto;
          object-fit: contain;
        }

        .polisync-brand-accessible-text {
          display: none;
        }

        .polisync-brand-compact .polisync-brand-image {
          max-width: 150px;
        }
      `}</style>
    </div>
  );
}
