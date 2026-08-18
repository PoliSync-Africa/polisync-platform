"use client";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import LiveCounter from "../components/LiveCounter";
import PollingStationCard from "../components/PollingStationCard";
import SupportBubble from "../components/SupportBubble";

export default function ElectionOSPage() {
  return (
    <div style={{ display: "flex", background: "#EEF2F7" }}>
      <Sidebar />

      <div style={{ flex: 1 }}>
        <Topbar />

        <div style={{ padding: 30 }}>
          <h1 style={{ color: "#0B3D2E" }}>
            ElectionOS Pro
          </h1>

          <p>Central command for election operations.</p>

          <div style={{ marginTop: 30 }}>
            <LiveCounter />
          </div>

          <h2 style={{ marginTop: 40 }}>Polling Stations</h2>

          <div
            style={{
              display: "grid",
              gap: 20,
              gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
              marginTop: 20
            }}
          >
            <PollingStationCard
              station="Techiman SHS A"
              code="BE-TEC-001"
              constituency="Techiman South"
              status="Ready"
            />

            <PollingStationCard
              station="Methodist Primary"
              code="BE-TEC-002"
              constituency="Techiman South"
              status="Pending"
            />

            <PollingStationCard
              station="Kintampo Central"
              code="BE-KIN-001"
              constituency="Kintampo North"
              status="Offline"
            />
          </div>
        </div>

        <SupportBubble />
      </div>
    </div>
  );
}
