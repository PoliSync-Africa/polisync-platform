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

const styleId = "polisync-whatsapp-messages-style";
const css = `
.whatsapp-messages-panel .list{margin-top:20px;padding:0;border:0;background:#efeae2;border-radius:16px;overflow:hidden;box-shadow:inset 0 0 0 1px #e1ddd5}
.whatsapp-messages-panel .list h3{margin:0;padding:13px 16px;background:#075f2b;color:#fff;font-size:12px;letter-spacing:.4px}
.whatsapp-messages-panel .list>p{margin:0;padding:28px 16px;background:#efeae2;color:#7c817d;text-align:center}
.whatsapp-messages-panel .whatsapp-message-row{position:relative;display:block;width:fit-content;max-width:min(78%,560px);margin:8px 12px;padding:9px 11px 7px;border:0;border-radius:10px;background:#fff;box-shadow:0 1px 1px rgba(0,0,0,.08);clear:both}
.whatsapp-messages-panel .whatsapp-incoming{float:left;margin-right:auto;border-top-left-radius:3px}
.whatsapp-messages-panel .whatsapp-outgoing{float:right;margin-left:auto;background:#dcf8c6;border-top-right-radius:3px}
.whatsapp-messages-panel .whatsapp-message-row>b{display:block;margin:0 0 3px;color:#075f2b;font-size:10px}
.whatsapp-messages-panel .whatsapp-outgoing>b{color:#52734a}
.whatsapp-messages-panel .whatsapp-message-row>small{float:none!important;display:block;margin:0 0 4px;color:#8a928d;font-size:8px}
.whatsapp-messages-panel .whatsapp-message-row>p{margin:0;color:#27352d;font-size:12px;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere}
.whatsapp-messages-panel .whatsapp-message-row>.attachments{display:block;margin:6px 0 2px}
.whatsapp-messages-panel .whatsapp-message-row .fileCard{display:flex;width:auto;max-width:100%;padding:7px;background:rgba(255,255,255,.65);border:1px solid rgba(100,120,105,.15);border-radius:8px;color:#075f2b;text-decoration:none}
.whatsapp-messages-panel .whatsapp-photo{display:block;width:min(300px,100%);max-height:360px;object-fit:cover;border-radius:8px;cursor:pointer;margin-top:6px}
.whatsapp-messages-panel .whatsapp-message-row>button{margin-top:5px;padding:4px 0;border:0;background:transparent;color:#075f2b;font-size:9px;font-weight:700}
.whatsapp-messages-panel .list h3:nth-of-type(2){clear:both;margin-top:8px}
.whatsapp-messages-panel .list::after{content:"";display:block;clear:both}
@media(max-width:600px){
 .whatsapp-messages-panel{padding:12px}
 .whatsapp-messages-panel .list{margin-left:-1px;margin-right:-1px;border-radius:14px}
 .whatsapp-messages-panel .whatsapp-message-row{max-width:84%;margin:6px 8px;padding:8px 9px}
 .whatsapp-messages-panel .whatsapp-photo{width:min(260px,78vw);max-height:300px}
}
`;

function installStyle() {
  if (document.getElementById(styleId)) return;
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = css;
  document.head.appendChild(style);
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
    img.alt = "Photo attachment";
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
  installStyle();
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
