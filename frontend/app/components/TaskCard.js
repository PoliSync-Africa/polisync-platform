"use client";

export default function TaskCard({
  title,
  assignedTo,
  status
}) {
  const color =
    status === "Completed" ? "#16A34A" : "#F59E0B";

  return (
    <div
      style={{
        background: "white",
        borderRadius: 18,
        padding: 20
      }}
    >
      <h3>{title}</h3>

      <p>Assigned: {assignedTo}</p>

      <span
        style={{
          background: color,
          color: "white",
          padding: "6px 12px",
          borderRadius: 20
        }}
      >
        {status}
      </span>
    </div>
  );
}
