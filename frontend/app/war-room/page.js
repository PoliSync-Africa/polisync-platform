"use client";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import GhanaInteractiveMap from "../components/GhanaInteractiveMap";
import RegionCard from "../components/RegionCard";
import ConstituencyPanel from "../components/ConstituencyPanel";
import NetworkStatus from "../components/NetworkStatus";
import WeatherWidget from "../components/WeatherWidget";
import ReportingTicker from "../components/ReportingTicker";
import SupportBubble from "../components/SupportBubble";

export default function WarRoomPage() {
  return (
    <div style={{ display: "flex", background: "#EEF2F7" }}>
      <Sidebar />

      <div style={{ flex: 1 }}>
        <Topbar />

        <div style={{ padding: 30 }}>
          <h1 style={{ color: "#0B3D2E" }}>
            War Room 360
          </h1>

          <ReportingTicker />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: 24,
              marginTop: 24
            }}
          >
            <GhanaInteractiveMap />

            <div style={{ display: "grid", gap: 20 }}>
              <NetworkStatus />
              <WeatherWidget />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 20,
              marginTop: 24
            }}
          >
            <RegionCard region="Bono East" reporting={92} alerts={2} />
            <RegionCard region="Ashanti" reporting={89} alerts={5} />
            <RegionCard region="Greater Accra" reporting={95} alerts={1} />
            <RegionCard region="Northern" reporting={78} alerts={6} />
          </div>

          <div style={{ marginTop: 24 }}>
            <ConstituencyPanel />
          </div>
        </div>

        <SupportBubble />
      </div>
    </div>
  );
}
