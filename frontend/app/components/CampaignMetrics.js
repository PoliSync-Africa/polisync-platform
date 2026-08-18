"use client";

export default function CampaignMetrics() {
  const metrics = [
    { title: "Members", value: "128,450" },
    { title: "Volunteers", value: "12,840" },
    { title: "Events", value: "248" },
    { title: "Polling Agents", value: "7,350" }
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
        gap: 18
      }}
    >
      {metrics.map((item) => (
        <div
          key={item.title}
          style={{
            background: "white",
            borderRadius: 18,
            padding: 22
          }}
        >
          <div style={{ color: "#6B7280" }}>{item.title}</div>
          <h2 style={{ color: "#0B3D2E" }}>{item.value}</h2>
        </div>
      ))}
    </div>
  );
}
