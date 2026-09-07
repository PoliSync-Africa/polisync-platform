"use client";

import DashboardShell from "../../../components/dashboard/DashboardShell";
import ElectionResultsMapExplorer from "../../../components/dashboard/ElectionResultsMapExplorer";
import ElectionAccessGate from "../../../components/dashboard/ElectionAccessGate";

export default function PresidentialCandidateResultsPage() {
  return (
    <ElectionAccessGate>
      <DashboardShell
        role="presidential_candidate"
        title="Live Election Results"
        subtitle="Real results received through the PoliSync election results pipeline"
        activeSection="results"
      >
        <main style={{ padding: "clamp(10px,2vw,24px)", background: "#f4f7f5", minHeight: "100%" }}>
          <ElectionResultsMapExplorer title="Presidential Candidate Results" />
        </main>
      </DashboardShell>
    </ElectionAccessGate>
  );
}
