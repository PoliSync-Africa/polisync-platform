"use client";

import { useEffect, useState } from "react";

const REGIONS_API = "/api/electoral-geography/regions";

export default function GhanaMap() {
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadRegions() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(REGIONS_API, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) throw new Error(json.message || "Unable to load Ghana regions.");
        const nextRegions = Array.isArray(json.data) ? json.data : [];
        if (!cancelled) {
          setRegions(nextRegions);
          setSelectedRegion((current) => current || nextRegions[0] || null);
        }
      } catch (err) {
        console.error("GhanaMap regions:", err);
        if (!cancelled) setError(err.message || "Unable to load Ghana regions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRegions();
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: "900px", boxSizing: "border-box", background: "#ffffff", borderRadius: "20px", padding: "clamp(16px, 4vw, 24px)", boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }}>
      <h2 style={{ color: "#1B365D", overflowWrap: "anywhere" }}>🗺 Ghana Political Intelligence Map</h2>
      <p style={{ color: "#666", marginBottom: "20px" }}>Live regions loaded from the POLISYNC Data API.</p>
      {loading ? <p>Loading regions...</p> : error ? (
        <div role="alert" style={{ color: "#9B1C1C", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: 14 }}>{error}</div>
      ) : regions.length === 0 ? <p>No regions are currently available.</p> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(160px,100%),1fr))", gap: "12px" }}>
            {regions.map((region) => (
              <button key={region.id} onClick={() => setSelectedRegion(region)} style={{ width: "100%", minWidth: 0, padding: "14px", borderRadius: "12px", border: selectedRegion?.id === region.id ? "2px solid #FFD700" : "1px solid #ddd", background: selectedRegion?.id === region.id ? "#0A2540" : "#F8FAFC", color: selectedRegion?.id === region.id ? "#fff" : "#1B365D", fontWeight: "600", cursor: "pointer", overflowWrap: "anywhere" }}>
                {region.name}
              </button>
            ))}
          </div>
          {selectedRegion && <div style={{ marginTop: "24px", padding: "clamp(14px, 4vw, 20px)", borderRadius: "16px", background: "#EEF6FF", border: "1px solid #BFD7EA", overflowWrap: "anywhere" }}>
            <h3 style={{ color: "#0A2540" }}>Selected Region</h3>
            <h2 style={{ color: "#1B365D" }}>{selectedRegion.name}</h2>
            <p style={{ color: "#555" }}>Constituencies and polling stations will load dynamically from the national database.</p>
          </div>}
        </>
      )}
    </div>
  );
}
