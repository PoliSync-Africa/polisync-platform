"use client";

const cards = [
  {
    title: "Polling Stations",
    value: "0",
    icon: "🗳️",
    color: "#0A2540",
  },
  {
    title: "Field Agents",
    value: "0 Online",
    icon: "👥",
    color: "#0A7F5A",
  },
  {
    title: "Reporting",
    value: "0%",
    icon: "📊",
    color: "#D97706",
  },
  {
    title: "Incidents",
    value: "0 Active",
    icon: "🚨",
    color: "#B91C1C",
  },
];

export default function ConstituencyPanel({
  constituency = "Select a Constituency",
}) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "900px",
        background: "#ffffff",
        borderRadius: "20px",
        padding: "24px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
      }}
    >
      <h2 style={{ color: "#1B365D" }}>
        📍 {constituency}
      </h2>

      <p style={{ color: "#666", marginBottom: "24px" }}>
        Constituency Election Operations Dashboard
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {cards.map((card) => (
          <div
            key={card.title}
            style={{
              background: card.color,
              color: "white",
              borderRadius: "16px",
              padding: "18px",
            }}
          >
            <div style={{ fontSize: "28px" }}>{card.icon}</div>
            <h3 style={{ marginTop: "12px" }}>{card.title}</h3>
            <h2>{card.value}</h2>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "#EEF6FF",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ color: "#0A2540" }}>Weather Status</h3>
        <p>Weather Intelligence will appear here.</p>
      </div>

      <button
        style={{
          width: "100%",
          padding: "18px",
          borderRadius: "14px",
          background: "#0A2540",
          color: "white",
          border: "none",
          fontSize: "16px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        📄 Submit Pink Sheet
      </button>
    </div>
  );
}
