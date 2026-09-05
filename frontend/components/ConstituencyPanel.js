"use client";

const cards = [
  {
    title: "Polling Stations",
    value: "0",
    icon: "📦",
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
        boxSizing: "border-box",
      }}
    >
      <h2
        style={{
          color: "#1B365D",
          marginTop: 0,
          marginBottom: "8px",
        }}
      >
        📍 {constituency}
      </h2>

      <p
        style={{
          color: "#666",
          marginBottom: "24px",
          fontSize: "16px",
        }}
      >
        Constituency Election Operations Dashboard
      </p>

      {/* Dashboard Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                marginBottom: "8px",
              }}
            >
              {card.icon}
            </div>

            <h3
              style={{
                margin: "8px 0",
                fontSize: "16px",
              }}
            >
              {card.title}
            </h3>

            <h2
              style={{
                margin: 0,
                fontSize: "24px",
              }}
            >
              {card.value}
            </h2>
          </div>
        ))}
      </div>

      {/* Weather Intelligence */}
      <div
        style={{
          background: "#EEF6FF",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <h3
          style={{
            color: "#0A2540",
            marginTop: 0,
          }}
        >
          🌦️ Weather Intelligence
        </h3>

        <p
          style={{
            color: "#555",
            marginBottom: 0,
          }}
        >
          Weather intelligence will appear here.
        </p>
      </div>

      {/* Submit Pink Sheet */}
      <a
        href="/pink-sheet"
        style={{
          display: "block",
          width: "100%",
          textDecoration: "none",
        }}
      >
        <div
          style={{
            width: "100%",
            padding: "18px",
            borderRadius: "14px",
            background: "#0A2540",
            color: "white",
            fontSize: "16px",
            fontWeight: "bold",
            textAlign: "center",
            cursor: "pointer",
            boxSizing: "border-box",
          }}
        >
          📄 Submit Pink Sheet
        </div>
      </a>
    </div>
  );
}
