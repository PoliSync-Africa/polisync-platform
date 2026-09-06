"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardShell from "../../../../components/dashboard/DashboardShell";
import superAdminNavigation from "../../../../components/dashboard/superAdminNavigation";

const getToken = () => {
  if (typeof window === "undefined") return "";
  return ["polisync_token", "authToken", "accessToken", "token"]
    .map((key) => localStorage.getItem(key) || sessionStorage.getItem(key))
    .find(Boolean) || "";
};

async function request(path, options = {}) {
  const authToken = getToken();
  const response = await fetch(path, {
    cache: "no-store",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success !== true) {
    throw new Error(body.message || `Request failed (${response.status}).`);
  }
  return body.data || {};
}

const fmt = (value) => Number(value || 0).toLocaleString();
const date = (value) => value
  ? new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
  : "Not available";

export default function ElectoralDataSyncPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setData(await request("/api/electoral-geography/integrity"));
    } catch (e) {
      setError(e.message || "Unable to load synchronization status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setError("");
    setMessage("");
    try {
      const result = await request("/api/electoral-geography/integrity/sync", { method: "POST" });
      setData({ ...(result.integrity || {}), synchronization: result.sync || null });
      setMessage("The official Ghana EC 2024 polling-station dataset has been synchronized and revalidated.");
    } catch (e) {
      setError(e.message || "Synchronization failed.");
      await load();
    } finally {
      setSyncing(false);
    }
  };

  const sync = data?.synchronization;
  const source = sync?.source || "Ghana Electoral Commission 2024 Polling Stations";
  const syncStatus = sync?.status || "not_run";

  return (
    <DashboardShell
      role="super_admin"
      navigation={superAdminNavigation}
      activeSection="electoral-data"
      title="Electoral Data Synchronization"
      subtitle="Controlled official dataset synchronization and verification"
    >
      <main className="page">
        <section className="hero">
          <div>
            <span>SUPER ADMIN • DATA PIPELINE</span>
            <h1>Electoral Data Synchronization</h1>
            <p>Synchronize the bundled Ghana Electoral Commission polling-station dataset, record the operation, then immediately run the integrity validator against the resulting database state.</p>
          </div>
          <button type="button" onClick={runSync} disabled={loading || syncing}>
            {syncing ? "Synchronizing…" : "↻ Synchronize Official Dataset"}
          </button>
        </section>

        {message && <div className="message">✓ {message}</div>}
        {error && (
          <div className="error">
            <strong>Synchronization status</strong>
            <span>{error}</span>
            <button type="button" onClick={load}>Retry</button>
          </div>
        )}

        <section className="cards">
          <article className={`status ${syncStatus === "completed" ? "ok" : syncStatus === "failed" ? "bad" : "neutral"}`}>
            <span>PIPELINE STATUS</span>
            <strong>{syncStatus === "completed" ? "Last sync completed" : syncStatus === "failed" ? "Last sync failed" : "No recorded sync yet"}</strong>
            <small>{sync?.completedAt ? date(sync.completedAt) : "Run a synchronization to establish a recorded pipeline result."}</small>
          </article>
          <article className="card">
            <span>DATA SOURCE</span>
            <strong>{source}</strong>
            <small>Source year: {sync?.sourceYear || 2024}</small>
          </article>
          <article className="card">
            <span>ACTIVE STATIONS AFTER SYNC</span>
            <strong>{fmt(sync?.activePollingStations ?? data?.counts?.pollingStations)}</strong>
            <small>Validated against the live database</small>
          </article>
        </section>

        <section className="grid">
          <article className="panel">
            <header><span>SYNC RESULT</span><h2>Import Accounting</h2></header>
            <Row label="Rows linked" value={sync?.matchedRows} />
            <Row label="Records inserted" value={sync?.upserted} />
            <Row label="Records updated" value={sync?.modified} />
            <Row label="Rows skipped" value={sync?.skipped} />
            <Row label="Ambiguous name candidates" value={sync?.ambiguous} />
          </article>
          <article className="panel">
            <header><span>POST-SYNC VALIDATION</span><h2>Current Health</h2></header>
            <Health label="Regions" value={data?.counts?.regions} good={Number(data?.counts?.regions) === 16} />
            <Health label="Constituencies" value={data?.counts?.constituencies} good={Number(data?.counts?.constituencies) >= 276} />
            <Health label="Polling Stations" value={data?.counts?.pollingStations} good={Number(data?.counts?.pollingStations) > 0} />
            <Health label="Integrity status" value={data?.healthy ? "Healthy" : "Needs Review"} good={data?.healthy === true} />
            <a className="health-link" href="/super-admin/electoral-data-health">← Return to Electoral Data Health Center</a>
          </article>
        </section>

        <section className="notice">
          <strong>Safe synchronization policy</strong>
          <p>The importer refuses incomplete datasets and only reports a synchronization as successful after the operation completes. Every Super Admin-triggered sync is audit logged.</p>
        </section>
      </main>
      <style jsx>{styles}</style>
    </DashboardShell>
  );
}

