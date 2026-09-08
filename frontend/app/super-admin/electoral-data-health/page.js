"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import superAdminNavigation from "../../../components/dashboard/superAdminNavigation";

const getToken = () => typeof window === "undefined" ? "" : ["polisync_token", "authToken", "accessToken", "token"].map((key) => localStorage.getItem(key) || sessionStorage.getItem(key)).find(Boolean) || "";
const fmt = (value) => Number(value || 0).toLocaleString();

async function loadHealth() {
  const authToken = getToken();
  const response = await fetch("/api/electoral-geography/integrity", {
    cache: "no-store",
    headers: { Accept: "application/json", ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success !== true) throw new Error(body.message || `Integrity check failed (${response.status}).`);
  return body.data || {};
}

const findingGroups = [
  ["orphanConstituencies", "Orphan Constituencies", "Active constituencies whose region is missing or inactive."],
  ["orphanPollingStations", "Orphan Polling Stations", "Active polling stations whose region or constituency is missing or inactive."],
  ["duplicateConstituencyGroups", "Duplicate Constituency Groups", "Same constituency names repeated within a region."],
  ["duplicateStationGroups", "Duplicate Polling-Station Codes", "EC polling-station codes that appear more than once."],
  ["inconsistentStationParents", "Parent Hierarchy Mismatches", "Polling stations whose region does not match their constituency's region."],
];

export default function ElectoralDataHealthPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState({});

  const refresh = useCallback(async (manual = false) => {
    manual ? setRefreshing(true) : setLoading(true);
    setError("");
    try { setReport(await loadHealth()); }
    catch (e) { setError(e.message || "Unable to load electoral data health."); }
    finally { manual ? setRefreshing(false) : setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const counts = report?.counts || {};
  const details = report?.details || {};
  const regionalCoverage = report?.coverage?.regionalConstituencies || [];
  const regionalIssues = regionalCoverage.filter((row) => row.complete === false);
  const issueCounts = useMemo(() => findingGroups.map(([key, name, description]) => ({ key, name, description, items: Array.isArray(details[key]) ? details[key] : [] })), [details]);
  const detailedFindings = issueCounts.reduce((sum, group) => sum + group.items.length, 0) + regionalIssues.length;
  const healthy = report?.healthy === true;

  return (
    <DashboardShell role="super_admin" navigation={superAdminNavigation} activeSection="electoral-data" title="Electoral Data Health" subtitle="Electoral geography integrity and data quality">
      <main className="page">
        <section className="hero">
          <div><span>SUPER ADMIN • ELECTORAL DATA GOVERNANCE</span><h1>Electoral Data Health Center</h1><p>Validate Ghana's live Region → Constituency → Polling Station hierarchy against the national 16-region and 276-constituency structure.</p></div>
          <button type="button" onClick={() => refresh(true)} disabled={loading || refreshing}>{refreshing ? "Checking…" : "↻ Run Integrity Check"}</button>
        </section>

        {error && <div className="error"><strong>Unable to complete health check</strong><span>{error}</span><button type="button" onClick={() => refresh(true)}>Retry</button></div>}

        <section className={`status ${healthy ? "ok" : "attention"}`}>
          <div className="status-mark">{healthy ? "✓" : "!"}</div>
          <div className="status-copy"><span>OVERALL DATA HEALTH</span><strong>{loading ? "Checking…" : healthy ? "Healthy" : "Needs Review"}</strong><p>{loading ? "Checking active electoral records and relationships." : healthy ? "All structural and coverage checks passed." : `${fmt(detailedFindings)} findings require review.`}</p></div>
          <div className="last"><span>LAST CHECK</span><strong>{formatDate(report?.checkedAt)}</strong></div>
        </section>

        <section className="metrics">
          <Metric label="Active Regions" value={counts.regions} note={`Expected ${fmt(counts.expectedRegions || 16)}`} good={Number(counts.regions) === Number(counts.expectedRegions || 16)} />
          <Metric label="Active Constituencies" value={counts.constituencies} note={`Expected ${fmt(counts.expectedConstituencies || 276)}`} good={Number(counts.constituencies) === Number(counts.expectedConstituencies || 276)} />
          <Metric label="Active Polling Stations" value={counts.pollingStations} note="Live hierarchy records" good={Number(counts.pollingStations) > 0} />
          <Metric label="Findings" value={detailedFindings} note={detailedFindings ? "Review required" : "No findings"} good={!detailedFindings} />
        </section>

        <section className="grid">
          <article className="panel"><Header title="Core Integrity Checks" />
            <Check title="16-region coverage" pass={Number(counts.regions) === Number(counts.expectedRegions || 16)} detail={`${fmt(counts.regions)} active regions found.`} />
            <Check title="276-constituency national coverage" pass={Number(counts.constituencies) === Number(counts.expectedConstituencies || 276)} detail={`${fmt(counts.constituencies)} active constituencies found.`} />
            <Check title="Constituencies by region" pass={!regionalIssues.length} detail={regionalIssues.length ? `${regionalIssues.length} region(s) do not match the expected constituency count.` : "All 16 regions match their expected constituency totals."} />
            <Check title="Orphan constituencies" pass={!details.orphanConstituencies?.length} detail={`${fmt(details.orphanConstituencies?.length)} orphan records.`} />
            <Check title="Orphan polling stations" pass={!details.orphanPollingStations?.length} detail={`${fmt(details.orphanPollingStations?.length)} orphan records.`} />
            <Check title="Parent hierarchy consistency" pass={!details.inconsistentStationParents?.length} detail={`${fmt(details.inconsistentStationParents?.length)} mismatched station parents.`} />
            <Check title="Duplicate constituency groups" pass={!details.duplicateConstituencyGroups?.length} detail={`${fmt(details.duplicateConstituencyGroups?.length)} duplicate groups.`} />
            <Check title="Duplicate polling-station codes" pass={!details.duplicateStationGroups?.length} detail={`${fmt(details.duplicateStationGroups?.length)} duplicate groups.`} />
          </article>

          <article className="panel"><Header title="National Coverage" />
            <Coverage label="Regions" value={counts.regions} expected={counts.expectedRegions || 16} />
            <Coverage label="Constituencies" value={counts.constituencies} expected={counts.expectedConstituencies || 276} />
            <Coverage label="Polling Stations" value={counts.pollingStations} />
            <div className="links"><a href="/super-admin/geography">Geographic Data</a><a href="/super-admin/electoral-data-health/regions">Regional Health Matrix</a><a href="/super-admin/electoral-data-health/sync">Data Synchronization</a></div>
          </article>
        </section>

        <section className="panel regional"><Header title="Constituency Coverage by Region" badge={regionalIssues.length} />
          <div className="region-table"><div className="region-row head"><span>Region</span><span>Expected</span><span>Actual</span><span>Gap</span><span>Status</span></div>{regionalCoverage.map((row) => <div className="region-row" key={String(row.regionId)}><strong>{row.regionNumber ? `${row.regionNumber}. ` : ""}{row.name}</strong><span>{row.expectedConstituencies ?? "—"}</span><span>{row.actualConstituencies}</span><span className={row.constituencyGap ? "bad" : "good"}>{row.constituencyGap > 0 ? "+" : ""}{row.constituencyGap ?? "—"}</span><b className={row.complete ? "good-badge" : "bad-badge"}>{row.complete ? "Healthy" : "Needs Review"}</b></div>)}</div>
        </section>

        <section className="panel findings"><Header title="Detailed Findings" badge={detailedFindings} />
          {regionalIssues.length > 0 && <article className="finding"><div className="finding-title"><div><strong>Regional constituency coverage gaps</strong><span>Each affected region must match its expected constituency total.</span></div><b className="bad-count">{regionalIssues.length}</b></div><div className="details">{regionalIssues.map((row) => <div className="detail" key={String(row.regionId)}><strong>{row.name}</strong><span>Expected {row.expectedConstituencies}; found {row.actualConstituencies}.</span></div>)}</div></article>}
          {issueCounts.map((group) => <FindingGroup key={group.key} {...group} expanded={!!open[group.key]} onToggle={() => setOpen((state) => ({ ...state, [group.key]: !state[group.key] }))} />)}
        </section>
        <p className="foot"><strong>Read-only validation.</strong> No electoral records are changed by this health check.</p>
      </main>
      <style jsx>{styles}</style>
    </DashboardShell>
  );
}

function Metric({ label, value, note, good }) { return <article className="metric"><strong>{fmt(value)}</strong><span>{label}</span><small className={good ? "good" : "bad"}>{note}</small></article>; }
function Header({ title, badge }) { return <header className="header"><div><span>POLISYNC AFRICA</span><h2>{title}</h2></div>{badge !== undefined && <b>{fmt(badge)}</b>}</header>; }
function Check({ title, pass, detail }) { return <div className="check"><i className={pass ? "pass" : "warn"}>{pass ? "✓" : "!"}</i><div><strong>{title}</strong><small>{detail}</small></div><em className={pass ? "good" : "bad"}>{pass ? "Passed" : "Review"}</em></div>; }
function Coverage({ label, value, expected }) { const n = Number(value || 0); const pct = expected ? Math.min(100, Math.round((n / expected) * 100)) : n ? 100 : 0; return <div className="coverage"><div><strong>{label}</strong><span>{fmt(n)}{expected ? ` / ${fmt(expected)}` : " records"}</span></div><div className="bar"><i style={{ width: `${pct}%` }} /></div></div>; }
function FindingGroup({ name, description, items, expanded, onToggle }) { return <article className="finding"><button type="button" onClick={onToggle}><div><strong>{name}</strong><span>{description}</span></div><b className={items.length ? "bad-count" : "good-count"}>{fmt(items.length)}</b><i>{expanded ? "−" : "+"}</i></button>{expanded && <div className="details">{items.length ? items.slice(0, 100).map((item, index) => <FindingItem key={item.id || item._id || item.code || index} item={item} />) : <div className="clear">✓ No records detected in this category.</div>}{items.length > 100 && <small className="limit">Showing 100 of {fmt(items.length)} records.</small>}</div>}</article>; }
function FindingItem({ item }) { if (item.records) return <div className="detail"><strong>{item.code || item.records?.[0]?.name || "Duplicate group"}</strong><span>{fmt(item.records.length)} records in this duplicate group.</span></div>; return <div className="detail"><strong>{item.name || item.code || item.id || "Electoral record"}</strong><span>{item.reason || (item.constituencyId ? `Constituency: ${item.constituencyId}` : "Parent relationship requires review.")}</span></div>; }
function formatDate(value) { if (!value) return "Not available"; const d = new Date(value); return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }); }

const styles = `.page{min-height:100%;box-sizing:border-box;padding:clamp(14px,2.5vw,30px);background:#f4f7f5;color:#203128}.hero{display:flex;align-items:center;justify-content:space-between;gap:22px;padding:27px 29px;border-radius:20px;background:linear-gradient(115deg,#004d28,#006b38 60%,#073d26);color:#fff}.hero span,.header span{font-size:9px;font-weight:900;letter-spacing:1.5px;color:#dfc15b}.hero h1{margin:7px 0;font-size:clamp(25px,3vw,34px);letter-spacing:-.6px}.hero p{max-width:790px;margin:0;color:rgba(255,255,255,.78);font-size:13px;line-height:1.6}.hero button{min-height:44px;padding:10px 16px;border:0;border-radius:10px;background:#fff;color:#075d31;font-weight:850;cursor:pointer;white-space:nowrap}.hero button:disabled{opacity:.6}.error{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:14px;padding:13px 15px;border:1px solid #efc8c4;border-radius:12px;background:#fff4f3;color:#81352e;font-size:11px}.error span{flex:1}.error button{border:0;border-radius:8px;padding:7px 10px;background:#9d332b;color:#fff;font-weight:800}.status{display:flex;align-items:center;gap:14px;margin-top:14px;padding:17px;border:1px solid #dbe6df;border-radius:15px;background:#fff}.status-mark{width:47px;height:47px;display:grid;place-items:center;border-radius:13px;font-size:22px;font-weight:900}.ok .status-mark{background:#e4f5ea;color:#08713a}.attention .status-mark{background:#fff0dc;color:#a45d08}.status-copy{flex:1}.status-copy span,.last span{font-size:9px;font-weight:900;letter-spacing:1.2px;color:#819087}.status-copy strong{display:block;margin:3px 0;font-size:22px;color:#08713a}.attention .status-copy strong{color:#a45d08}.status-copy p{margin:0;color:#748178;font-size:11px}.last{text-align:right}.last strong{display:block;margin-top:4px;color:#34463d;font-size:11px}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin-top:14px}.metric{padding:16px;border:1px solid #dbe6df;border-radius:14px;background:#fff}.metric strong{display:block;color:#075f2b;font-size:25px}.metric span{display:block;margin-top:2px;color:#35473e;font-size:11px;font-weight:800}.metric small{display:block;margin-top:5px;font-size:9px}.good{color:#08713a!important}.bad{color:#a45d08!important}.grid{display:grid;grid-template-columns:1.1fr .9fr;gap:14px;margin-top:14px}.panel{border:1px solid #dbe6df;border-radius:15px;background:#fff;overflow:hidden;margin-top:14px}.grid .panel{margin-top:0}.header{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid #edf2ee;background:#f9fbfa}.header h2{margin:4px 0 0;color:#075f2b;font-size:17px}.header>b{min-width:25px;height:25px;display:grid;place-items:center;border-radius:50%;background:#fff0dc;color:#a45d08;font-size:10px}.check{display:flex;align-items:center;gap:10px;margin:0 17px;padding:11px 0;border-bottom:1px solid #edf2ee}.check:last-child{border-bottom:0}.check>i{width:27px;height:27px;display:grid;place-items:center;border-radius:8px;font-style:normal;font-weight:900}.check .pass{background:#e5f5eb;color:#08713a}.check .warn{background:#fff0dc;color:#a45d08}.check div{flex:1}.check strong{display:block;font-size:11px}.check small{display:block;margin-top:3px;color:#89948e;font-size:9px;line-height:1.35}.check em{font-style:normal;font-size:9px;font-weight:900}.coverage{padding:14px 18px 0}.coverage>div:first-child{display:flex;justify-content:space-between;margin-bottom:6px}.coverage strong{font-size:11px}.coverage span{font-size:10px;color:#829088}.bar{height:7px;margin-bottom:15px;border-radius:99px;background:#e8efeb;overflow:hidden}.bar i{display:block;height:100%;border-radius:99px;background:#08713a}.links{display:flex;gap:7px;flex-wrap:wrap;padding:14px 18px;border-top:1px solid #edf2ee}.links a{padding:8px 9px;border-radius:8px;background:#eef7f1;color:#075f2b;text-decoration:none;font-size:9px;font-weight:850}.region-table{overflow-x:auto}.region-row{display:grid;grid-template-columns:minmax(180px,1.6fr) 90px 90px 70px 120px;gap:10px;align-items:center;min-width:620px;padding:10px 17px;border-bottom:1px solid #edf2ee;font-size:10px}.region-row.head{background:#f9fbfa;color:#718078;font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.5px}.region-row strong{color:#30443a}.region-row span{color:#617068}.good-badge,.bad-badge{justify-self:start;padding:5px 8px;border-radius:999px;font-size:8px}.good-badge{background:#e5f5eb;color:#08713a}.bad-badge{background:#fff0dc;color:#a45d08}.findings{overflow:hidden}.finding{border-bottom:1px solid #edf2ee}.finding:last-child{border-bottom:0}.finding>button{width:100%;display:grid;grid-template-columns:1fr auto 22px;align-items:center;gap:10px;padding:13px 17px;border:0;background:#fff;text-align:left;cursor:pointer}.finding>button div{display:grid;gap:3px}.finding>button strong,.finding-title strong{font-size:11px;color:#34453c}.finding>button span,.finding-title span{font-size:9px;color:#89948e;line-height:1.4}.finding>button b,.finding-title>b{min-width:20px;padding:4px 5px;text-align:center;border-radius:6px;font-size:9px}.finding>button i{font-style:normal;color:#075f2b;font-size:16px;text-align:center}.finding-title{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:13px 17px;border-bottom:1px solid #edf2ee}.finding-title>div{display:grid;gap:3px}.bad-count{background:#fff0dc;color:#a45d08}.good-count{background:#e5f5eb;color:#08713a}.details{padding:0 17px 12px;background:#fbfdfb}.detail{display:flex;justify-content:space-between;gap:14px;padding:9px 0;border-top:1px solid #e7eee9}.detail strong{max-width:40%;font-size:9px;color:#35463d;overflow-wrap:anywhere}.detail span{max-width:58%;text-align:right;color:#7e8b83;font-size:9px;line-height:1.4}.clear{padding:12px 0;color:#08713a;font-size:10px;font-weight:750}.limit{display:block;padding-top:7px;color:#9a7b25;font-size:9px}.foot{text-align:center;color:#819087;font-size:9px;padding-bottom:8px}.foot strong{color:#52645a}@media(max-width:900px){.hero{align-items:flex-start;flex-direction:column}.hero button{width:100%}.metrics{grid-template-columns:repeat(2,1fr)}.grid{grid-template-columns:1fr}.grid .panel{margin-top:14px}.status{align-items:flex-start;flex-wrap:wrap}.last{margin-left:auto}}@media(max-width:600px){.page{padding:13px 11px 22px}.hero{padding:20px 17px;border-radius:15px}.hero h1{font-size:24px}.hero p{font-size:12px}.metrics{grid-template-columns:1fr 1fr;gap:8px}.metric{padding:13px}.metric strong{font-size:21px}.status{padding:14px}.status-mark{width:40px;height:40px}.status-copy strong{font-size:19px}.last{width:100%;margin-left:0;text-align:left}.panel{border-radius:13px}.region-row{padding:10px 13px}.check{margin:0 13px}.links{padding:12px 13px}.detail{display:block}.detail span{display:block;max-width:none;text-align:left;margin-top:3px}}`;
