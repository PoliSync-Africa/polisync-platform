"use client";

import GhanaMap from "../../components/GhanaMap";

const cards = [
  { title: "Polling Stations", value: "40,975+", icon: "🗳️", color: "#0A2540" },
  { title: "Field Agents", value: "Live", icon: "👥", color: "#0A7F5A" },
  { title: "Incidents", value: "0 Active", icon: "🚨", color: "#B91C1C" },
  { title: "Weather Alerts", value: "Nationwide", icon: "🌤️", color: "#1D4ED8" },
];

export default function WarRoom() {
  return (
    <main className="war-room-page" style={{ minHeight: "100vh", background: "#07111F", color: "white", padding: "24px" }}>
      <h1 style={{ fontSize: "clamp(28px, 4vw, 32px)", marginBottom: "8px" }}>
        Election Command Center
      </h1>

      <p style={{ color: "#BFD7EA", marginBottom: "24px" }}>
        Real-time political intelligence across Ghana.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(180px,100%),1fr))", gap: "16px", marginBottom: "24px" }}>
        {cards.map((card) => (
          <div key={card.title} style={{ background: card.color, borderRadius: "16px", padding: "20px", minWidth: 0 }}>
            <div style={{ fontSize: "28px" }}>{card.icon}</div>
            <h3 style={{ marginTop: "12px", overflowWrap: "anywhere" }}>{card.title}</h3>
            <h2 style={{ overflowWrap: "anywhere" }}>{card.value}</h2>
          </div>
        ))}
      </div>

      <div className="war-room-layout">
        <GhanaMap />

        <div style={{ background: "#0F1E33", borderRadius: "20px", padding: "20px", minWidth: 0 }}>
          <h3>Live Intelligence Feed</h3>
          <div style={{ marginTop: "18px" }}>
            <p>🟢 System online</p>
            <p>🌤 Weather monitoring active</p>
            <p>🗺 Region selection enabled</p>
            <p>📊 Waiting for election data</p>
          </div>
        </div>
      </div>
    </main>
  );
}
