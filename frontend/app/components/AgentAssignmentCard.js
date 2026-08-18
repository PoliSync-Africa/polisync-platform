"use client";

export default function AgentAssignmentCard({
  name,
  pollingStation,
  phone,
  attendance
}) {
  const color = attendance === "Checked In" ? "#16A34A" : "#F59E0B";

  return (
    <div
      style={{
        background: "white",
        borderRadius: 18,
        padding: 22
      }}
    >
      <h3>{name}</h3>

      <p>{pollingStation}</p>

      <p>{phone}</p>

      <span
        style={{
          background: color,
          color: "white",
          padding: "6px 12px",
          borderRadius: 20
        }}
      >
        {attendance}
      </span>
    </div>
  );
}
