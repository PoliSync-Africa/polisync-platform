"use client";

import DashboardShell from "../../../components/dashboard/DashboardShell";
import ElectionResultsMapExplorer from "../../../components/dashboard/ElectionResultsMapExplorer";

export default function ParliamentaryCandidateResultsPage() {
  return (
    <DashboardShell
      role="parliamentary_candidate"
      title="Live Election Results"
      subtitle="Constituency results received through the PoliSync election results pipeline"
      activeSection="results"
    >
      <main style={{ padding: "clamp(10px,2vw,24px)", background: "#f4f7f5", minHeight: "100%" }}>
        <ElectionResultsMapExplorer title="Parliamentary Candidate Results" />
      </main>
    </DashboardShell>
  );
}
