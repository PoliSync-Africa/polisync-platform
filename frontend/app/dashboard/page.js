"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import SupportBubble from "../components/SupportBubble";
import AIAnalyzer from "../../components/dashboard/AIAnalyzer";
import WeatherCard from "../../components/dashboard/WeatherCard";

export default function Dashboard() {
  const [search, setSearch] = useState("");

  useEffect(() => {
    const api = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
    const token = localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || "";
    if (!api || !token) return;
    fetch(`${api}/api/personal-workspace/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data?.data?.purpose) window.location.replace("/personal");
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ display: "flex", background: "#F3F5F7", minHeight: "100vh" }}>
      <Sidebar />

      <div style={{ flex: 1, minWidth: 0 }}>
        <Topbar />

        <div style={{ padding: "24px 30px 40px" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <h1 style={{ color: "#0B3D2E", margin: 0 }}>Welcome to POLISYNC AFRICA</h1>
            <p style={{ marginTop: 7, color: "#66736B" }}>Africa's Political Operating System</p>

            {/* Compact search, deliberately moved below the welcome heading. */}
            <div style={{ marginTop: 18, maxWidth: 520 }}>
              <label htmlFor="dashboard-search" style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#66736B", marginBottom: 6, letterSpacing: ".4px" }}>
                QUICK SEARCH
              </label>
              <div style={{ position: "relative" }}>
                <span aria-hidden="true" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#7A877F", fontSize: 15 }}>⌕</span>
                <input
                  id="dashboard-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search PoliSync..."
                  style={{ width: "100%", height: 40, boxSizing: "border-box", padding: "0 13px 0 34px", border: "1px solid #DCE6DF", borderRadius: 10, background: "#fff", color: "#1F2D25", outline: "none", fontSize: 13, boxShadow: "0 2px 8px rgba(16,59,34,.04)" }}
                />
              </div>
            </div>

            {/* Location + live temperature are now visible on the first page. */}
            <section style={{ marginTop: 18 }} aria-label="Current location and weather">
              <WeatherCard compact />
            </section>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 16, marginTop: 22 }}>
              <StatCard title="Active Elections" value="4" />
              <StatCard title="Countries" value="5" />
              <StatCard title="Users" value="18,420" />
              <StatCard title="Results Submitted" value="24,731" />
            </div>

            <div style={{ background: "white", borderRadius: 20, padding: 24, marginTop: 24 }}>
              <h2 style={{ marginTop: 0, color: "#0B3D2E" }}>Live Africa Operations</h2>
              <div style={{ height: 320, borderRadius: 16, background: "linear-gradient(135deg,#0B3D2E,#155E4A)", display: "flex", justifyContent: "center", alignItems: "center", color: "#D4AF37", fontSize: 30, fontWeight: "bold" }}>
                🌍 Interactive Africa Map
              </div>
            </div>

            <section style={{ marginTop: 22, padding: 20, borderRadius: 18, background: "#fff", border: "1px solid #c9a227" }}>
              <AIAnalyzer role="user" />
            </section>
          </div>
        </div>

        <SupportBubble />
      </div>
    </div>
  );
}
