"use client";
import DashboardShell from "../../../../components/dashboard/DashboardShell";
import DynamicResultsExplorer from "../../../../components/dashboard/DynamicResultsExplorer";
import ElectionResultsMapExplorer from "../../../../components/dashboard/ElectionResultsMapExplorer";
export default function Page(){return <DashboardShell role="super_admin" title="Live Results" subtitle="Real-time election results" activeSection="live-results"><main style={{padding:"clamp(10px,2vw,24px)",background:"#f4f7f5",minHeight:"100%"}}><ElectionResultsMapExplorer title="Live Election Results"/><div style={{marginTop:14}}><DynamicResultsExplorer/></div></main></DashboardShell>}
