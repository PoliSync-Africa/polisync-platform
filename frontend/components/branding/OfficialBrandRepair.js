"use client";

import { useEffect } from "react";

const LOGO_SRC = "/polisync-official-logo.svg";

export default function OfficialBrandRepair() {
  useEffect(() => {
    const apply = () => {
      document.querySelectorAll("img").forEach((img) => {
        const source = img.getAttribute("src") || "";
        if (source.includes("logo.png") || source.includes("polisync-brand.svg")) {
          img.setAttribute("src", LOGO_SRC);
          img.removeAttribute("srcset");
        }
      });

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
        node.dataset.polisyncOfficialBrand = "true";
        next.classList.add("polisync-auth-motto");
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
        width: min(100%, 300px);
        height: auto;
        max-width: 300px;
        max-height: 169px;
        object-fit: contain;
        object-position: center;
        image-rendering: auto;
        filter: contrast(1.06) saturate(1.03);
        margin: 0 auto 8px;
      }

      .polisync-auth-motto {
        display: block !important;
        width: 100%;
        box-sizing: border-box;
        margin: 2px 0 18px !important;
        padding: 0 8px;
        color: #b48712 !important;
        font-size: 13px !important;
        line-height: 1.35 !important;
        font-weight: 800 !important;
        letter-spacing: .20em !important;
        text-align: center !important;
        text-rendering: geometricPrecision;
        -webkit-font-smoothing: antialiased;
      }

      @media (max-width: 600px) {
        .polisync-official-auth-logo {
          width: min(100%, 300px);
          max-width: 300px;
          max-height: 169px;
          margin-bottom: 7px;
        }

        .polisync-auth-motto {
          font-size: 12px !important;
          letter-spacing: .16em !important;
          margin-bottom: 16px !important;
        }
      }
    `}</style>
  );
}
