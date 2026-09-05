"use client";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import LiveCounter from "../components/LiveCounter";
import PollingStationCard from "../components/PollingStationCard";
import SupportBubble from "../components/SupportBubble";

export default function ElectionOSPage() {
  return (
    <div className="electionos-page" style={{ display: "flex", width: "100%", minWidth: 0, background: "#EEF2F7" }}>
      <Sidebar />

      <div style={{ flex: 1, minWidth: 0, width: 0, maxWidth: "100%" }}>
        <Topbar />

        <main className="electionos-content">
          <h1 style={{ color: "#0B3D2E", overflowWrap: "anywhere" }}>ElectionOS Pro</h1>
          <p>Central command for election operations.</p>

          <div style={{ marginTop: 30, maxWidth: "100%" }}>
            <LiveCounter />
          </div>

          <h2 style={{ marginTop: 40 }}>Polling Stations</h2>

          <div className="electionos-stations" style={{ marginTop: 20 }}>
            <PollingStationCard station="Techiman SHS A" code="BE-TEC-001" constituency="Techiman South" status="Ready" />
            <PollingStationCard station="Methodist Primary" code="BE-TEC-002" constituency="Techiman South" status="Pending" />
            <PollingStationCard station="Kintampo Central" code="BE-KIN-001" constituency="Kintampo North" status="Offline" />
          </div>
        </main>

        <SupportBubble />
      </div>
    </div>
  );
}
