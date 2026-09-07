"use client";

import { useEffect } from "react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

function getToken() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("polisync_token") ||
    sessionStorage.getItem("polisync_token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("authToken") ||
    ""
  );
}

function storeUser(user) {
  if (typeof window === "undefined" || !user) return;
  const serialized = JSON.stringify(user);
  localStorage.setItem("polisync_user", serialized);
  sessionStorage.setItem("polisync_user", serialized);
}

export default function SuperAdminEntry() {
  useEffect(() => {
    let cancelled = false;

    const verifyAndOpen = async () => {
      const token = getToken();
      if (!token) {
        window.location.replace("/login");
        return;
      }

      // The backend is authoritative for platform privileges. Do not trust
      // a stale localStorage role, because an older cached user object may
      // incorrectly say "user" after the Super Admin identity is repaired.
      try {
        const response = await fetch(`${API_URL}/api/profile/me`, {
          cache: "no-store",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error(`Profile verification failed: ${response.status}`);

        const payload = await response.json();
        const user = payload?.user;

        if (cancelled) return;

        if (user?.platformRole === "super_admin") {
          storeUser(user);
          window.location.replace("/super-admin/dashboard");
          return;
        }

        window.location.replace("/dashboard");
      } catch {
        if (cancelled) return;

        // If the profile endpoint is temporarily unavailable, preserve the
        // previous local Super Admin cache only as a fallback. Never use a
        // cached ordinary-user role to deny access before the backend has a
        // chance to confirm the canonical platform identity.
        try {
          const rawUser = localStorage.getItem("polisync_user") || sessionStorage.getItem("polisync_user");
          const cachedUser = rawUser ? JSON.parse(rawUser) : null;
          if (cachedUser?.platformRole === "super_admin") {
            window.location.replace("/super-admin/dashboard");
            return;
          }
        } catch {
          // Fall through to the normal dashboard.
        }

        window.location.replace("/dashboard");
      }
    };

    verifyAndOpen();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f5f8f6",
        color: "#075f2b",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      Verifying Super Admin access…
    </main>
  );
}
