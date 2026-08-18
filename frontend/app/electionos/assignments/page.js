"use client";

import AgentAssignmentCard from "../../components/AgentAssignmentCard";

export default function AssignmentsPage() {
  return (
    <main style={{ padding: 40, background: "#F3F5F7", minHeight: "100vh" }}>
      <h1>Polling Agent Assignments</h1>

      <div
        style={{
          display: "grid",
          gap: 20,
          gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
          marginTop: 30
        }}
      >
        <AgentAssignmentCard
          name="Kwame Asante"
          pollingStation="Techiman SHS A"
          phone="+233..."
          attendance="Checked In"
        />

        <AgentAssignmentCard
          name="Akosua Owusu"
          pollingStation="Methodist Primary"
          phone="+233..."
          attendance="Pending"
        />
      </div>
    </main>
  );
}
