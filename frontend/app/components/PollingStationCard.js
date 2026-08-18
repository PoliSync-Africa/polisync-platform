"use client";

export default function PollingStationCard({
  station,
  code,
  constituency,
  status
}) {
  const colors = {
    Ready: "#16A34A",
    Pending: "#F59E0B",
    Offline: "#DC2626"
  };

  return (
    <div
      style={{
        background: "white",
        borderRadius: 20,
        padding: 22,
        border: "1px solid #E5E7EB"
      }}
    >
      <h3 style={{ color: "#0B3D2E", margin: 0 }}>{station}</h3>

      <p>{code}</p>

      <p>{constituency}</p>

      <span
        style={{
          background: colors[status],
          color: "white",
          padding: "6px 12px",
          borderRadius: 20,
          fontSize: 12
        }}
      >
        {status}
      </span>
    </div>
  );
}
