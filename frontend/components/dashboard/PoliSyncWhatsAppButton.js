"use client";

const WHATSAPP_URL = "https://wa.me/233540992581?text=Hello%20PoliSync%20Africa%2C%20I%20need%20assistance.";

export default function PoliSyncWhatsAppButton() {
  return (
    <a className="polisync-whatsapp" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="Contact PoliSync Africa on WhatsApp" title="Contact PoliSync Africa on WhatsApp">
      <span aria-hidden="true">◉</span>
      <span className="label">WhatsApp PoliSync</span>
      <style jsx>{`
        .polisync-whatsapp{position:fixed;right:18px;bottom:18px;z-index:1500;display:flex;align-items:center;gap:8px;padding:10px 13px;border-radius:999px;background:#075f2b;color:#fff;text-decoration:none;font-size:10px;font-weight:900;box-shadow:0 8px 24px rgba(0,0,0,.18);border:1px solid #c9a227;transition:transform .15s ease,box-shadow .15s ease}.polisync-whatsapp:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(0,0,0,.22)}.polisync-whatsapp span:first-child{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#fff;color:#075f2b;font-size:12px}.label{white-space:nowrap}@media(max-width:520px){.polisync-whatsapp{right:12px;bottom:12px;width:48px;height:48px;padding:0;justify-content:center}.label{display:none}.polisync-whatsapp span:first-child{width:30px;height:30px}}
      `}</style>
    </a>
  );
}
