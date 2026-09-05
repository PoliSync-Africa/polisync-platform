"use client";

import { useEffect, useState } from "react";

export default function ConstituencyPage({ params }) {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStations() {
      setLoading(true);
      setError("");
      try {
        const token = typeof window !== "undefined"
          ? (localStorage.getItem("polisync_token") || localStorage.getItem("token") || sessionStorage.getItem("polisync_token") || sessionStorage.getItem("token"))
          : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`/api/electoral-geography/constituencies/${encodeURIComponent(params.code)}/polling-stations`, {
          headers,
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Unable to load polling stations.");
        if (!cancelled) setStations(Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load polling stations.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStations();
    return () => { cancelled = true; };
  }, [params.code]);

  return (
    <main style={{ padding: "clamp(16px, 4vw, 30px)", minWidth: 0, overflowX: "hidden" }}>
      <h1 style={{ overflowWrap: "anywhere" }}>{params.code}</h1>

      {loading && <p>Loading polling stations…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && stations.length === 0 && <p>No polling stations found for this constituency.</p>}

      {!loading && !error && stations.length > 0 && (
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: 12 }}>
          {stations.map((station) => (
            <div key={station._id || station.pollingStationCode || station.code} style={{ minWidth: 0, overflowWrap: "anywhere" }}>
              <strong>{station.pollingStationCode || station.code || "—"}</strong>
              <div>{station.name || "Unnamed polling station"}</div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
