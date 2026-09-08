"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import superAdminNavigation from "../../../components/dashboard/superAdminNavigation";

const types = [
  ["personal_use", "Personal / Civic User", "Test the normal personal user workspace: public elections, geography, candidates, parties, saved information, alerts, calendar and AI Analyzer."],
  ["political_party", "Political Party", "Open the full party workspace, even before a real party has been onboarded."],
  ["observer_organization", "Observer Organization", "Test observation command, deployments, evidence and reports."],
  ["parliamentary_candidate", "Parliamentary Candidate", "Test the candidate workspace and constituency campaign tools."],
  ["presidential_candidate", "Presidential Candidate", "Test national candidate command and campaign workflows."],
  ["research", "Research Organization", "Test research, analysis and intelligence workflows."],
];

function token() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || localStorage.getItem("authToken") || sessionStorage.getItem("authToken") || localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || localStorage.getItem("token") || sessionStorage.getItem("token") || "";
}

async function request(path) {
  const response = await fetch(path, { cache: "no-store", headers: { Accept: "application/json", Authorization: `Bearer ${token()}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success !== true) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}

export default function WorkspaceLab() {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const data = await request("/api/super-admin/workspaces/catalog");
      setCatalog(Array.isArray(data.catalog) ? data.catalog : []);
    } catch (e) { setError(e.message || "Unable to load the workspace lab."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const byType = useMemo(() => new Map(catalog.map((item) => [item.organizationType, item])), [catalog]);
  const openWorkspace = (workspaceType, organizationId = "") => {
    const params = new URLSearchParams({ workspace: workspaceType });
    if (organizationId) params.set("organizationId", organizationId);
    window.location.href = `/super-admin/workspaces/open?${params.toString()}`;
  };

  return (
    <DashboardShell role="super_admin" navigation={superAdminNavigation} activeSection="workspace-lab" title="Workspace Lab" subtitle="Super Admin testing access to every PoliSync workspace">
      <main className="page">
        <section className="hero">
          <div><div className="eyebrow">SUPER ADMIN • PLATFORM QA</div><h1>Open Every Workspace</h1><p>Test organization workspaces and the normal personal user workspace from one controlled QA center.</p></div>
          <button onClick={load} disabled={loading}>↻ Refresh</button>
        </section>

        {error && <div className="error">{error}</div>}

        <section className="notice"><strong>Safe test mode</strong><span>Personal / Civic User is a normal personal account workspace, not an organization. The preview is for Super Admin QA only and does not create a fake organization or grant personal users organization privileges.</span></section>

        <section className="grid">
          {types.map(([type, title, description]) => {
            const existing = byType.get(type);
            const personal = type === "personal_use";
            return <article className={`card ${personal ? "personal-card" : ""}`} key={type}>
              <div className="icon">{personal ? "♙" : "◈"}</div><div className="copy"><div className="type">{personal ? "PERSONAL ACCOUNT" : type.replace(/_/g, " ")}</div><h2>{title}</h2><p>{description}</p></div>
              <div className={`status ${personal ? "personal-status" : existing ? "" : "sandbox"}`}>{personal ? "NORMAL USER WORKSPACE" : existing ? "LIVE ORGANIZATION AVAILABLE" : "NO ORGANIZATION REQUIRED"}</div>
              <div className="actions"><button className="primary" onClick={() => openWorkspace(type, existing?.id || "")}>Open Workspace</button>{existing && !personal && <button className="secondary" onClick={() => openWorkspace(type)}>Open Sandbox</button>}</div>
            </article>;
          })}
        </section>

        {loading ? <div className="loading">Loading workspace catalog…</div> : <section className="existing"><header><div><span>EXISTING ORGANIZATIONS</span><h2>Organization workspaces available for direct testing</h2></div><small>{catalog.length} found</small></header>{catalog.length === 0 ? <div className="empty">No organizations exist yet. Personal / Civic User remains available above.</div> : <div className="table"><table><thead><tr><th>Organization</th><th>Type</th><th>Status</th><th>Members</th><th /></tr></thead><tbody>{catalog.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><small>{item.slug}</small></td><td>{item.organizationType}</td><td>{item.organizationStatus || "unknown"}</td><td>{Number(item.memberCount || 0).toLocaleString()}</td><td><button onClick={() => openWorkspace(item.organizationType, item.id)}>Enter</button></td></tr>)}</tbody></table></div>}</section>}
      </main>
      <style jsx>{styles}</style>
    </DashboardShell>
  );
}

const styles = `
.page{min-height:100%;padding:clamp(16px,3vw,34px);background:#f4f7f5;color:#173527}.hero,.card,.existing,.notice{border:1px solid #dce6df;background:#fff;box-shadow:0 8px 22px rgba(13,60,38,.05)}.hero{max-width:1180px;margin:0 auto 16px;padding:26px;border-radius:20px;display:flex;justify-content:space-between;gap:18px;align-items:flex-end}.eyebrow,.type,.existing header>div>span{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-weight:900;color:#bd941c}.hero h1{margin:7px 0;color:#075f2b;font-size:clamp(32px,5vw,50px);line-height:1.03}.hero p{max-width:720px;margin:0;color:#6e7b73;line-height:1.6}.hero button{border:0;border-radius:10px;background:#075f2b;color:#fff;padding:12px 16px;font-weight:800;cursor:pointer}.hero button:disabled{opacity:.55}.error{max-width:1180px;margin:0 auto 14px;padding:13px;border-radius:12px;background:#fff3f2;border:1px solid #efcfca;color:#a02e26}.notice{max-width:1180px;margin:0 auto 16px;border-radius:16px;padding:16px 18px;background:#edf7f0;display:grid;gap:4px}.notice strong{color:#075f2b}.notice span{color:#63766b;font-size:13px;line-height:1.5}.grid{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.card{min-width:0;border-radius:18px;padding:20px;display:grid;grid-template-columns:auto 1fr;column-gap:14px;row-gap:12px}.personal-card{border-color:#c9a227}.icon{width:44px;height:44px;border-radius:13px;background:#e8f3ec;color:#08703a;display:grid;place-items:center;font-size:21px;font-weight:900}.copy{min-width:0}.copy h2{margin:4px 0 5px;color:#075f2b;font-size:20px}.copy p{margin:0;color:#738179;font-size:13px;line-height:1.55}.status{grid-column:1/-1;padding:8px 10px;border-radius:9px;background:#eef7f1;color:#14713f;font-size:10px;font-weight:900;letter-spacing:.6px}.personal-status{background:#f8f2da;color:#806818}.sandbox{background:#f8f2da;color:#806818}.actions{grid-column:1/-1;display:flex;gap:9px;flex-wrap:wrap}.actions button{flex:1;min-height:42px;border:0;border-radius:10px;font-weight:800;cursor:pointer}.primary{background:#075f2b;color:#fff}.secondary{background:#f1f6f3;color:#075f2b;border:1px solid #d8e4dc!important}.existing{max-width:1180px;margin:16px auto 0;border-radius:18px;overflow:hidden}.existing header{padding:16px 18px;display:flex;justify-content:space-between;gap:14px;align-items:flex-end;border-bottom:1px solid #e8eeeb;background:#f8fbf9}.existing h2{margin:4px 0 0;color:#075f2b;font-size:20px}.existing header small{color:#7b877f}.empty,.loading{padding:38px 18px;text-align:center;color:#78857d}.table{overflow:auto}.table table{width:100%;min-width:760px;border-collapse:collapse}.table th,.table td{padding:13px 15px;border-bottom:1px solid #edf1ef;text-align:left;font-size:13px}.table th{background:#fbfdfc;color:#728078;font-size:10px;text-transform:uppercase;letter-spacing:1px}.table td strong,.table td small{display:block}.table td small{margin-top:3px;color:#87938d;font-size:10px}.table button{border:0;background:#eaf4ee;color:#075f2b;border-radius:9px;padding:9px 12px;font-weight:800;cursor:pointer}@media(max-width:760px){.hero{align-items:flex-start;flex-direction:column;padding:19px}.hero button{width:100%}.grid{grid-template-columns:1fr}.card{padding:17px}.existing header{align-items:flex-start;flex-direction:column}}@media(max-width:430px){.page{padding:12px}.hero h1{font-size:31px}.actions{flex-direction:column}.actions button{width:100%}}
`;
