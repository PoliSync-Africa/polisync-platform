"use client";

import { useEffect } from "react";
import UserDashboardLanding from "../../components/dashboard/UserDashboardLanding";

export default function Dashboard() {
  useEffect(() => {
    const api = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
    const token = localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || "";
    if (!api || !token) return;

    fetch(`${api}/api/personal-workspace/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data?.success && data?.data?.purpose) window.location.replace("/personal");
      })
      .catch(() => {});
  }, []);

  return (
    <UserDashboardLanding
      role="user"
      title="Dashboard"
      activeSection="overview"
    />
  );
}
