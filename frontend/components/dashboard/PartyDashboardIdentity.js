"use client";

import { useEffect, useState } from "react";
import PartyLogo from "../party/PartyLogo";

const API_BASE = String(process.env.NEXT_PUBLIC_API_URL || "https://polisync-platform-1.onrender.com").replace(/\/+$/, "");

function getToken() {
  if (typeof window === "undefined") return "";
  return ["polisync_token", "authToken", "accessToken", "token"]
    .map((key) => localStorage.getItem(key) || sessionStorage.getItem(key))
    .find(Boolean) || "";
}

function formatRole(role) {
  return String(role || "Party User")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function PartyDashboardIdentity() {
  const [state, setState] = useState({ loading: true, organization: null, membership: null, error: "" });

  useEffect(() => {
    let cancelled = false;
    const token = getToken();
    if (!token) {
      setState({ loading: false, organization: null, membership: null, error: "Authentication required." });
      return undefined;
    }

    fetch(`${API_BASE}/api/party-organizations/me/dashboard`, {
      cache: "no-store",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || body.success !== true) throw new Error(body.message || "Unable to load party identity.");
        return body;
      })
      .then((body) => {
        if (!cancelled) setState({ loading: false, organization: body.organization || null, membership: body.membership || null, error: "" });
      })
      .catch((error) => {
        if (!cancelled) setState({ loading: false, organization: null, membership: null, error: error.message || "Unable to load party identity." });
      });

    return () => { cancelled = true; };
  }, []);

  const organization = state.organization;
  const partyName = organization?.politicalPartyName || organization?.name || "Political Party";
  const role = formatRole(state.membership?.role || "party user");

  return (
    <section className="party-identity" aria-label="Political party identity">
      <div className="identity-logo">
        <PartyLogo party={partyName} alt={`${partyName} logo`} size={58} />
        {organization?.logo && <img className="organization-logo" src={organization.logo} alt={`${partyName} official logo`} onError={(event) => { event.currentTarget.style.display = "none"; }} />}
      </div>
      <div className="identity-copy">
        <span>POLITICAL PARTY</span>
        <strong>{state.loading ? "Loading party…" : partyName}</strong>
        <small>{state.loading ? "Loading role…" : role}{state.membership?.level ? ` · ${formatRole(state.membership.level)}` : ""}</small>
      </div>
      <div className="identity-status">● Organization Active</div>
      {state.error && <small className="identity-error">{state.error}</small>}
      <style jsx>{`
        .party-identity{position:relative;display:flex;align-items:center;gap:14px;margin:0 0 16px;padding:14px 16px;border:1px solid #d8e4dc;border-radius:16px;background:linear-gradient(120deg,#ffffff,#f7fbf8);box-shadow:0 7px 22px rgba(15,55,31,.055);min-width:0}
        .identity-logo{position:relative;width:64px;height:64px;flex:0 0 64px;display:grid;place-items:center;border:1px solid #d8e3dc;border-radius:12px;background:#fff;overflow:hidden}
        .identity-logo :global(.polisync-party-logo){border:0!important;border-radius:10px!important;width:58px!important;height:58px!important}
        .organization-logo{position:absolute;inset:3px;width:58px;height:58px;object-fit:contain;padding:3px;border-radius:9px;background:#fff}
        .identity-copy{min-width:0;display:flex;flex-direction:column;gap:3px}
        .identity-copy>span{color:#b48712;font-size:9px;font-weight:900;letter-spacing:1.4px}
        .identity-copy strong{color:#075f2b;font-size:19px;line-height:1.15;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .identity-copy small{color:#68786f;font-size:10px;font-weight:750}
        .identity-status{margin-left:auto;flex:0 0 auto;padding:7px 10px;border-radius:999px;background:#e8f5ed;color:#08713a;font-size:9px;font-weight:900;white-space:nowrap}
        .identity-error{position:absolute;right:14px;bottom:-17px;color:#a33a32;font-size:8px}
        @media(max-width:600px){.party-identity{gap:10px;padding:11px}.identity-logo{width:52px;height:52px;flex-basis:52px}.identity-logo :global(.polisync-party-logo){width:46px!important;height:46px!important}.organization-logo{inset:3px;width:46px;height:46px}.identity-copy strong{font-size:15px}.identity-status{display:none}}
      `}</style>
    </section>
  );
}
