"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const nav = [
  { section: "NAVIGATION", items: [{ label: "Home", href: "/dashboard", key: "home", icon: "⌂" }] },
  { section: "RESULTS", items: [
    { label: "Results", href: "/results", key: "results", icon: "↗" },
    { label: "Elections", href: "/elections", key: "elections", icon: "•" },
  ] },
];

const token = () => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || "";
};

export default function ResultsPage() {
  const [elections, setElections] = useState([]);
  const [selected, setSelected] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/api/elections`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        const list = Array.isArray(data.elections) ? data.elections : [];
        setElections(list);
        if (list[0]?._id) setSelected(String(list[0]._id));
      })
      .catch(() => setError("Unable to load elections."));
  }, []);

  useEffect(() => {
    if (!selected) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    fetch(`${API}/api/results/election/${selected}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token()}`,
      },
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message || "Unable to load results.");
        if (!cancelled) setResults(Array.isArray(data.results) ? data.results : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Unable to load results.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [selected]);

  const candidates = useMemo(() => {
    const totals = new Map();
    results.forEach((result) => {
      const candidateResults = Array.isArray(result.candidateResults) ? result.candidateResults : [];
      candidateResults.forEach((candidate) => {
        const name = String(candidate.candidateName || "Unknown candidate").trim();
        const votes = Number(candidate.manualVotes || 0);
        totals.set(name, (totals.get(name) || 0) + votes);
      });
    });
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
  }, [results]);

  const election = elections.find((item) => String(item._id) === String(selected));
  const validVotes = results.reduce((total, result) => total + Number(result.manualTotals?.totalValidVotes || 0), 0);
  const verified = results.filter((result) => result.verificationStatus === "verified").length;
  const pending = results.filter((result) => result.verificationStatus !== "verified").length;

  return (
    <DashboardShell role="user" navigation={nav} activeSection="results">
      <main className="page">
        <section className="hero">
          <div>
            <span>RESULTS INTELLIGENCE</span>
            <h1>Election Results</h1>
            <p>Explore submitted election results available to your personal account. Results are organized by election and can be reviewed without entering an organization workspace.</p>
          </div>
          <div className="badge">{results.length.toLocaleString()} stations</div>
        </section>

        <section className="card">
          <label className="label">
            Select election
            <select value={selected} onChange={(event) => setSelected(event.target.value)}>
              <option value="">Choose an election</option>
              {elections.map((item) => (
                <option key={item._id} value={item._id}>{item.name} · {item.year} · {item.type}</option>
              ))}
            </select>
          </label>
          {election && (
            <div className="meta">
              <strong>{election.name}</strong>
              <span>{election.country || "Ghana"}</span>
              <span>{election.status}</span>
            </div>
          )}
        </section>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <section className="card empty">Loading results…</section>
        ) : !selected ? (
          <section className="card empty">Select an election to view results.</section>
        ) : (
          <>
            <section className="stats">
              <Stat label="Submitted stations" value={results.length} />
              <Stat label="Valid votes" value={validVotes} />
              <Stat label="Verified" value={verified} />
              <Stat label="Pending / review" value={pending} />
            </section>

            <section className="card">
              <div className="head">
                <div><span>CANDIDATE TOTALS</span><h2>National result view</h2></div>
                <button type="button" onClick={() => window.location.reload()}>↻ Refresh</button>
              </div>
              {candidates.length ? (
                <div className="table">
                  {candidates.map(([name, votes], index) => (
                    <div className="row" key={name}>
                      <div><b>{index + 1}. {name}</b></div>
                      <strong>{votes.toLocaleString()}</strong>
                    </div>
                  ))}
                </div>
              ) : <div className="empty">No submitted candidate results are available for this election yet.</div>}
            </section>

            <section className="card">
              <span>SUBMITTED RESULTS</span>
              <h2>Polling-station submissions</h2>
              {results.length ? (
                <div className="table">
                  {results.slice(0, 100).map((result, index) => (
                    <div className="row station" key={String(result._id || index)}>
                      <div>
                        <b>{result.pollingStationCode || "Polling station"}</b>
                        <small>{result.regionId?.name || "Region unavailable"} · {result.constituencyId?.name || "Constituency unavailable"}</small>
                      </div>
                      <strong>
                        {Number(result.manualTotals?.totalValidVotes || 0).toLocaleString()}
                        <small>{result.verificationStatus || "pending"}</small>
                      </strong>
                    </div>
                  ))}
                </div>
              ) : <div className="empty">No results have been submitted for this election yet.</div>}
            </section>
          </>
        )}
      </main>

      <style jsx>{`
        .page{padding:clamp(14px,2.5vw,34px);background:#f4f7f5;min-height:100%;color:#193127}
        .hero{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;padding:28px;border-radius:22px;background:linear-gradient(135deg,#04351a,#075f2b);border:1px solid #c9a227;color:#fff}
        .hero span,.card>span,.head span{color:#c9a227;font-size:10px;font-weight:900;letter-spacing:1.5px}
        .hero h1{margin:7px 0;font-size:34px}.hero p{max-width:760px;margin:0;color:#dce9e1;font-size:12px;line-height:1.6}
        .badge{padding:10px 13px;border-radius:999px;background:#eaf5ee;color:#075f2b;font-weight:900;font-size:11px;white-space:nowrap}
        .card{margin-top:12px;padding:18px;border:1px solid #dce6df;border-radius:17px;background:#fff}
        .label{display:grid;gap:7px;color:#748078;font-size:10px;font-weight:800}.label select{padding:12px;border:1px solid #dce6df;border-radius:10px;background:#fff;color:#193127;font-size:12px}
        .meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;align-items:center}.meta strong{color:#075f2b}.meta span{padding:5px 8px;border-radius:999px;background:#eaf5ee;color:#637068;font-size:9px}
        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}.stats>div{padding:15px;border:1px solid #dce6df;border-radius:14px;background:#fff}.stats small{display:block;color:#7b8780;font-size:9px}.stats strong{display:block;margin-top:5px;color:#075f2b;font-size:22px}
        .head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.head h2,.card h2{margin:5px 0 12px;color:#1c3128;font-size:19px}.head button{border:1px solid #c9a227;border-radius:9px;background:#fff;color:#075f2b;padding:8px 10px;font-weight:800;font-size:9px}
        .table{border-top:1px solid #edf1ee}.row{display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid #edf1ee;color:#34443b;font-size:11px}.row strong{color:#075f2b}.row small{display:block;margin-top:4px;color:#89938d;font-size:9px;font-weight:500}.station strong{text-align:right}
        .empty{padding:25px;text-align:center;color:#87928b;font-size:11px}.error{margin-top:12px;padding:12px;border:1px solid #efcaca;border-radius:12px;background:#fff6f6;color:#a62c2c;font-size:11px}
        @media(max-width:650px){.hero{flex-direction:column;align-items:flex-start}.hero h1{font-size:28px}.stats{grid-template-columns:repeat(2,1fr)}.stats>div{padding:12px}.stats strong{font-size:19px}}
      `}</style>
    </DashboardShell>
  );
}

function Stat({ label, value }) {
  return <div><small>{label}</small><strong>{Number(value || 0).toLocaleString()}</strong></div>;
}
