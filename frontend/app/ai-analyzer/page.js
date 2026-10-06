"use client";

import DashboardShell from "../../components/dashboard/DashboardShell";
import AIAnalyzer from "../../components/dashboard/AIAnalyzer";

export default function AIAnalyzerPage() {
  return (
    <DashboardShell
      role="user"
      activeSection="ai-analyzer"
      title="AI Election Analyzer"
      subtitle="Election data, results and electoral intelligence"
    >
      <main style={{ padding: "clamp(14px,2.5vw,32px)", background: "#f4f7f5", minHeight: "100%" }}>
        <section style={{ padding: 28, borderRadius: 22, background: "linear-gradient(135deg,#04351a,#075f2b)", border: "1px solid #c9a227", color: "#fff" }}>
          <span style={{ color: "#c9a227", fontSize: 10, fontWeight: 900, letterSpacing: 1.5 }}>POLISYNC AI</span>
          <h1 style={{ margin: "8px 0", fontSize: 34 }}>AI Election Analyzer</h1>
          <p style={{ maxWidth: 800, color: "#dce9e1", fontSize: 12, lineHeight: 1.6 }}>
            Analyze election results, candidate performance, electoral geography, transmitted records and verification signals from your permitted workspace.
          </p>
        </section>
        <section style={{ marginTop: 12, padding: 18, border: "1px solid #dce6df", borderRadius: 17, background: "#fff" }}>
          <AIAnalyzer role="user" />
        </section>
      </main>
    </DashboardShell>
  );
}
