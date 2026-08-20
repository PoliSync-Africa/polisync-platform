"use client";

import { useState } from "react";

const regions = [
  "Greater Accra",
  "Ashanti",
  "Bono",
  "Bono East",
  "Ahafo",
  "Central",
  "Eastern",
  "Northern",
  "North East",
  "Savannah",
  "Upper East",
  "Upper West",
  "Volta",
  "Oti",
  "Western",
  "Western North",
];

export default function GhanaMap() {
  const [selectedRegion, setSelectedRegion] = useState("Bono East");

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "900px",
        background: "#ffffff",
        borderRadius: "20px",
        padding: "24px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
      }}
    >
      <h2 style={{ color: "#1B365D" }}>
        🗺 Ghana Political Intelligence Map
      </h2>

      <p style={{ color: "#666", marginBottom: "20px" }}>
        Interactive foundation for Ghana's election intelligence system.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          gap: "12px",
        }}
      >
        {regions.map((region) => (
          <button
            key={region}
            onClick={() => setSelectedRegion(region)}
            style={{
              padding: "14px",
              borderRadius: "12px",
              border:
                selectedRegion === region
                  ? "2px solid #FFD700"
                  : "1px solid #ddd",
              background:
                selectedRegion === region ? "#0A2540" : "#F8FAFC",
              color:
                selectedRegion === region ? "#fff" : "#1B365D",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            {region}
          </button>
        ))}
      </div>

      <div
        style={{
          marginTop: "24px",
          padding: "20px",
          borderRadius: "16px",
          background: "#EEF6FF",
          border: "1px solid #BFD7EA",
        }}
      >
        <h3 style={{ color: "#0A2540", marginBottom: "8px" }}>
          Selected Region
        </h3>

        <h2 style={{ color: "#1B365D" }}>
          {selectedRegion}
        </h2>

        <p style={{ color: "#555" }}>
          Districts, constituencies, polling stations and live election
          intelligence for {selectedRegion} will appear here.
        </p>
      </div>
    </div>
  );
}
