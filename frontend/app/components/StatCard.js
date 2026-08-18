
"use client";

export default function StatCard({ title, value }) {
  return (
    <div
      style={{
        background: "white",
        padding: 24,
        borderRadius: 18,
        boxShadow: "0 8px 20px rgba(0,0,0,.06)"
      }}
    >
      <div
        style={{
          color: "#6B7280",
          fontSize: 14
        }}
      >
        {title}
      </div>

      <h2
        style={{
          marginTop: 12,
          color: "#0B3D2E"
        }}
      >
        {value}
      </h2>
    </div>
  );
}
