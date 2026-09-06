"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../../../../components/dashboard/DashboardShell";
import superAdminNavigation from "../../../../components/dashboard/superAdminNavigation";

const LABELS = {
  political_party: "Political Party",
  observer_organization: "Observer Organization",
  parliamentary_candidate: "Parliamentary Candidate",
  presidential_candidate: "Presidential Candidate",
  research: "Research Organization",
};

const TEST_ROUTES = {
  political_party: [
    ["Dashboard", "/party"], ["National Command", "/party/national"], ["Constituencies", "/party/constituencies"], ["Polling Stations", "/party/polling-stations"], ["Members", "/party/members"], ["Candidates", "/party/candidates"], ["Field Operations", "/party/field"], ["Live Results", "/party/results"], ["Analytics", "/party/analytics"], ["Calendar", "/party/calendar"], ["Privacy & Security", "/settings/security"],
  ],
  observer_organization: [
    ["Dashboard", "/observer"], ["National Observation", "/observer/national"], ["Regions", "/observer/regions"], ["Polling Stations", "/observer/polling-stations"], ["Observer Deployment", "/observer/deployment"], ["Observation Teams", "/observer/teams"], ["Field Reports", "/observer/reports"], ["Incidents", "/observer/incidents"], ["Evidence", "/observer/evidence"], ["Live Election Monitor", "/observer/results"], ["Analytics", "/observer/analytics"], ["Privacy & Security", "/settings/security"],
  ],
  parliamentary_candidate: [
    ["Dashboard", "/parliamentary-candidate"], ["Constituency", "/parliamentary-candidate/constituency"], ["Campaign", "/parliamentary-candidate/campaign"], ["Field Operations", "/parliamentary-candidate/field"], ["Results", "/parliamentary-candidate/results"], ["Analytics", "/parliamentary-candidate/analytics"], ["Calendar", "/parliamentary-candidate/calendar"], ["Privacy & Security", "/settings/security"],
  ],
  presidential_candidate: [
    ["Dashboard", "/presidential-candidate"], ["National Command", "/presidential-candidate/national"], ["Campaign", "/presidential-candidate/campaign"], ["Field Operations", "/presidential-candidate/field"], ["Results", "/presidential-candidate/results"], ["Analytics", "/presidential-candidate/analytics"], ["Calendar", "/presidential-candidate/calendar"], ["Privacy & Security", "/settings/security"],
  ],
  research: [
    ["Dashboard", "/research"], ["Political Research", "/research/political"], ["Datasets", "/research/datasets"], ["Analytics", "/research/analytics"], ["Reports", "/research/reports"], ["AI Analyzer", "/research/ai-analyzer"], ["Calendar", "/research/calendar"], ["Privacy & Security", "/settings/security"],
  ],
};

function token() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || localStorage.getItem("token") || sessionStorage.getItem("token") || "";
}

