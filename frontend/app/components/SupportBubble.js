
"use client";

export default function SupportBubble() {
  return (
    <button type="button" aria-label="Open PoliSync support" className="support-bubble">
      💬
      <style jsx>{`.support-bubble{position:fixed;right:clamp(12px,3vw,25px);bottom:clamp(12px,3vw,25px);z-index:1150;width:clamp(52px,14vw,65px);height:clamp(52px,14vw,65px);max-width:65px;max-height:65px;border:0;border-radius:50%;background:#d4af37;color:#082c24;font-size:clamp(22px,6vw,28px);cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.25)}@media(max-width:430px){.support-bubble{right:12px;bottom:12px}}`}</style>
    </button>
  );
}
