"use client";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import OrganizationElectionManager from "../../../components/dashboard/OrganizationElectionManager";
const nav=[{section:"OBSERVATION COMMAND",items:[{label:"Dashboard",href:"/observer",key:"overview",icon:"⌂"}]},{section:"ELECTION MANAGEMENT",items:[{label:"Elections",href:"/observer/elections",key:"elections",icon:"▣"},{label:"Live Election Monitor",href:"/observer/results",key:"results",icon:"▤"}]}];
export default function ObserverElections(){return <DashboardShell role="observer" navigation={nav} activeSection="elections"><main style={{padding:"clamp(12px,2vw,28px)",background:"#f4f7f5",minHeight:"100%"}}><OrganizationElectionManager title="Observer Election Management" organizationType="observer_organization"/></main></DashboardShell>}
