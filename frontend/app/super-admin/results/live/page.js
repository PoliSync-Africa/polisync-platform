import DashboardShell from "../../../../components/dashboard/DashboardShell";
import DynamicResultsExplorer from "../../../../components/dashboard/DynamicResultsExplorer";

export default function Page() {
  return (
    <DashboardShell role="super_admin" title="Live Results" subtitle="Real-time election results" activeSection="live-results">
      <DynamicResultsExplorer />
    </DashboardShell>
  );
}
