"use client";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import OrganizationElectionManager from "../../../components/dashboard/OrganizationElectionManager";
const nav=[{section:"PARTY COMMAND",items:[{label:"Dashboard",href:"/party",key:"overview",icon:"⌂"}]},{section:"ELECTION MANAGEMENT",items:[{label:"Elections",href:"/party/elections",key:"elections",icon:"▣"},{label:"Live Results",href:"/party/results",key:"results",icon:"▤"},{label:"EC8 Results",href:"/party/ec8",key:"ec8",icon:"✓"}]}];
export default function PartyElections(){return <DashboardShell role="party" navigation={nav} activeSection="elections"><main style={{padding:"clamp(12px,2vw,28px)",background:"#f4f7f5",minHeight:"100%"}}><OrganizationElectionManager title="Party Election Management" organizationType="political_party"/></main></DashboardShell>}
