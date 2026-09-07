"use client";

const WHATSAPP_NUMBER = "0540992581";
const WHATSAPP_URL = "https://wa.me/233540992581?text=Hello%20PoliSync%20Africa%2C%20I%20need%20assistance.";

export default function PoliSyncWhatsAppButton() {
  return (
    <a
      className="polisync-whatsapp"
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Contact PoliSync Africa on WhatsApp at ${WHATSAPP_NUMBER}`}
      title={`WhatsApp PoliSync Africa — ${WHATSAPP_NUMBER}`}
    >
      <span className="whatsapp-icon" aria-hidden="true">
        <svg viewBox="0 0 32 32" role="img" focusable="false">
          <path d="M16 3.2A12.7 12.7 0 0 0 5 22.2L3.4 28.4l6.35-1.58A12.8 12.8 0 1 0 16 3.2Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M11.2 10.2c.35-.4.72-.42 1.08-.36l1.08 2.55c.12.3.08.57-.12.8l-.8.94c.85 1.7 2.18 3.03 3.88 3.88l.94-.8c.23-.2.5-.24.8-.12l2.55 1.08c.06.36.04.73-.36 1.08-.52.47-1.3.72-2.02.54-4.18-1.02-7.58-4.42-8.6-8.6-.18-.72.07-1.5.54-2.02Z" fill="currentColor" />
        </svg>
      </span>
      <span className="label"><strong>WhatsApp PoliSync</strong><small>{WHATSAPP_NUMBER}</small></span>
      <style jsx>{`
        .polisync-whatsapp{position:fixed;right:18px;bottom:18px;z-index:1500;display:flex;align-items:center;gap:9px;padding:10px 14px;border-radius:999px;background:#075f2b;color:#fff;text-decoration:none;font-size:10px;font-weight:900;box-shadow:0 8px 24px rgba(0,0,0,.18);border:1px solid #c9a227;transition:transform .15s ease,box-shadow .15s ease}
        .polisync-whatsapp:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(0,0,0,.22)}
        .polisync-whatsapp:focus-visible{outline:3px solid #c9a227;outline-offset:3px}
        .whatsapp-icon{width:27px;height:27px;display:grid;place-items:center;border-radius:50%;background:#fff;color:#075f2b;flex:0 0 auto}
        .whatsapp-icon svg{width:21px;height:21px;display:block}
        .label{display:flex;flex-direction:column;line-height:1.15;white-space:nowrap}
        .label strong{font-size:10px}
        .label small{margin-top:2px;font-size:9px;opacity:.82;letter-spacing:.35px}
        @media(max-width:520px){.polisync-whatsapp{right:12px;bottom:12px;width:50px;height:50px;padding:0;justify-content:center}.label{display:none}.whatsapp-icon{width:34px;height:34px}.whatsapp-icon svg{width:26px;height:26px}}
      `}</style>
    </a>
  );
}
