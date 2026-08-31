"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../../../../components/dashboard/DashboardShell";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || localStorage.getItem("authToken") || localStorage.getItem("accessToken") || "";
}

export default function OrganizationalResultsHistory() {
  const [data, setData] = useState({ filters: { organizations: [], elections: [], electionTypes: [] }, history: [] });
  const [organizationId, setOrganizationId] = useState("all");
  const [electionType, setElectionType] = useState("all");
  const [electionId, setElectionId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ organizationId, electionType, electionId });
        const token = getToken();
        const response = await fetch(`${API_URL}/api/results/dashboard?${params.toString()}`, {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}`, Accept: "application/json" } : { Accept: "application/json" },
        });
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json.message || "Unable to load results history.");
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load results history.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [organizationId, electionType, electionId]);

  const elections = useMemo(() => {
    const all = data.filters?.elections || [];
    if (electionType === "all") return all;
    return all.filter((election) => election.type === electionType);
  }, [data.filters, electionType]);

  useEffect(() => {
    if (electionId !== "all" && !elections.some((election) => String(election._id) === electionId)) setElectionId("all");
  }, [elections, electionId]);

  return (
    <DashboardShell role="super_admin" title="Results History" subtitle="All organizational election results and historical records" activeSection="results-history">
      <main className="history-page">
        <section className="history-hero">
          <div>
            <span>POLISYNC RESULTS CENTER</span>
            <h2>Organizational Election Results History</h2>
            <p>Review historical results by organization and election type. Results are loaded from the platform database; no geography or party list is hardcoded here.</p>
          </div>
          <div className="history-mark">▥</div>
        </section>

        <section className="filters" aria-label="Results history filters">
          <label>
            <span>Organization</span>
            <select value={organizationId} onChange={(event) => setOrganizationId(event.target.value)}>
              <option value="all">All organizations</option>
              {(data.filters?.organizations || []).map((organization) => <option key={organization._id} value={organization._id}>{organization.name}</option>)}
            </select>
          </label>
          <label>
            <span>Election type</span>
            <select value={electionType} onChange={(event) => setElectionType(event.target.value)}>
              <option value="all">All election types</option>
              {(data.filters?.electionTypes || []).map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label>
            <span>Election</span>
            <select value={electionId} onChange={(event) => setElectionId(event.target.value)}>
              <option value="all">All elections</option>
              {elections.map((election) => <option key={election._id} value={election._id}>{election.name}{election.year ? ` • ${election.year}` : ""}</option>)}
            </select>
          </label>
        </section>

        {loading && <div className="state-card">Loading organizational results history…</div>}
        {!loading && error && <div className="state-card error">{error}</div>}
        {!loading && !error && (data.history || []).length === 0 && <div className="state-card">No organizational election results match the selected filters.</div>}

        {!loading && !error && (data.history || []).length > 0 && (
          <section className="history-grid" aria-label="Organizational election results history">
            {data.history.map((item) => {
              const organization = item.organization;
              const election = item.election;
              const candidateEntries = Object.entries(item.candidates || {}).sort((a, b) => b[1] - a[1]);
              return (
                <article className="history-card" key={`${item.organizationId || "unassigned"}-${item.electionId}`}>
                  <div className="history-card-top">
                    <div>
                      <small>{organization?.organizationType || "ORGANIZATION"}</small>
                      <h3>{organization?.name || "Unassigned organization"}</h3>
                      <p>{election?.name || "Election"}{election?.year ? ` • ${election.year}` : ""}</p>
                    </div>
                    <span className="status">{item.verified ? "Verified" : "Recorded"}</span>
                  </div>
                  <div className="metrics">
                    <div><strong>{item.submittedStations}</strong><span>Stations</span></div>
                    <div><strong>{item.validVotes}</strong><span>Valid votes</span></div>
                    <div><strong>{item.verified}</strong><span>Verified</span></div>
                    <div><strong>{item.pending}</strong><span>Pending</span></div>
                  </div>
                  <div className="candidate-list">
                    <div className="candidate-heading">Candidate totals</div>
                    {candidateEntries.slice(0, 6).map(([candidate, votes]) => (
                      <div className="candidate-row" key={candidate}><span>{candidate}</span><strong>{votes}</strong></div>
                    ))}
                    {candidateEntries.length === 0 && <div className="empty-line">No candidate totals recorded.</div>}
                  </div>
                  <footer>Last submitted: {item.lastSubmittedAt ? new Date(item.lastSubmittedAt).toLocaleString() : "Not available"}</footer>
                </article>
              );
            })}
          </section>
        )}
      </main>

      <style jsx>{styles}</style>
    </DashboardShell>
  );
}

const styles = `
.history-page{min-height:100%;box-sizing:border-box;padding:clamp(16px,2.5vw,34px);background:radial-gradient(circle at 12% 0%,rgba(18,120,65,.24),transparent 30%),#002d18;color:#fff;overflow-x:hidden}.history-hero{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:22px}.history-hero span{font-size:10px;font-weight:900;letter-spacing:2px;color:#fff}.history-hero h2{margin:7px 0;color:#fff;font-size:clamp(27px,3.2vw,43px);line-height:1.05}.history-hero p{max-width:760px;margin:0;color:#fff;font-size:14px;line-height:1.55}.history-mark{width:76px;height:76px;display:grid;place-items:center;border:2px solid #f0c94f;border-radius:50%;color:#f0c94f;font-size:35px;flex:0 0 76px}.filters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:20px;padding:14px;border:1px solid rgba(240,201,79,.35);border-radius:18px;background:rgba(0,43,24,.75)}.filters label{min-width:0}.filters label span{display:block;margin:0 0 6px;color:#fff;font-size:11px;font-weight:800}.filters select{width:100%;min-height:46px;border:1px solid #f0c94f;border-radius:12px;padding:0 12px;background:#f0c94f;color:#002d18;font:700 13px inherit;outline:none}.history-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.history-card{min-width:0;border:2px solid #f0c94f;border-radius:22px;background:linear-gradient(145deg,#063f23,#002d18);padding:20px;box-shadow:0 12px 28px rgba(0,0,0,.18)}.history-card-top{display:flex;justify-content:space-between;gap:12px}.history-card-top small{color:#f0c94f;font-size:9px;font-weight:900;letter-spacing:1.5px}.history-card h3{margin:5px 0 3px;color:#fff;font-size:22px}.history-card-top p{margin:0;color:#fff;font-size:13px}.status{height:max-content;padding:6px 9px;border:1px solid rgba(240,201,79,.55);border-radius:999px;color:#fff;font-size:9px;font-weight:800}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:18px 0;padding:10px 0;border-top:1px solid rgba(255,255,255,.1);border-bottom:1px solid rgba(255,255,255,.1)}.metrics div{text-align:center}.metrics strong{display:block;color:#fff;font-size:20px}.metrics span{display:block;margin-top:3px;color:#fff;font-size:9px}.candidate-heading{margin-bottom:7px;color:#f0c94f;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:1px}.candidate-row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.07);color:#fff;font-size:12px}.candidate-row strong{color:#fff}.empty-line{color:#fff;font-size:11px;padding:8px 0}.history-card footer{margin-top:12px;color:#fff;font-size:10px}.state-card{padding:28px;border:1px solid rgba(240,201,79,.35);border-radius:18px;background:rgba(0,43,24,.75);color:#fff;text-align:center}.state-card.error{border-color:#d66;background:rgba(80,0,0,.2)}
@media(max-width:760px){.history-page{padding:14px}.history-hero{align-items:flex-start}.history-mark{width:52px;height:52px;flex-basis:52px;font-size:25px}.filters,.history-grid{grid-template-columns:1fr}.filters{padding:12px}.history-card{padding:17px}.metrics strong{font-size:17px}.history-hero h2{font-size:27px}.history-hero p{font-size:12px}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
`;
