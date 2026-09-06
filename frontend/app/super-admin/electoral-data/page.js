"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const token = () => typeof window === "undefined" ? "" : ["polisync_token", "authToken", "accessToken", "token"].map((key) => localStorage.getItem(key)).find(Boolean) || "";

async function getIntegrity() {
  const currentToken = token();
  const response = await fetch(`${API_URL}/api/electoral-geography/integrity`, { cache: "no-store", headers: { Accept: "application/json", ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.message || `Integrity check failed (${response.status})`);
  return body?.data || body;
}

const fmt = (value) => Number.isFinite(Number(value)) ? Number(value).toLocaleString() : "—";
const label = (value) => String(value || "").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function ElectoralDataHealthCenter() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState({});

  const load = useCallback(async (manual = false) => {
    manual ? setRefreshing(true) : setLoading(true);
    setError("");
    try { setReport(await getIntegrity()); }
    catch (err) { setError(err.message || "Unable to load electoral data health."); }
    finally { manual ? setRefreshing(false) : setLoading(false); }
  }, []);

  useEffect(() => { load(false); }, [load]);

  const counts = useMemo(() => ({
    regions: report?.counts?.regions ?? report?.regionCount ?? 0,
    constituencies: report?.counts?.constituencies ?? report?.constituencyCount ?? 0,
    pollingStations: report?.counts?.pollingStations ?? report?.pollingStationCount ?? 0,
  }), [report]);

  const issues = Array.isArray(report?.issues) ? report.issues : [];
  const issueGroups = useMemo(() => {
    const groups = {};
    issues.forEach((issue) => {
      const key = issue.type || issue.code || issue.kind || "other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(issue);
    });
    return groups;
  }, [issues]);
  const healthy = report?.healthy === true && issues.length === 0;
  const checkedAt = report?.checkedAt ? new Date(report.checkedAt) : null;

  return (
    <DashboardShell role="super_admin" title="Electoral Data Health Center" subtitle="Integrity, hierarchy and synchronization oversight" activeSection="electoral-data">
      <main className="health-page">
        <section className="hero">
          <div><span className="eyebrow">SUPER ADMIN · ELECTORAL DATA</span><h1>Electoral Data Health Center</h1><p>Verify Ghana's electoral geography hierarchy and identify data integrity problems before they affect elections, polling stations or field operations.</p></div>
          <button className="refresh" onClick={() => load(true)} disabled={refreshing}>{refreshing ? "Checking…" : "↻ Refresh Integrity Check"}</button>
        </section>

        {error && <div className="error-banner"><strong>Health check unavailable</strong><span>{error}</span><button onClick={() => load(true)}>Retry</button></div>}

        <section className="status-card">
          <div className={`health-icon ${healthy ? "ok" : "warn"}`}>{healthy ? "✓" : "!"}</div>
          <div className="status-copy"><span>OVERALL INTEGRITY STATUS</span><strong>{loading ? "Checking electoral data…" : healthy ? "Healthy" : "Needs Review"}</strong><p>{loading ? "Running hierarchy and consistency checks." : healthy ? "The current active electoral geography passed all checks." : `${issues.length.toLocaleString()} issue${issues.length === 1 ? "" : "s"} require attention.`}</p></div>
          <div className="checked"><span>Last checked</span><strong>{checkedAt && !Number.isNaN(checkedAt.getTime()) ? checkedAt.toLocaleString() : "—"}</strong></div>
        </section>

        <section className="metric-grid">
          <Metric icon="◇" value={counts.regions} label="Active Regions" note="Expected Ghana coverage: 16" ok={counts.regions === 16}/>
          <Metric icon="▣" value={counts.constituencies} label="Active Constituencies" note="Current hierarchy records"/>
          <Metric icon="●" value={counts.pollingStations} label="Active Polling Stations" note="Current station records"/>
          <Metric icon="⚠" value={issues.length} label="Integrity Issues" note={issues.length ? "Requires review" : "No detected issues"} ok={!issues.length}/>
        </section>

        <section className="content-grid">
          <article className="panel"><Header icon="⌁" title="Integrity Checks"/><div className="check-list">
            <Check name="16-region coverage" pass={counts.regions === 16} detail={counts.regions === 16 ? "All expected regions are present." : `${counts.regions} active regions detected.`}/>
            <Check name="Orphan constituencies" pass={!hasIssue(issueGroups, ["orphan_constituency", "orphanConstituency"])} detail="Every constituency should belong to an active region."/>
            <Check name="Orphan polling stations" pass={!hasIssue(issueGroups, ["orphan_polling_station", "orphanPollingStation"])} detail="Every station should have active geographic parents."/>
            <Check name="Duplicate constituency names" pass={!hasIssue(issueGroups, ["duplicate_constituency", "duplicateConstituency"])} detail="Duplicate groups are flagged within a region."/>
            <Check name="Duplicate polling-station codes" pass={!hasIssue(issueGroups, ["duplicate_polling_station_code", "duplicatePollingStationCode"])} detail="EC station codes should be unique."/>
            <Check name="Parent hierarchy consistency" pass={!hasIssue(issueGroups, ["region_parent_mismatch", "station_parent_mismatch", "parent_mismatch", "regionConstituencyMismatch"])} detail="Station, constituency and region relationships are checked."/>
          </div></article>

          <article className="panel"><Header icon="⇄" title="Data Coverage"/><div className="coverage"><CoverageRow label="Regions" value={counts.regions} expected={16}/><CoverageRow label="Constituencies" value={counts.constituencies}/><CoverageRow label="Polling Stations" value={counts.pollingStations}/></div><div className="action-row"><a href="/super-admin/geography">Geographic Data →</a><a href="/super-admin/polling-stations">Polling Stations →</a><a href="/super-admin/elections">Election Management →</a></div></article>
        </section>

        <section className="panel issues-panel"><Header icon="⚠" title="Detected Problems" badge={issues.length}/>
          {!issues.length ? <div className="empty-state"><span>✓</span><strong>No integrity problems detected</strong><p>The current active Region → Constituency → Polling Station hierarchy passed the available checks.</p></div> : <div className="issue-groups">{Object.entries(issueGroups).map(([type, items]) => <div className="issue-group" key={type}><button className="issue-head" onClick={() => setExpanded((v) => ({ ...v, [type]: !v[type] }))}><div><strong>{label(type)}</strong><span>{items.length} record{items.length === 1 ? "" : "s"}</span></div><b>{expanded[type] ? "−" : "+"}</b></button>{expanded[type] && <div className="issue-body">{items.slice(0, 100).map((item, index) => <div className="issue-item" key={item.id || item._id || index}><strong>{item.message || item.name || item.code || item.stationCode || "Integrity exception"}</strong><small>{item.regionName || item.constituencyName || item.stationName || item.details || JSON.stringify(item)}</small></div>)}{items.length > 100 && <p className="limit">Showing the first 100 records in this issue group.</p>}</div>}</div>)}</div>}
        </section>

        <section className="footer-note"><strong>Integrity before operations.</strong><span>This center is read-only: it reports problems without silently modifying electoral records.</span></section>
      </main>
      <style jsx>{styles}</style>
    </DashboardShell>
  );
}

function Metric({ icon, value, label, note, ok }) { return <article className="metric"><span className="metric-icon">{icon}</span><div><strong>{fmt(value)}</strong><span>{label}</span><small className={ok === true ? "positive" : ok === false ? "negative" : ""}>{note}</small></div></article>; }
function Header({ icon, title, badge }) { return <div className="section-header"><div><span>{icon}</span><h2>{title}</h2></div>{badge != null && <b>{badge}</b>}</div>; }
function Check({ name, pass, detail }) { return <div className="check"><span className={pass ? "check-ok" : "check-warn"}>{pass ? "✓" : "!"}</span><div><strong>{name}</strong><small>{detail}</small></div><em>{pass ? "Passed" : "Review"}</em></div>; }
function CoverageRow({ label, value, expected }) { const pct = expected ? Math.min(100, Math.round((Number(value) / expected) * 100)) : Number(value) > 0 ? 100 : 0; return <div className="coverage-row"><div><strong>{label}</strong><span>{fmt(value)}{expected ? ` / ${fmt(expected)}` : " records"}</span></div><div className="bar"><i style={{ width: `${pct}%` }}/></div></div>; }
function hasIssue(groups, keys) { return keys.some((key) => Array.isArray(groups[key]) && groups[key].length); }

const styles = `
.health-page{min-height:100%;padding:24px 26px 32px;background:#f4f7f5;color:#14251c;box-sizing:border-box}.hero{display:flex;justify-content:space-between;align-items:center;gap:24px;padding:28px 30px;border-radius:20px;background:linear-gradient(110deg,#004d28,#006d39 58%,#073d26);color:#fff;box-shadow:0 12px 30px rgba(0,64,34,.14)}.eyebrow{font-size:10px;font-weight:850;letter-spacing:2px;color:#e9ca5b}.hero h1{margin:9px 0 7px;font-size:32px;letter-spacing:-.7px}.hero p{margin:0;max-width:760px;color:rgba(255,255,255,.78);line-height:1.55;font-size:14px}.refresh{border:1px solid rgba(255,255,255,.3);background:#fff;color:#064a29;padding:12px 16px;border-radius:10px;font-weight:800;white-space:nowrap;cursor:pointer}.refresh:disabled{opacity:.65;cursor:wait}.error-banner{margin-top:16px;padding:15px 18px;border-radius:13px;background:#fff0ef;border:1px solid #efc8c4;display:flex;align-items:center;gap:12px;flex-wrap:wrap}.error-banner strong{color:#9d3027}.error-banner span{flex:1;color:#6d514d}.error-banner button{border:0;background:#9d3027;color:#fff;padding:8px 12px;border-radius:8px;font-weight:700}.status-card{margin-top:18px;background:#fff;border:1px solid #dfe8e2;border-radius:16px;padding:18px 20px;display:flex;align-items:center;gap:16px;box-shadow:0 5px 16px rgba(19,51,35,.05)}.health-icon{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;font-size:23px;font-weight:900}.health-icon.ok{background:#e5f5eb;color:#08713a}.health-icon.warn{background:#fff0dc;color:#a85c08}.status-copy{flex:1}.status-copy span,.checked span{display:block;font-size:9px;font-weight:850;letter-spacing:1.4px;color:#789084}.status-copy strong{display:block;margin:3px 0;font-size:22px}.status-copy p{margin:0;color:#6c7d74;font-size:12px}.checked{text-align:right}.checked strong{display:block;margin-top:4px;font-size:12px;color:#33483d}.metric-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:16px}.metric{background:#fff;border:1px solid #dfe8e2;border-radius:15px;padding:17px;display:flex;align-items:flex-start;gap:13px}.metric-icon{width:38px;height:38px;border-radius:11px;background:#eaf5ee;color:#006d39;display:grid;place-items:center;font-size:18px;font-weight:800}.metric strong{display:block;font-size:25px;letter-spacing:-.4px}.metric div>span{display:block;font-size:12px;font-weight:750;color:#33483d;margin-top:1px}.metric small{display:block;color:#819188;font-size:10px;margin-top:5px}.positive{color:#08713a!important}.negative{color:#b33b2f!important}.content-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:16px;margin-top:16px}.panel{background:#fff;border:1px solid #dfe8e2;border-radius:16px;padding:20px;box-shadow:0 5px 16px rgba(19,51,35,.04)}.section-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}.section-header>div{display:flex;align-items:center;gap:9px}.section-header>div>span{color:#08713a;font-size:18px}.section-header h2{margin:0;font-size:16px}.section-header>b{min-width:25px;height:25px;border-radius:50%;display:grid;place-items:center;background:#fff0dc;color:#a85c08;font-size:11px}.check-list{display:grid;gap:2px}.check{display:flex;align-items:center;gap:11px;padding:11px 4px;border-bottom:1px solid #edf2ee}.check:last-child{border-bottom:0}.check>span{width:27px;height:27px;border-radius:8px;display:grid;place-items:center;font-weight:900;font-size:12px}.check-ok{background:#e6f5eb;color:#08713a}.check-warn{background:#fff0dc;color:#a85c08}.check div{flex:1}.check strong{display:block;font-size:12px}.check small{display:block;margin-top:3px;color:#839087;font-size:10px}.check em{font-style:normal;font-size:10px;font-weight:800;color:#08713a}.check:has(.check-warn) em{color:#a85c08}.coverage{display:grid;gap:18px;padding:5px 0 16px}.coverage-row>div:first-child{display:flex;justify-content:space-between;gap:12px;margin-bottom:7px}.coverage-row strong{font-size:12px}.coverage-row span{font-size:11px;color:#7a8b82}.bar{height:8px;background:#e8eeea;border-radius:99px;overflow:hidden}.bar i{display:block;height:100%;background:#08713a;border-radius:99px}.action-row{display:flex;gap:8px;flex-wrap:wrap;border-top:1px solid #edf2ee;padding-top:14px}.action-row a{font-size:10px;font-weight:800;color:#08713a;text-decoration:none;background:#eef7f1;border-radius:8px;padding:9px 10px}.issues-panel{margin-top:16px}.issue-groups{display:grid;gap:8px}.issue-group{border:1px solid #eadfda;border-radius:11px;overflow:hidden}.issue-head{width:100%;display:flex;justify-content:space-between;align-items:center;border:0;background:#fffaf8;padding:13px 15px;text-align:left;cursor:pointer}.issue-head div{display:flex;align-items:center;gap:10px}.issue-head strong{font-size:12px}.issue-head span{font-size:10px;color:#9a756b}.issue-head b{font-size:18px;color:#a85c08}.issue-body{background:#fff;padding:3px 15px 10px}.issue-item{padding:10px 0;border-bottom:1px solid #f0e8e5}.issue-item:last-child{border-bottom:0}.issue-item strong{display:block;font-size:11px}.issue-item small{display:block;margin-top:3px;color:#7e8882;font-size:10px;overflow-wrap:anywhere}.limit{font-size:10px;color:#9a756b}.empty-state{text-align:center;padding:34px 12px}.empty-state>span{display:grid;place-items:center;width:45px;height:45px;margin:0 auto 10px;border-radius:50%;background:#e6f5eb;color:#08713a;font-weight:900;font-size:21px}.empty-state strong{display:block;font-size:14px}.empty-state p{margin:5px auto 0;max-width:520px;color:#819087;font-size:11px;line-height:1.5}.footer-note{display:flex;gap:7px;justify-content:center;align-items:center;margin:17px 0 0;color:#829087;font-size:10px;text-align:center}.footer-note strong{color:#365447}@media(max-width:1000px){.metric-grid{grid-template-columns:repeat(2,1fr)}.content-grid{grid-template-columns:1fr}.hero{align-items:flex-start;flex-direction:column}.refresh{width:100%}}@media(max-width:640px){.health-page{padding:14px 12px 24px}.hero{padding:20px 18px;border-radius:15px}.hero h1{font-size:24px}.hero p{font-size:12px}.status-card{align-items:flex-start;padding:15px;flex-wrap:wrap}.status-copy strong{font-size:19px}.checked{text-align:left;width:100%;padding-left:64px}.metric-grid{grid-template-columns:1fr 1fr;gap:9px}.metric{padding:13px;gap:9px}.metric-icon{width:32px;height:32px;font-size:14px}.metric strong{font-size:20px}.metric div>span{font-size:10px}.metric small{font-size:9px}.panel{padding:15px;border-radius:13px}.check{gap:8px}.check em{display:none}.action-row a{flex:1;text-align:center}.footer-note{display:block;line-height:1.5}}
`;
