"use client";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import ElectionResultsMapExplorer from "../../../components/dashboard/ElectionResultsMapExplorer";
import ElectionAccessGate from "../../../components/dashboard/ElectionAccessGate";

export default function Page(){
  return <ElectionAccessGate><DashboardShell role="observer_organization" title="Live Election Monitor" subtitle="Election results by geography" activeSection="results"><main style={{padding:"clamp(10px,2vw,24px)",background:"#f4f7f5",minHeight:"100%"}}><ElectionResultsMapExplorer title="Election Results Monitor" /></main></DashboardShell></ElectionAccessGate>;
}
