"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../../../../components/dashboard/DashboardShell";

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function RegionalElectoralHealthPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [status, setStatus] = useState("loading");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    fetch(`${API}/api/electoral-geography/integrity/regions`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok || !body.success) throw new Error(body.message || "Unable to load regional health.");
        return body.data;
      })
      .then((data) => { if (!cancelled) { setRows(data.regions || []); setMeta(data); setStatus("ready"); } })
      .catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, []);

  const visible = useMemo(() => rows.filter((r) => {
    const matchesFilter = filter === "all" || r.status === filter;
    const matchesQuery = !query.trim() || r.name.toLowerCase().includes(query.trim().toLowerCase());
    return matchesFilter && matchesQuery;
  }), [rows, filter, query]);

  return (
    <DashboardShell role="super_admin">
      <main className="regional-health">
        <div className="hero">
          <div>
            <a href="/super-admin/electoral-data-health" className="back">← Electoral Data Health</a>
            <h1>Regional Electoral Data Health</h1>
            <p>One-screen view of all active Ghana regions, constituency coverage, polling-station coverage and integrity findings.</p>
          </div>
          <a href="/super-admin/electoral-data-health/sync" className="sync">Open Data Sync →</a>
        </div>

        <section className="summary">
          <div><span>Active Regions</span><strong>{meta?.activeRegions ?? "—"} / {meta?.expectedRegions ?? 16}</strong></div>
          <div><span>Healthy</span><strong>{meta?.healthyRegions ?? "—"}</strong></div>
          <div><span>Needs Review</span><strong>{meta?.regionsNeedingReview ?? "—"}</strong></div>
        </section>

        <section className="toolbar">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search region…" aria-label="Search region" />
          <div className="filters">
            {["all", "Healthy", "Needs Review"].map((value) => (
              <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{value === "all" ? "All" : value}</button>
            ))}
          </div>
        </section>

        {status === "loading" && <div className="state">Loading regional health…</div>}
        {status === "error" && <div className="state error">Regional health could not be loaded. Check your Super Admin session and try again.</div>}

        {status === "ready" && (
          <section className="table-wrap">
            <div className="table-scroll">
              <table>
                <thead><tr><th>Region</th><th>Constituencies</th><th>Polling Stations</th><th>Orphan Constituencies</th><th>Orphan Stations</th><th>Duplicate Constituencies</th><th>Duplicate Codes</th><th>Parent Mismatches</th><th>Status</th></tr></thead>
                <tbody>
                  {visible.map((r) => <tr key={String(r.regionId)}>
                    <td><b>{r.regionNumber}. {r.name}</b></td><td>{r.constituencyCount}</td><td>{r.pollingStationCount}</td><td>{r.orphanConstituencyCount}</td><td>{r.orphanPollingStationCount}</td><td>{r.duplicateConstituencyGroupCount}</td><td>{r.duplicateStationCodeGroupCount}</td><td>{r.parentMismatchCount}</td>
                    <td><span className={`badge ${r.status === "Healthy" ? "good" : "bad"}`}>{r.status}</span></td>
                  </tr>)}
                  {!visible.length && <tr><td colSpan="9" className="empty">No regions match this filter.</td></tr>}
                </tbody>
              </table>
            </div>
            <p className="note">Counts are calculated from active Region, Constituency and PollingStation records and the current integrity report. No missing electoral data is fabricated.</p>
          </section>
        )}
      </main>
      <style jsx>{`
        .regional-health{padding:28px;max-width:1500px;margin:0 auto;color:#10251d}.hero{display:flex;justify-content:space-between;gap:24px;align-items:flex-end;margin-bottom:22px}.back{color:#116b4f;text-decoration:none;font-weight:700;font-size:13px}.hero h1{margin:8px 0 6px;font-size:32px;letter-spacing:-.8px}.hero p{margin:0;color:#607168;max-width:780px}.sync{background:#116b4f;color:#fff;text-decoration:none;padding:11px 16px;border-radius:10px;font-weight:800;white-space:nowrap}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:18px}.summary div,.table-wrap{background:#fff;border:1px solid #e4ebe7;border-radius:14px;box-shadow:0 6px 20px rgba(16,37,29,.05)}.summary div{padding:17px}.summary span{display:block;color:#718078;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}.summary strong{display:block;margin-top:6px;font-size:24px}.toolbar{display:flex;justify-content:space-between;gap:14px;margin-bottom:14px}.toolbar input{width:min(360px,100%);padding:12px 14px;border:1px solid #d5dfda;border-radius:10px;font:inherit;outline:none}.filters{display:flex;gap:7px}.filters button{border:1px solid #d5dfda;background:#fff;padding:10px 13px;border-radius:9px;font-weight:700;cursor:pointer}.filters button.active{background:#116b4f;color:#fff;border-color:#116b4f}.table-wrap{overflow:hidden}.table-scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;min-width:1050px}th,td{text-align:left;padding:13px 12px;border-bottom:1px solid #edf1ef;font-size:13px}th{background:#f6f9f7;color:#5e6c65;font-size:11px;text-transform:uppercase;letter-spacing:.35px;white-space:nowrap}.badge{display:inline-flex;padding:5px 8px;border-radius:999px;font-weight:800;font-size:11px}.good{background:#e7f5ed;color:#087443}.bad{background:#fff0e9;color:#a33d16}.empty{text-align:center;padding:32px;color:#78867f}.note{padding:13px 15px;margin:0;color:#738078;font-size:12px;background:#fbfcfb}.state{padding:35px;text-align:center;background:#fff;border:1px solid #e4ebe7;border-radius:14px}.state.error{color:#a33d16}.regional-health a:focus,.regional-health button:focus,.regional-health input:focus{outline:3px solid rgba(17,107,79,.18);outline-offset:2px}@media(max-width:760px){.regional-health{padding:18px}.hero{display:block}.hero h1{font-size:25px}.sync{display:inline-block;margin-top:14px}.summary{grid-template-columns:1fr}.toolbar{display:block}.filters{margin-top:9px;overflow:auto}.filters button{white-space:nowrap}.table-wrap{border-radius:12px}}
      `}</style>
    </DashboardShell>
  );
}