async function request(workspaceType, organizationId) {
  const params = new URLSearchParams();
  if (organizationId) params.set("organizationId", organizationId);
  const query = params.toString();
  const response = await fetch(`/api/super-admin/workspaces/session/${encodeURIComponent(workspaceType)}${query ? `?${query}` : ""}`, {
    cache: "no-store",
    headers: { Accept: "application/json", Authorization: `Bearer ${token()}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success !== true) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}

export default function OpenWorkspacePage() {
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState("");
  const [workspaceType, setWorkspaceType] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("workspace") || "";
    const selectedId = params.get("organizationId") || "";
    setWorkspaceType(type);
    setOrganizationId(selectedId);
    if (!LABELS[type]) {
      setError("Select a supported workspace from the Workspace Lab.");
      setLoading(false);
      return;
    }
    request(type, selectedId).then(setSession).catch((e) => setError(e.message || "Unable to open workspace.")).finally(() => setLoading(false));
  }, []);

  const routes = useMemo(() => TEST_ROUTES[workspaceType] || [], [workspaceType]);

  const enter = (href) => {
    const params = new URLSearchParams({ __superAdminWorkspace: workspaceType, __superAdminPreview: "1" });
    if (session?.organization?._id) params.set("organizationId", session.organization._id);
    window.location.href = `${href}${href.includes("?") ? "&" : "?"}${params.toString()}`;
  };

  return (
    <DashboardShell role="super_admin" navigation={superAdminNavigation} activeSection="workspace-lab" title={session ? LABELS[workspaceType] : "Opening Workspace"} subtitle="Controlled Super Admin preview and QA mode">
      <main className="page">
        {loading ? <div className="loading">Opening secure workspace preview…</div> : error ? <section className="error-card"><strong>Workspace unavailable</strong><p>{error}</p><button onClick={() => { window.location.href = "/super-admin/workspaces"; }}>Back to Workspace Lab</button></section> : <>
          <section className="hero">
            <div>
              <div className="eyebrow">SUPER ADMIN • PREVIEW MODE</div>
              <h1>{session.organization?.name}</h1>
              <p>{LABELS[workspaceType]} · <strong>{session.mode === "sandbox" ? "Sandbox workspace" : "Organization workspace"}</strong></p>
            </div>
            <div className="mode">{session.mode === "sandbox" ? "NO ORGANIZATION REQUIRED" : "LIVE ORGANIZATION"}</div>
          </section>

          <section className="banner">
            <strong>Workspace preview is active.</strong>
            <span>You can inspect and repair screens, navigation and workflows as Super Admin. The preview does not impersonate an organization member and result submission remains disabled in this QA mode.</span>
          </section>

          <section className="summary">
            <div><span>Workspace Type</span><strong>{LABELS[workspaceType]}</strong></div>
            <div><span>Organization</span><strong>{session.organization?.name}</strong></div>
            <div><span>Status</span><strong>{session.organization?.organizationStatus || "sandbox"}</strong></div>
            <div><span>Test Permissions</span><strong>View · Create · Edit · Repair</strong></div>
          </section>

          <section className="routes">
            <header><div><span>WORKSPACE SURFACE TESTS</span><h2>Open any module</h2></div><button onClick={() => { window.location.href = "/super-admin/workspaces"; }}>Workspace Lab</button></header>
            <div className="route-grid">{routes.map(([label, href]) => <button className="route" key={`${label}-${href}`} onClick={() => enter(href)}><span>{label}</span><b>›</b></button>)}</div>
          </section>

          <section className="checks">
            <h2>Super Admin QA controls</h2>
            <div className="checks-grid">
              {[["Access", "Open every workspace without organization membership"],["Data isolation", "Preview identity remains separate from organization member roles"],["Repair", "Super Admin may diagnose and modify supported workspace resources"],["Security", "Sensitive role-restricted actions remain protected"],["Sandboxing", "No fake organization record is required to test the interface"],["Results safety", "Test preview cannot submit election results as an organization agent"]].map(([title,text]) => <article key={title}><strong>{title}</strong><p>{text}</p></article>)}
            </div>
          </section>
        </>}
      </main>
      <style jsx>{styles}</style>
    </DashboardShell>
  );
}

const styles=`
.page{min-height:100%;padding:clamp(16px,3vw,34px);background:#f4f7f5;color:#173527}.loading,.error-card,.hero,.banner,.summary,.routes,.checks{max-width:1180px;margin:0 auto 16px;border:1px solid #dce6df;border-radius:18px;background:#fff;box-shadow:0 8px 22px rgba(13,60,38,.05)}.loading{padding:60px;text-align:center;color:#708078}.error-card{padding:25px;color:#8b3229;background:#fff7f5}.error-card p{color:#6d7772}.error-card button{border:0;background:#075f2b;color:#fff;border-radius:10px;padding:11px 15px;font-weight:800}.hero{padding:26px;background:linear-gradient(135deg,#073f25,#075f2b);color:#fff;display:flex;justify-content:space-between;gap:20px;align-items:flex-end}.eyebrow{font-size:10px;letter-spacing:1.5px;font-weight:900;color:#d7ba50}.hero h1{margin:8px 0 4px;font-size:clamp(30px,5vw,50px);line-height:1.02}.hero p{margin:0;color:#e9f1ec}.mode{padding:9px 11px;border-radius:999px;background:rgba(255,255,255,.11);font-size:9px;font-weight:900;letter-spacing:1px;white-space:nowrap}.banner{padding:16px 18px;background:#edf7f0;display:grid;gap:4px}.banner strong{color:#075f2b}.banner span{color:#65756c;font-size:13px;line-height:1.55}.summary{display:grid;grid-template-columns:repeat(4,1fr);overflow:hidden}.summary div{padding:16px;border-right:1px solid #e8efea}.summary div:last-child{border-right:0}.summary span{display:block;color:#7b8881;text-transform:uppercase;font-size:9px;letter-spacing:1px;font-weight:800}.summary strong{display:block;margin-top:5px;color:#075f2b;font-size:14px}.routes{overflow:hidden}.routes header{display:flex;justify-content:space-between;gap:14px;align-items:flex-end;padding:16px 18px;border-bottom:1px solid #e8efea;background:#f8fbf9}.routes header>div>span{color:#bd941c;font-size:9px;font-weight:900;letter-spacing:1.4px}.routes h2{margin:4px 0 0;color:#075f2b;font-size:21px}.routes header button{border:0;background:#075f2b;color:#fff;border-radius:9px;padding:9px 12px;font-weight:800}.route-grid{padding:13px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.route{display:flex;align-items:center;justify-content:space-between;min-height:48px;padding:12px 13px;border:1px solid #dfe8e3;border-radius:11px;background:#fbfdfb;color:#244437;font-weight:750;cursor:pointer;text-align:left}.route:hover{border-color:#c9a227;background:#f8f5e8}.route b{font-size:22px;color:#08703a}.checks{padding:20px}.checks h2{margin:0 0 14px;color:#075f2b;font-size:21px}.checks-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.checks-grid article{padding:14px;border:1px solid #e3ebe6;border-radius:12px;background:#fbfdfb}.checks-grid strong{color:#26483a}.checks-grid p{margin:6px 0 0;color:#748078;font-size:12px;line-height:1.5}@media(max-width:850px){.summary{grid-template-columns:1fr 1fr}.summary div:nth-child(2){border-right:0}.summary div:nth-child(-n+2){border-bottom:1px solid #e8efea}.route-grid{grid-template-columns:1fr 1fr}.checks-grid{grid-template-columns:1fr 1fr}}@media(max-width:560px){.page{padding:12px}.hero{padding:19px;display:block}.mode{display:inline-flex;margin-top:15px}.summary{grid-template-columns:1fr}.summary div{border-right:0!important;border-bottom:1px solid #e8efea}.summary div:last-child{border-bottom:0}.route-grid,.checks-grid{grid-template-columns:1fr}.routes header{align-items:flex-start;flex-direction:column}.routes header button{width:100%}}
`;
