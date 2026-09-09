"use client";

import { useEffect } from "react";

const LOGO_SRC = "/polisync-official-logo.svg";

export default function OfficialBrandRepair() {
  useEffect(() => {
    const apply = () => {
      const candidates = Array.from(document.querySelectorAll("body *"));
      candidates.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.dataset.polisyncOfficialBrand === "true") return;
        if (node.children.length > 0) return;
        if (node.textContent?.trim() !== "POLISYNC AFRICA") return;

        const next = node.nextElementSibling;
        if (!(next instanceof HTMLElement)) return;
        if (next.textContent?.trim() !== "POLITICAL OPERATING SYSTEM") return;

        const img = document.createElement("img");
        img.src = LOGO_SRC;
        img.alt = "PoliSync Africa — Africa's Political Intelligence Platform";
        img.className = "polisync-official-auth-logo";
        img.decoding = "async";
        img.loading = "eager";

        node.replaceWith(img);
        next.remove();
        img.dataset.polisyncOfficialBrand = "true";
      });
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <style jsx global>{`
      .polisync-official-auth-logo {
        display: block;
        width: min(100%, 420px);
        height: auto;
        max-height: 180px;
        object-fit: contain;
        object-position: center;
        margin: 0 auto 18px;
      }

      @media (max-width: 600px) {
        .polisync-official-auth-logo {
          width: min(100%, 340px);
          max-height: 145px;
          margin-bottom: 16px;
        }
      }
    `}</style>
  );
}
