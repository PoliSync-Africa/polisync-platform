"use client";

export default function LiveCounter() {
  return (
    <div
      style={{
        background: "#082C24",
        color: "white",
        borderRadius: 24,
        padding: 30,
        textAlign: "center"
      }}
    >
      <h3 style={{ color: "#D4AF37" }}>Live Reporting</h3>

      <h1 style={{ fontSize: 48 }}>92%</h1>

      <p>24,731 Polling Stations Reported</p>
    </div>
  );
}
