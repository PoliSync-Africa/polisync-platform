"use client";

const regions = [
  "Greater Accra",
  "Ashanti",
  "Bono East",
  "Eastern",
  "Western",
  "Northern",
  "Central",
  "Volta"
];

export default function GhanaMap() {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 20,
        padding: 24
      }}
    >
      <h3 style={{ color: "#0B3D2E" }}>
        Ghana Regional Operations
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,1fr)",
          gap: 12,
          marginTop: 20
        }}
      >
        {regions.map((region) => (
          <button
            key={region}
            style={{
              padding: 14,
              borderRadius: 12,
              border: "1px solid #E5E7EB",
              background: "#F8FAFC",
              cursor: "pointer"
            }}
          >
            {region}
          </button>
        ))}
      </div>
    </div>
  );
}
