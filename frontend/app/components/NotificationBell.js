"use client";

export default function NotificationBell() {
  return (
    <div
      style={{
        position: "relative",
        cursor: "pointer"
      }}
    >
      <span style={{ fontSize: 24 }}>🔔</span>

      <div
        style={{
          position: "absolute",
          top: -4,
          right: -4,
          background: "#DC2626",
          color: "white",
          width: 18,
          height: 18,
          borderRadius: "50%",
          fontSize: 11,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        3
      </div>
    </div>
  );
}
