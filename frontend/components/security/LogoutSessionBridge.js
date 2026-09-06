"use client";

import { useEffect } from "react";

const getStoredToken = () => {
  if (typeof window === "undefined") return "";
  for (const key of ["polisync_token", "authToken", "accessToken", "token"]) {
    const token = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (token) return token;
  }
  return "";
};

export default function LogoutSessionBridge() {
  useEffect(() => {
    const revoke = () => {
      const token = getStoredToken();
      if (!token) return;

      fetch("/api/auth/logout", {
        method: "POST",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        keepalive: true,
        credentials: "same-origin",
      }).catch(() => {});
    };

    const onClick = (event) => {
      const target = event.target?.closest?.(".dashboard-logout, .dashboard-profile-menu-item");
      if (!target || !/sign\s*out/i.test(target.textContent || "")) return;
      revoke();
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
