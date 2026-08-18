
"use client";

export default function Topbar() {
  return (
    <header
      style={{
        background: "white",
        padding: "18px 30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #E5E7EB"
      }}
    >
      <div>
        <h2 style={{ margin: 0 }}>Command Center</h2>
      </div>

      <div
        style={{
          display: "flex",
          gap: 18,
          alignItems: "center"
        }}
      >
        🔔

        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: "#0B3D2E",
            color: "white",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          D
        </div>
      </div>
    </header>
  );
}
