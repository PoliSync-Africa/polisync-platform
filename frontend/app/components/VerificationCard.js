"use client";

export default function VerificationCard({
  station,
  score,
  verified
}) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 18,
        padding: 22
      }}
    >
      <h3>{station}</h3>

      <p>Trust Score: {score}</p>

      <div
        style={{
          background: verified ? "#DCFCE7" : "#FEF3C7",
          color: "#0B3D2E",
          padding: "10px 14px",
          borderRadius: 12,
          display: "inline-block"
        }}
      >
        {verified ? "Verified" : "Pending Review"}
      </div>
    </div>
  );
}
