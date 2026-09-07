"use client";

import DashboardShell from "../../components/dashboard/DashboardShell";
import ElectionGeographyAssignmentsView from "../../components/dashboard/ElectionGeographyAssignmentsView";
import ElectionAccessGate from "../../components/dashboard/ElectionAccessGate";

const nav = [
  { section: "NAVIGATION", items: [{ label: "Home", href: "/dashboard", key: "home", icon: "⌂" }] },
  { section: "ELECTIONS", items: [{ label: "Elections", href: "/elections", key: "elections", icon: "•" }, { label: "Results", href: "/results", key: "results", icon: "↗" }] },
];

export default function ElectionsPage() {
  return <ElectionAccessGate>
    <DashboardShell role="user" navigation={nav} activeSection="elections">
      <main style={{ padding: "clamp(10px,2vw,24px)", background: "#f4f7f5", minHeight: "100%" }}>
        <section style={{ padding: "16px", borderRadius: "16px", background: "linear-gradient(135deg,#075f2b,#0b7540)", color: "#fff", border: "1px solid #0a6d35" }}>
          <div style={{ fontSize: "9px", letterSpacing: "1.4px", fontWeight: 900, color: "#e3c65b" }}>POLISYNC AFRICA • ORGANIZATIONAL ELECTION OPERATIONS</div>
          <h1 style={{ margin: "5px 0", fontSize: "24px" }}>Election Operations Center</h1>
          <p style={{ margin: 0, fontSize: "11px", opacity: .88, lineHeight: 1.5 }}>Access is limited to approved organization-assigned election duties. Drill down from Region → Constituency → Polling Station for the scope assigned to your role.</p>
        </section>
        <ElectionGeographyAssignmentsView title="Assigned Persons & Polling Station Results" />
      </main>
    </DashboardShell>
  </ElectionAccessGate>;
}
