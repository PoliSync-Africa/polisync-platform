"use client";

import { useEffect, useState } from "react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://polisync-platform-1.onrender.com").replace(/\/+$/, "");
const MAX_FILE = 8 * 1024 * 1024;

function authHeaders() {
  if (typeof window === "undefined") return { Accept: "application/json" };
  const token = ["polisync_token", "authToken", "accessToken", "token"].map((key) => localStorage.getItem(key) || sessionStorage.getItem(key)).find(Boolean) || "";
  return { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function resizeLogo(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("Choose a logo image."));
    if (!file.type.startsWith("image/")) return reject(new Error("Logo must be an image."));
    if (file.size > MAX_FILE) return reject(new Error("Logo file must be 8 MB or smaller."));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read logo."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Unable to process logo image."));
      image.onload = () => {
        const width = 600;
        const height = 240;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
        const drawWidth = Math.max(1, Math.round(image.naturalWidth * scale));
        const drawHeight = Math.max(1, Math.round(image.naturalHeight * scale));
        const x = Math.round((width - drawWidth) / 2);
        const y = Math.round((height - drawHeight) / 2);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(image, x, y, drawWidth, drawHeight);
        resolve(canvas.toDataURL("image/png"));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function OrganizationLogoManagerInjector() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (typeof window === "undefined" || !window.location.pathname.startsWith("/super-admin/organizations")) return undefined;
    const load = async () => {
      try {
        const response = await fetch(`${API_URL}/api/organizations/admin/all`, { headers: authHeaders(), cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) throw new Error(data.message || `Unable to load organizations (${response.status}).`);
        setItems(Array.isArray(data.organizations) ? data.organizations : []);
      } catch (e) { setError(e.message || "Unable to load organizations."); }
    };
    load();
    return undefined;
  }, [open]);

  if (typeof window === "undefined" || !window.location.pathname.startsWith("/super-admin/organizations")) return null;

  const update = async (organization, file) => {
    if (!file) return;
    setBusy(String(organization._id)); setError(""); setNotice("");
    try {
      const logo = await resizeLogo(file);
      const response = await fetch(`${API_URL}/api/organizations/admin/${organization._id}/logo`, { method: "PATCH", headers: { ...authHeaders(), "Content-Type": "application/json" }, body: JSON.stringify({ logo }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || `Unable to update ${organization.name} logo.`);
      setItems((current) => current.map((item) => String(item._id) === String(organization._id) ? { ...item, logo } : item));
      setNotice(`${organization.name} logo saved in a 600 × 240 rectangular format.${data.electionSync?.updatedElections ? ` Synchronized to ${data.electionSync.updatedElections} election${data.electionSync.updatedElections === 1 ? "" : "s"}.` : ""}`);
    } catch (e) { setError(e.message || "Logo update failed."); }
    finally { setBusy(""); }
  };

  return <>
    <button type="button" onClick={() => { setOpen(true); setError(""); setNotice(""); }} style={buttonStyle}>LOGO MANAGER</button>
    {open && <div style={backdropStyle} onClick={() => setOpen(false)}><section style={panelStyle} onClick={(e) => e.stopPropagation()}>
      <button type="button" onClick={() => setOpen(false)} style={closeStyle}>×</button>
      <div style={eyebrowStyle}>POLISYNC • BRAND ASSETS</div>
      <h3 style={titleStyle}>Political Parties & Organizations</h3>
      <p style={textStyle}>Upload a logo for any organization. PoliSync automatically resizes it to a consistent <strong>600 × 240</strong> rectangular canvas while preserving the logo proportions.</p>
      {notice && <div style={successStyle}>{notice}</div>}{error && <div style={errorStyle}>{error}</div>}
      <div style={gridStyle}>{items.map((item) => <article key={item._id} style={cardStyle}>
        <div style={logoBoxStyle}>{item.logo ? <img src={item.logo} alt={`${item.name} logo`} style={logoImageStyle} /> : <span style={placeholderStyle}>NO LOGO</span>}</div>
        <div style={{ minWidth: 0 }}><strong style={nameStyle}>{item.name}</strong><span style={metaStyle}>{item.organizationType}{item.politicalPartyName ? ` • ${item.politicalPartyName}` : ""}</span><label style={uploadStyle}>{busy === String(item._id) ? "Resizing & saving…" : item.logo ? "Replace logo" : "Add logo"}<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" disabled={busy !== ""} onChange={(e) => { update(item, e.target.files?.[0]); e.target.value = ""; }} style={{ display: "none" }} /></label></div>
      </article>)}</div>
    </section></div>}
  </>;
}

const buttonStyle = { position: "fixed", right: 18, bottom: 18, zIndex: 1500, border: 0, borderRadius: 10, padding: "10px 13px", background: "#075f2b", color: "#fff", fontSize: 9, fontWeight: 900, letterSpacing: .5, cursor: "pointer", boxShadow: "0 8px 22px rgba(0,0,0,.18)" };
const backdropStyle = { position: "fixed", inset: 0, zIndex: 3000, background: "rgba(0,35,19,.5)", padding: 16, display: "grid", placeItems: "center" };
const panelStyle = { position: "relative", width: "min(100%, 920px)", maxHeight: "90vh", overflow: "auto", boxSizing: "border-box", background: "#fff", borderRadius: 18, padding: "24px 20px", boxShadow: "0 25px 70px rgba(0,0,0,.28)" };
const closeStyle = { position: "absolute", right: 12, top: 8, border: 0, background: "transparent", fontSize: 28, color: "#075f2b", cursor: "pointer" };
const eyebrowStyle = { color: "#c9a227", fontSize: 9, fontWeight: 900, letterSpacing: 1.4 };
const titleStyle = { margin: "5px 0", color: "#075f2b", fontSize: 25 };
const textStyle = { margin: "0 0 16px", color: "#68766e", fontSize: 11, lineHeight: 1.5 };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 10 };
const cardStyle = { border: "1px solid #dce6df", borderRadius: 13, padding: 11, background: "#f9fbfa" };
const logoBoxStyle = { width: "100%", aspectRatio: "600 / 240", borderRadius: 9, background: "#fff", border: "1px solid #e3eae5", overflow: "hidden", display: "grid", placeItems: "center", marginBottom: 9 };
const logoImageStyle = { width: "100%", height: "100%", objectFit: "contain", display: "block" };
const placeholderStyle = { color: "#a1aaa5", fontSize: 9, fontWeight: 800 };
const nameStyle = { display: "block", color: "#26332b", fontSize: 12, overflowWrap: "anywhere" };
const metaStyle = { display: "block", color: "#8b968f", fontSize: 9, margin: "3px 0 8px" };
const uploadStyle = { display: "inline-block", borderRadius: 8, padding: "7px 10px", background: "#075f2b", color: "#fff", fontSize: 9, fontWeight: 800, cursor: "pointer" };
const successStyle = { margin: "8px 0", padding: 10, borderRadius: 9, background: "#edf8f0", color: "#075f2b", fontSize: 9 };
const errorStyle = { margin: "8px 0", padding: 10, borderRadius: 9, background: "#fff3f3", color: "#a00000", fontSize: 9 };
