"use client";

import { useEffect } from "react";

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|heic|heif|bmp|avif)(?:\?|#|$)/i;

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || localStorage.getItem("authToken") || sessionStorage.getItem("authToken") || localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || localStorage.getItem("token") || sessionStorage.getItem("token") || "";
}

function isMessagesPage() {
  return typeof window !== "undefined" && window.location.pathname === "/messages";
}

async function turnImageIntoPhoto(anchor) {
  if (!anchor || anchor.dataset.photoEnhanced === "1") return;
  const href = anchor.getAttribute("href") || "";
  const text = (anchor.textContent || "").trim();
  if (!IMAGE_EXTENSIONS.test(href) && !IMAGE_EXTENSIONS.test(text)) return;

  anchor.dataset.photoEnhanced = "1";
  try {
    const response = await fetch(href, { headers: { Authorization: `Bearer ${getToken()}` }, cache: "no-store" });
    if (!response.ok) throw new Error("Photo unavailable");
    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) throw new Error("Attachment is not an image");
    const url = URL.createObjectURL(blob);
    const img = document.createElement("img");
    img.src = url;
    img.alt = text.replace(/\s*\d+(?:\.\d+)?\s*(?:KB|MB)\s*$/i, "") || "Photo";
    img.loading = "lazy";
    img.className = "whatsapp-photo";
    img.addEventListener("click", () => window.open(url, "_blank", "noopener,noreferrer"));
    anchor.replaceWith(img);
  } catch {
    anchor.dataset.photoEnhanced = "0";
  }
}

function enhance(root) {
  if (!root || !isMessagesPage()) return;
  root.classList.add("whatsapp-messages-panel");

  root.querySelectorAll(".list article").forEach((article) => {
    const heading = article.previousElementSibling;
    const section = heading?.tagName === "H3" ? heading.textContent.trim().toLowerCase() : "";
    article.classList.toggle("whatsapp-incoming", section === "inbox");
    article.classList.toggle("whatsapp-outgoing", section === "sent");
    article.classList.add("whatsapp-message-row");
  });

  root.querySelectorAll(".list article .attachments a.fileCard").forEach(turnImageIntoPhoto);
}

export default function WhatsAppMessagesEnhancer() {
  useEffect(() => {
    if (!isMessagesPage()) return undefined;
    let observer;
    const run = () => {
      const panel = document.querySelector(".messages");
      if (!panel) return false;
      enhance(panel);
      observer = new MutationObserver(() => enhance(panel));
      observer.observe(panel, { childList: true, subtree: true });
      return true;
    };
    if (!run()) {
      const timer = window.setInterval(() => { if (run()) window.clearInterval(timer); }, 100);
      return () => window.clearInterval(timer);
    }
    return () => observer?.disconnect();
  }, []);

  return null;
}
