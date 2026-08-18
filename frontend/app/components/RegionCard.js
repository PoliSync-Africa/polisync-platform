"use client";

export default function RegionCard({
  region,
  reporting,
  alerts
}) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 18,
        padding: 20
      }}
    >
      <h3>{region}</h3>

      <p>{reporting}% Reporting</p>

      <div
        style={{
          height: 8,
          background: "#E5E7EB",
          borderRadius: 8,
          overflow: "hidden"
        }}
      >
        <div
          style={{
            width: `${reporting}%`,
            height: "100%",
            background: "#0B3D2E"
          }}
        />
      </div>

      <p style={{ marginTop: 12 }}>🚨 {alerts} Active Alerts</p>
    </div>
  );
}
