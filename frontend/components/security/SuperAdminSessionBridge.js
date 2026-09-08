"use client";

import { useEffect } from "react";

export default function SuperAdminSessionBridge() {
  useEffect(() => {
    try {
      const sessionToken = sessionStorage.getItem("polisync_token");
      if (!sessionToken || localStorage.getItem("polisync_token")) return;

      const rawUser = sessionStorage.getItem("polisync_user");
      const user = rawUser ? JSON.parse(rawUser) : null;
      if (user?.platformRole !== "super_admin") return;

      // The Super Admin dashboard's legacy data loader reads the token from
      // localStorage. Keep the session-only login secure for ordinary users,
      // while making the Super Admin workspace compatible with that loader.
      localStorage.setItem("polisync_token", sessionToken);
      if (rawUser) localStorage.setItem("polisync_user", rawUser);
    } catch (error) {
      console.warn("PoliSync Super Admin session bridge failed:", error);
    }
  }, []);

  return null;
}
