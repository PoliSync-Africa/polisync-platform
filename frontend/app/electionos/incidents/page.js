"use client";

import IncidentCard from "../../components/IncidentCard";

export default function IncidentsPage() {
  return (
    <main style={{ padding: 40, background: "#F3F5F7", minHeight: "100vh" }}>
      <h1>Election Incidents</h1>

      <div
        style={{
          display: "grid",
          gap: 20,
          marginTop: 30
        }}
      >
        <IncidentCard
          type="Network Outage"
          station="BE-TEC-014"
          severity="Medium"
        />

        <IncidentCard
          type="Duplicate Submission"
          station="BE-TEC-027"
          severity="Critical"
        />

        <IncidentCard
          type="Delayed Opening"
          station="BE-KIN-004"
          severity="Low"
        />
      </div>
    </main>
  );
}
