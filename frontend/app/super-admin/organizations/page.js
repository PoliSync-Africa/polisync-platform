"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || "";
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [totals, setTotals] = useState({});
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionBusy, setActionBusy] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/api/organizations/admin/all`, { headers: { Accept: "application/json", Authorization: `Bearer ${getToken()}` } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || `Unable to load organizations (${response.status}).`);
      setOrganizations(Array.isArray(data.organizations) ? data.organizations : []);
      setTotals(data.totals || {});
    } catch (e) { setError(e.message || "Unable to load organizations."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return organizations.filter((item) => {
      const matchesSearch = !q || String(item.name || "").toLowerCase().includes(q) || String(item.politicalPartyName || item.slug || "").toLowerCase().includes(q);
      const matchesType = typeFilter === "all" || item.organizationType === typeFilter;
      const matchesStatus = statusFilter === "all" || item.organizationStatus === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [organizations, search, typeFilter, statusFilter]);

  const changeStatus = async (organizationId, action) => {
    setActionBusy(organizationId); setError("");
    try {
      const response = await fetch(`${API_URL}/api/organizations/admin/${organizationId}/${action}`, { method: "PATCH", headers: { Accept: "application/json", Authorization: `Bearer ${getToken()}` } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || `Unable to ${action} organization.`);
      setSelected(null); await load();
    } catch (e) { setError(e.message || "Organization action failed."); }
    finally { setActionBusy(""); }
  };

  return (
    <DashboardShell role="super_admin" title="Organizations" subtitle="Real organizational records, approval state and membership counts" activeSection="organizations">
      <main className="page">
        <header className="hero"><div><span>SUPER ADMIN • PLATFORM MANAGEMENT</span><h2>Organizations</h2><p>Loaded directly from the PoliSync database. No demo organizations are displayed.</p></div><button className="refresh" type="button" onClick={load} disabled={loading}>{loading ? "Loading…" : "↻ Refresh"}</button></header>
        <section className="stats"><Stat label="Organizations" value={totals.organizations} /><Stat label="Approved" value={totals.active} /><Stat label="Pending" value={totals.pending} /><Stat label="Political parties" value={totals.politicalParties} /><Stat label="Observers" value={totals.observers} /></section>
        <section className="toolbar"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search organizations…" /><select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option value="all">All types</option><option value="political_party">Political parties</option><option value="observer_organization">Observers</option><option value="parliamentary_candidate">Parliamentary candidates</option><option value="presidential_candidate">Presidential candidates</option><option value="research">Research</option></select><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="suspended">Suspended</option><option value="rejected">Rejected</option><option value="deactivated">Deactivated</option></select></section>
        {error && <div className="error">{error}</div>}
        {loading ? <div className="state">Loading organizations…</div> : filtered.length === 0 ? <div className="state">No organizations match the selected filters.</div> : <section className="table-card"><div className="table-wrap"><table><thead><tr><th>Organization</th><th>Type</th><th>Status</th><th>Admins</th><th>Members</th><th>Party / Candidate</th><th>Action</th></tr></thead><tbody>{filtered.map((item) => <tr key={item._id}><td><strong>{item.name}</strong><small>{item.slug}</small></td><td>{item.organizationType}</td><td><span className={`status ${item.organizationStatus}`}>{item.organizationStatus}</span></td><td>{Number(item.adminCount || 0).toLocaleString()}</td><td>{Number(item.memberCount || 0).toLocaleString()}</td><td>{item.politicalPartyName || item.candidate?.fullName || item.candidateParty || (item.candidateIsIndependent ? "Independent" : "—")}</td><td><button className="view" type="button" onClick={() => setSelected(item)}>View</button></td></tr>)}</tbody></table></div></section>}
        {selected && <div className="backdrop" onClick={() => setSelected(null)}><section className="modal" onClick={(e) => e.stopPropagation()}><button className="close" type="button" onClick={() => setSelected(null)}>×</button><span className="eyebrow">ORGANIZATION RECORD</span><h3>{selected.name}</h3><p className="muted">{selected.slug}</p><div className="details"><Detail label="Type" value={selected.organizationType} /><Detail label="Status" value={selected.organizationStatus} /><Detail label="Admins" value={selected.adminCount || 0} /><Detail label="Members" value={selected.memberCount || 0} /><Detail label="Email" value={selected.email || "—"} /><Detail label="Phone" value={selected.phone || "—"} /><Detail label="Candidate" value={selected.candidate?.fullName || "—"} /><Detail label="Party" value={selected.politicalPartyName || selected.candidateParty || (selected.candidateIsIndependent ? "Independent" : "—")} /></div><div className="actions">{selected.organizationStatus === "pending" && <><button disabled={actionBusy === selected._id} onClick={() => changeStatus(selected._id, "approve")}>Approve</button><button className="danger" disabled={actionBusy === selected._id} onClick={() => changeStatus(selected._id, "reject")}>Reject</button></>}<button className="secondary" onClick={() => setSelected(null)}>Close</button></div></section></div>}
      </main>
      <style jsx>{styles}</style>
    </DashboardShell>
  );
}

function Stat({ label, value }) { return <div className="stat"><span>{label}</span><strong>{Number(value || 0).toLocaleString()}</strong></div>; }
function Detail({ label, value }) { return <div className="detail"><span>{label}</span><strong>{String(value)}</strong></div>; }

const styles = `
.page{min-height:100%;box-sizing:border-box;padding:clamp(14px,2.5vw,32px);background:#f5f8f6;color:#26332b}.hero{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:18px}.hero span,.eyebrow{color:#c9a227;font-size:9px;font-weight:900;letter-spacing:1.4px}.hero h2{margin:6px 0;color:#075f2b;font-size:30px}.hero p{margin:0;color:#6f7c74;font-size:12px}.refresh,.view,.actions button{border:1px solid #d5e2d9;border-radius:9px;background:#075f2b;color:#fff;padding:9px 12px;font-size:10px;font-weight:800;cursor:pointer}.refresh:disabled,.actions button:disabled{opacity:.55;cursor:not-allowed}.stats{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:14px}.stat{padding:15px;border:1px solid #dce6df;border-radius:13px;background:#fff}.stat span{display:block;color:#7b8780;font-size:9px}.stat strong{display:block;margin-top:5px;color:#075f2b;font-size:22px}.toolbar{display:grid;grid-template-columns:1fr 220px 180px;gap:9px;margin-bottom:12px}.toolbar input,.toolbar select{width:100%;box-sizing:border-box;min-height:42px;padding:0 11px;border:1px solid #dce6df;border-radius:9px;background:#fff;color:#26332b;font-size:11px;outline:none}.table-card{background:#fff;border:1px solid #dce6df;border-radius:15px;overflow:hidden}.table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;min-width:850px}th,td{padding:12px 13px;border-bottom:1px solid #edf1ee;text-align:left;font-size:10px;vertical-align:middle}th{background:#f7faf8;color:#7a867f;font-size:8px;text-transform:uppercase;letter-spacing:.8px}td strong,td small{display:block}td small{margin-top:3px;color:#9aa49e;font-size:8px}.status{display:inline-block;padding:5px 8px;border-radius:999px;font-size:8px;font-weight:850;background:#eef3ef;color:#53635a}.status.pending{background:#fff7df;color:#96720b}.status.approved{background:#eaf6ee;color:#075f2b}.status.rejected,.status.suspended{background:#fff0f0;color:#a00000}.view{padding:7px 10px}.error,.state{margin:12px 0;padding:14px;border-radius:11px;border:1px solid #dce6df;background:#fff;text-align:center;font-size:10px}.error{border-color:#efd0d0;background:#fff5f5;color:#a00000}.backdrop{position:fixed;inset:0;z-index:2000;display:grid;place-items:center;padding:18px;background:rgba(0,35,19,.45)}.modal{position:relative;width:min(100%,650px);max-height:90vh;overflow:auto;box-sizing:border-box;padding:24px;border-radius:18px;background:#fff;box-shadow:0 24px 60px rgba(0,0,0,.25)}.close{position:absolute;right:14px;top:12px;border:0;background:transparent;color:#075f2b;font-size:27px;cursor:pointer}.modal h3{margin:5px 0 0;color:#075f2b;font-size:24px}.muted{margin:3px 0 18px;color:#87928b;font-size:10px}.details{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.detail{padding:10px;border:1px solid #e3ebe5;border-radius:10px;background:#f8faf9}.detail span{display:block;color:#8a958f;font-size:8px}.detail strong{display:block;margin-top:3px;color:#334138;font-size:10px;overflow-wrap:anywhere}.actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}.actions .danger{background:#a00000}.actions .secondary{background:#fff;color:#526058}@media(max-width:850px){.stats{grid-template-columns:repeat(2,1fr)}.toolbar{grid-template-columns:1fr}.hero{display:block}.refresh{margin-top:12px}}@media(max-width:520px){.stats{grid-template-columns:1fr}.details{grid-template-columns:1fr}}
`;
