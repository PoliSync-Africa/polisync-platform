"use client";

export default function FraudAlertCard({
  title,
  level,
  message
}) {
  const color =
    level==="Critical" ? "#DC2626":
    level==="Warning" ? "#F59E0B":
    "#2563EB";

  return (
    <div
      style={{
        background:"white",
        borderLeft:`6px solid ${color}`,
        borderRadius:18,
        padding:20
      }}
    >
      <h3>{title}</h3>

      <p>{message}</p>

      <span
        style={{
          background:color,
          color:"white",
          padding:"6px 12px",
          borderRadius:20,
          fontSize:12
        }}
      >
        {level}
      </span>
    </div>
  );
}