function Row({ label, value }) {
  return <div className="row"><span>{label}</span><strong>{fmt(value)}</strong></div>;
}

function Health({ label, value, good }) {
  return (
    <div className="health">
      <span className={good ? "dot ok" : "dot bad"}>{good ? "✓" : "!"}</span>
      <div><strong>{label}</strong><small>{typeof value === "number" ? fmt(value) : value || "Not available"}</small></div>
      <b>{good ? "PASS" : "REVIEW"}</b>
    </div>
  );
}

const styles = `
.page{min-height:100%;padding:clamp(14px,2.5vw,30px);background:#f4f7f5;color:#1e3027;box-sizing:border-box}
.hero{display:flex;justify-content:space-between;align-items:center;gap:24px;padding:28px 30px;border-radius:20px;background:linear-gradient(115deg,#004d28,#006b38 60%,#073d26);color:#fff}
.hero span,.panel header span,.cards span{font-size:9px;font-weight:900;letter-spacing:1.5px;color:#dfc15b}
.hero h1{margin:8px 0 7px;font-size:clamp(25px,3vw,34px)}
.hero p{max-width:780px;margin:0;color:rgba(255,255,255,.78);font-size:13px;line-height:1.6}
.hero button{min-height:44px;padding:11px 17px;border:0;border-radius:10px;background:#fff;color:#075d31;font-weight:900;cursor:pointer;white-space:nowrap}
.hero button:disabled{opacity:.6;cursor:wait}
.message,.error{margin-top:14px;padding:13px 15px;border-radius:12px;font-size:11px}
.message{background:#e8f6ed;border:1px solid #c9e8d3;color:#08713a}
.error{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#fff3f1;border:1px solid #efc9c4;color:#82342c}
.error span{flex:1}.error button{border:0;border-radius:7px;padding:7px 10px;background:#96352d;color:#fff;font-weight:800}
.cards{display:grid;grid-template-columns:1.2fr 1.5fr 1fr;gap:12px;margin-top:14px}
.card,.status{padding:17px;border:1px solid #dbe6df;border-radius:15px;background:#fff}
.status.ok{border-color:#cce6d5}.status.bad{border-color:#efc9c4}.status.neutral{border-color:#dbe6df}
.cards strong{display:block;margin-top:6px;color:#30433a;font-size:13px}.cards small{display:block;margin-top:5px;color:#85918b;font-size:9px;line-height:1.45}
.status.ok strong{color:#08713a}.status.bad strong{color:#a23d34}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}
.panel{border:1px solid #dbe6df;border-radius:15px;background:#fff;overflow:hidden}.panel header{padding:16px 18px;border-bottom:1px solid #edf2ee;background:#f9fbfa}.panel header h2{margin:4px 0 0;color:#075f2b;font-size:17px}
.row{display:flex;justify-content:space-between;padding:12px 18px;border-bottom:1px solid #edf2ee}.row:last-child{border-bottom:0}.row span{color:#66766d;font-size:11px}.row strong{color:#075f2b;font-size:12px}
.health{display:flex;align-items:center;gap:10px;margin:0 18px;padding:11px 0;border-bottom:1px solid #edf2ee}.health:last-of-type{border-bottom:0}.health .dot{width:27px;height:27px;border-radius:8px;display:grid;place-items:center;font-size:11px;font-weight:900}.dot.ok{background:#e5f5eb;color:#08713a}.dot.bad{background:#fff0dc;color:#a45d08}.health div{flex:1}.health strong{display:block;font-size:11px}.health small{display:block;margin-top:3px;color:#87938c;font-size:10px}.health b{font-size:9px;color:#08713a}.health .dot.bad+b{color:#a45d08}
.health-link{display:block;margin:12px 18px 16px;padding:9px;border-radius:8px;background:#eef7f1;color:#075f2b;text-align:center;text-decoration:none;font-size:9px;font-weight:850}
.notice{margin-top:14px;padding:15px 17px;border:1px solid #e3e8e4;border-radius:13px;background:#fff}.notice strong{font-size:11px;color:#34473e}.notice p{margin:5px 0 0;color:#7d8982;font-size:10px;line-height:1.5}
@media(max-width:900px){.hero{align-items:flex-start;flex-direction:column}.hero button{width:100%}.cards,.grid{grid-template-columns:1fr 1fr}}
@media(max-width:600px){.page{padding:13px 11px 22px}.hero{padding:20px 17px;border-radius:15px}.hero h1{font-size:24px}.hero p{font-size:12px}.cards,.grid{grid-template-columns:1fr}.cards{gap:9px}.panel{border-radius:13px}.row{padding:11px 15px}.health{margin:0 15px}}
`;
