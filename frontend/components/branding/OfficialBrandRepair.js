"use client";

import { useEffect } from "react";

const LOGO_SRC = "/polisync-official-logo.svg";

export default function OfficialBrandRepair() {
  useEffect(() => {
    const apply = () => {
      document.querySelectorAll("img").forEach((img) => {
        const source = img.getAttribute("src") || "";
        if (source.includes("logo.png") || source.includes("polisync-brand.svg") || source.includes("IMG_9654.jpeg")) {
          img.setAttribute("src", LOGO_SRC);
          img.removeAttribute("srcset");
        }
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
        width: min(100%, 240px);
        height: auto;
        max-width: 240px;
        max-height: 136px;
        object-fit: contain;
        object-position: center;
        image-rendering: auto;
        filter: contrast(1.06) saturate(1.03);
        margin: 0 auto 8px;
      }

      .polisync-auth-motto {
        display: none !important;
      }

      @media (max-width: 600px) {
        .polisync-official-auth-logo {
          width: min(100%, 210px);
          max-width: 210px;
          max-height: 120px;
          margin-bottom: 7px;
        }
      }
    `}</style>
  );
}
