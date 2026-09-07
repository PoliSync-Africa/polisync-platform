"use client";

import { useEffect, useState } from "react";

const API_BASE = String(process.env.NEXT_PUBLIC_API_URL || "https://polisync-platform-1.onrender.com").replace(/\/+$/, "");

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || localStorage.getItem("authToken") || sessionStorage.getItem("authToken") || localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || localStorage.getItem("token") || sessionStorage.getItem("token") || "";
}

export async function fetchElectionAccess() {
  const token = getToken();
  if (!token) return { authenticated: false, allowed: false };
  const response = await fetch(`${API_BASE}/api/elections/access`, {
    cache: "no-store",
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success !== true) return { authenticated: response.status !== 401, allowed: false };
  return {
    authenticated: true,
    allowed: Boolean(data.isSuperAdmin || data.canViewOrganizationElections),
    isSuperAdmin: Boolean(data.isSuperAdmin),
    roles: Array.isArray(data.roles) ? data.roles : [],
  };
}

export default function ElectionAccessGate({ children }) {
  const [state, setState] = useState({ loading: true, allowed: false, authenticated: false });

  useEffect(() => {
    let active = true;
    fetchElectionAccess()
      .then((result) => {
        if (!active) return;
        setState({ loading: false, ...result });
        if (!result.allowed && typeof window !== "undefined") {
          window.location.replace(result.authenticated ? "/dashboard" : "/signin");
        }
      })
      .catch(() => {
        if (!active) return;
        setState({ loading: false, allowed: false, authenticated: false });
        if (typeof window !== "undefined") window.location.replace("/dashboard");
      });
    return () => { active = false; };
  }, []);

  if (state.loading || !state.allowed) {
    return <div style={{ minHeight: "50vh", display: "grid", placeItems: "center", padding: 24, color: "#66766d", fontSize: 12 }}>Checking election-duty access…</div>;
  }

  return children;
}
