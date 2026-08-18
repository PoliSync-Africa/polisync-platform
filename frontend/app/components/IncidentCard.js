"use client";

export default function IncidentCard({
  type,
  station,
  severity
}) {
  const colors = {
    Critical: "#DC2626",
    Medium: "#F59E0B",
    Low: "#2563EB"
  };

  return (
    <div
      style={{
        background: "white",
        borderLeft: `6px solid ${colors[severity]}`,
        borderRadius: 18,
        padding: 20
      }}
    >
      <h3>{type}</h3>

      <p>{station}</p>

      <strong>{severity}</strong>
    </div>
  );
}
