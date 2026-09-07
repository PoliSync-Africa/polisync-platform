"use client";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import ElectionResultsMapExplorer from "../../../components/dashboard/ElectionResultsMapExplorer";

export default function Page(){
  return <DashboardShell role="party" title="Live Results" subtitle="Election results by geography" activeSection="results"><main style={{padding:"clamp(10px,2vw,24px)",background:"#f4f7f5",minHeight:"100%"}}><ElectionResultsMapExplorer title="Party Election Results" /></main></DashboardShell>;
}
