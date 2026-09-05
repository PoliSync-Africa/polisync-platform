"use client";

export default function ElectionCard({
  title,
  country,
  date,
  progress,
  status
}) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 20,
        padding: 24,
        boxShadow: "0 8px 20px rgba(0,0,0,.06)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ margin: 0, color: "#0B3D2E" }}>{title}</h3>
          <p style={{ color: "#6B7280" }}>{country}</p>
        </div>

        <span
          style={{
            background: status === "Live" ? "#DCFCE7" : "#FEF3C7",
            color: "#0B3D2E",
            padding: "6px 12px",
            borderRadius: 20,
            fontSize: 13,
            fontWeight: "bold"
          }}
        >
          {status}
        </span>
      </div>

      <p style={{ marginTop: 20 }}>Election Date: {date}</p>

      <div
        style={{
          height: 8,
          background: "#E5E7EB",
          borderRadius: 10,
          overflow: "hidden"
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "#0B3D2E"
          }}
        />
      </div>

      <p style={{ marginTop: 10 }}>{progress}% Reporting</p>
    </div>
  );
}
