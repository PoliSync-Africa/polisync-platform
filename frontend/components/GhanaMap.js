"use client";

import { useEffect, useState } from "react";

export default function GhanaMap() {
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRegions() {
      try {
        const res = await fetch("/api/regions");
        const json = await res.json();

        if (json.success) {
          setRegions(json.data);
          setSelectedRegion(json.data[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadRegions();
  }, []);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "900px",
        background: "#ffffff",
        borderRadius: "20px",
        padding: "24px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.12)"
      }}
    >
      <h2 style={{ color: "#1B365D" }}>
        🗺 Ghana Political Intelligence Map
      </h2>

      <p style={{ color: "#666", marginBottom: "20px" }}>
        Live regions loaded from the POLISYNC Data API.
      </p>

      {loading ? (
        <p>Loading regions...</p>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
              gap: "12px"
            }}
          >
            {regions.map((region) => (
              <button
                key={region.id}
                onClick={() => setSelectedRegion(region)}
                style={{
                  padding: "14px",
                  borderRadius: "12px",
                  border:
                    selectedRegion?.id === region.id
                      ? "2px solid #FFD700"
                      : "1px solid #ddd",
                  background:
                    selectedRegion?.id === region.id
                      ? "#0A2540"
                      : "#F8FAFC",
                  color:
                    selectedRegion?.id === region.id
                      ? "#fff"
                      : "#1B365D",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                {region.name}
              </button>
            ))}
          </div>

          {selectedRegion && (
            <div
              style={{
                marginTop: "24px",
                padding: "20px",
                borderRadius: "16px",
                background: "#EEF6FF",
                border: "1px solid #BFD7EA"
              }}
            >
              <h3 style={{ color: "#0A2540" }}>
                Selected Region
              </h3>

              <h2 style={{ color: "#1B365D" }}>
                {selectedRegion.name}
              </h2>

              <p style={{ color: "#555" }}>
                Constituencies and polling stations will load dynamically from
                the national database.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
