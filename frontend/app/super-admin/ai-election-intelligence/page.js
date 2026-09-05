import DashboardShell from "../../../components/dashboard/DashboardShell";
import AIAnalyzer from "../../../components/dashboard/AIAnalyzer";

export default function Page() {
  return (
    <DashboardShell role="super_admin" title="AI Election Intelligence" subtitle="AI-assisted election analysis" activeSection="ai-election-intelligence">
      <main style={{ padding: 24, background: "#f5f8f6", minHeight: "100vh" }}>
        <AIAnalyzer role="super_admin" />
      </main>
    </DashboardShell>
  );
}
