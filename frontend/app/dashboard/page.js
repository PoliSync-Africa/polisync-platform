"use client";

import { useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import SupportBubble from "../components/SupportBubble";

export default function Dashboard() {
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

  return <div style={{ display: "flex", background: "#F3F5F7" }}><Sidebar /><div style={{ flex: 1 }}><Topbar /><div style={{ padding: 30 }}><h1 style={{ color: "#0B3D2E" }}>Welcome to POLISYNC AFRICA</h1><p>Africa's Political Operating System</p><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20, marginTop: 30 }}><StatCard title="Active Elections" value="4" /><StatCard title="Countries" value="5" /><StatCard title="Users" value="18,420" /><StatCard title="Results Submitted" value="24,731" /></div><div style={{ background: "white", borderRadius: 24, padding: 30, marginTop: 35 }}><h2>Live Africa Operations</h2><div style={{ height: 320, borderRadius: 18, background: "linear-gradient(135deg,#0B3D2E,#155E4A)", display: "flex", justifyContent: "center", alignItems: "center", color: "#D4AF37", fontSize: 30, fontWeight: "bold" }}>🌍 Interactive Africa Map</div></div><div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginTop: 30 }}><div style={{ background: "white", borderRadius: 20, padding: 24 }}><h3>Recent Activity</h3><ul style={{ lineHeight: 2 }}><li>Election operations are available.</li><li>Electoral geography is connected to the platform.</li><li>Public workspaces are role-aware.</li></ul></div><div style={{ background: "white", borderRadius: 20, padding: 24 }}><h3>Support Center</h3><p>Need assistance?</p><button style={{ background: "#0B3D2E", color: "white", border: "none", padding: "12px 20px", borderRadius: 12 }}>Open Live Chat</button></div></div></div><SupportBubble /></div></div>;
}
