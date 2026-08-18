"use client";

export default function ProgressRing({ value }) {
  return (
    <div
      style={{
        width: 120,
        height: 120,
        borderRadius: "50%",
        background: `conic-gradient(#0B3D2E ${value * 3.6}deg,#E5E7EB 0deg)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: "50%",
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          color: "#0B3D2E"
        }}
      >
        {value}%
      </div>
    </div>
  );
}
