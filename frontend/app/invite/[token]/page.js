"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const getToken = () => typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || localStorage.getItem("token") || sessionStorage.getItem("token") || localStorage.getItem("authToken") || sessionStorage.getItem("authToken") || localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || "";

export default function InvitationPage() {
  const { token } = useParams();
  const router = useRouter();
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!token) return; fetch(`/api/party-organizations/deployments/invitations/public/${encodeURIComponent(token)}`).then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.message || "Invalid invitation."); setInvitation(d.invitation); }).catch((e) => setError(e.message)); }, [token]);
  async function accept() {
    const auth = getToken();
    if (!auth) { router.push(`/login?redirect=/invite/${encodeURIComponent(token)}`); return; }
    setBusy(true); setError("");
    try { const r = await fetch(`/api/party-organizations/deployments/invitations/public/${encodeURIComponent(token)}/accept`, { method: "POST", headers: { Accept: "application/json", Authorization: `Bearer ${auth}` } }); const d = await r.json(); if (!r.ok) throw new Error(d.message || "Unable to accept invitation."); setError(d.message); } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f6f8fb", color: "#152033" }}><section style={{ width: "min(560px,100%)", background: "white", borderRadius: 20, padding: 30, boxShadow: "0 12px 40px rgba(20,35,60,.09)" }}><div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, opacity: .55 }}>POLISYNC AFRICA</div><h1 style={{ marginBottom: 8 }}>Organization Invitation</h1>{error && <div style={{ padding: 12, borderRadius: 10, background: "#f4f7fb", marginBottom: 16 }}>{error}</div>}{invitation ? <><p>You have been invited to join <b>{invitation.organization?.politicalPartyName || invitation.organization?.name}</b>.</p><div style={{ padding: 16, borderRadius: 12, background: "#f4f7fb", lineHeight: 1.7 }}><div><b>Level:</b> {invitation.level.replaceAll("_", " ")}</div><div><b>Role:</b> {invitation.role.replaceAll("_", " ")}</div><div><b>Expires:</b> {new Date(invitation.expiresAt).toLocaleString()}</div></div><button disabled={busy} onClick={accept} style={{ width: "100%", marginTop: 20, border: 0, borderRadius: 10, padding: 13, fontWeight: 800, background: "#152033", color: "white" }}>{busy ? "Accepting…" : "Accept Invitation"}</button></> : !error && <p>Validating invitation…</p>}</section></main>;
}
