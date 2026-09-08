"use client";

import DashboardShell from "../../components/dashboard/DashboardShell";
import ElectionResultsMapExplorer from "../../components/dashboard/ElectionResultsMapExplorer";
import ElectionGeographyAssignmentsView from "../../components/dashboard/ElectionGeographyAssignmentsView";
import ElectionResultsGeographyTables from "../../components/dashboard/ElectionResultsGeographyTables";
import ElectionAccessGate from "../../components/dashboard/ElectionAccessGate";

const nav = [
  { section: "NAVIGATION", items: [{ label: "Home", href: "/dashboard", key: "home", icon: "⌂" }] },
  { section: "RESULTS", items: [{ label: "Results", href: "/results", key: "results", icon: "↗" }, { label: "Elections", href: "/elections", key: "elections", icon: "•" }] },
];

export default function ResultsPage() {
  return <ElectionAccessGate>
    <DashboardShell role="user" navigation={nav} activeSection="results">
      <main style={{ padding: "clamp(10px,2vw,24px)", background: "#f4f7f5", minHeight: "100%" }}>
        <ElectionResultsMapExplorer title="Election Results" />
        <ElectionResultsGeographyTables />
        <ElectionGeographyAssignmentsView title="Results by Region, Constituency & Polling Station" />
      </main>
    </DashboardShell>
  </ElectionAccessGate>;
}
