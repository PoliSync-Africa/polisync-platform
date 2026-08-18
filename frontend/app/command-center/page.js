"use client";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import SupportBubble from "../components/SupportBubble";
import AfricaMap from "../components/AfricaMap";
import GhanaMap from "../components/GhanaMap";
import LiveFeed from "../components/LiveFeed";
import AlertPanel from "../components/AlertPanel";

export default function CommandCenter() {
  return (
    <div style={{ display: "flex", background: "#EEF2F7" }}>
      <Sidebar />

      <div style={{ flex: 1 }}>
        <Topbar />

        <div style={{ padding: 30 }}>
          <h1 style={{ color: "#0B3D2E" }}>
            Election Night Command Center
          </h1>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 20,
              marginTop: 30
            }}
          >
            <StatCard title="Reporting" value="92%" />
            <StatCard title="Polling Stations" value="24,731" />
            <StatCard title="Countries" value="5" />
            <StatCard title="Live Alerts" value="3" />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: 24,
              marginTop: 30
            }}
          >
            <AfricaMap />
            <GhanaMap />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr",
              gap: 24,
              marginTop: 30
            }}
          >
            <LiveFeed />
            <AlertPanel />
          </div>
        </div>

        <SupportBubble />
      </div>
    </div>
  );
}
