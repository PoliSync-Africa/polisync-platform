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

      // Backend is the only authority for platform privileges. A cached
      // ordinary-user object must never redirect a Super Admin away from the
      // Super Admin workspace.
      try {
        const response = await fetch(`${API_URL}/api/profile/me`, {
          cache: "no-store",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (cancelled) return;

        if (response.status === 401) {
          window.location.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(`Profile verification failed: ${response.status}`);
        }

        const payload = await response.json();
        const user = payload?.user;

        if (user?.platformRole === "super_admin") {
          storeUser(user);
          window.location.replace("/super-admin/dashboard");
          return;
        }

        // A successful backend response that explicitly says this is an
        // ordinary user is authoritative. Temporary API failures, however,
        // must never cause a Super Admin to be downgraded to /dashboard.
        window.location.replace("/dashboard");
      } catch {
        if (cancelled) return;

        // Never use a cached "user" role to downgrade or redirect during a
        // temporary API/network failure. Retry the authoritative check instead.
        window.setTimeout(() => {
          if (!cancelled) verifyAndOpen();
        }, 1500);
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
