"use client";

import { useEffect } from "react";

export default function SuperAdminEntry() {
  useEffect(() => {
    const token = localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token");
    const rawUser = localStorage.getItem("polisync_user") || sessionStorage.getItem("polisync_user");

    if (!token) {
      window.location.replace("/login");
      return;
    }

    try {
      const user = rawUser ? JSON.parse(rawUser) : null;
      if (user && user.platformRole !== "super_admin") {
        window.location.replace("/dashboard");
        return;
      }
    } catch {
      // The backend remains the authority for token validity.
    }

    window.location.replace("/super-admin/dashboard");
  }, []);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f5f8f6", color: "#075f2b", fontFamily: "system-ui, sans-serif" }}>
      Opening Super Admin workspace…
    </main>
  );
}
