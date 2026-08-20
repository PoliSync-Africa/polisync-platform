"use client";

import WeatherWidget from "../../components/WeatherWidget";

export default function WarRoomPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0B1020",
        color: "white",
        padding: "24px",
      }}
    >
      <h1
        style={{
          fontSize: "32px",
          fontWeight: "bold",
          marginBottom: "8px",
        }}
      >
        PoliSync War Room
      </h1>

      <p
        style={{
          color: "#A1A1AA",
          marginBottom: "24px",
        }}
      >
        Live election monitoring, field intelligence, and campaign coordination.
      </p>

      <WeatherWidget />

      <div
        style={{
          marginTop: "24px",
          display: "grid",
          gap: "16px",
        }}
      >
        <div
          style={{
            background: "#111827",
            padding: "16px",
            borderRadius: "12px",
          }}
        >
          <h3>Field Operations</h3>
          <p>Monitor reports from polling stations and field agents.</p>
        </div>

        <div
          style={{
            background: "#111827",
            padding: "16px",
            borderRadius: "12px",
          }}
        >
          <h3>Election Dashboard</h3>
          <p>Track live vote collation and constituency performance.</p>
        </div>

        <div
          style={{
            background: "#111827",
            padding: "16px",
            borderRadius: "12px",
          }}
        >
          <h3>Rapid Response</h3>
          <p>Coordinate verified incident reports across all admin levels.</p>
        </div>
      </div>
    </main>
  );
}
