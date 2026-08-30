"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "./DashboardShell";
import AIAnalyzer from "./AIAnalyzer";

const PURPOSES = {
  personal_use: { title: "Civic Personal Workspace", subtitle: "Explore public political and electoral information for your own civic use.", cards: [["Election Explorer", "Track elections, timelines and public results."], ["Electoral Geography", "Move from region to constituency to polling station."], ["Candidate Directory", "Review public candidate profiles and affiliations."], ["Saved Information", "Keep important public records and pages together."]], nav: ["Overview", "Elections", "Geography", "Candidates", "Saved", "Alerts", "AI Analyzer"] },
  researcher: { title: "Research & Intelligence Workspace", subtitle: "A structured workspace for political, electoral and civic research.", cards: [["Research Desk", "Create research questions, projects, notes and evidence trails."], ["Electoral Datasets", "Explore public election, geography and candidate datasets."], ["Geographic Explorer", "Compare regions, constituencies and polling stations."], ["Results Laboratory", "Filter, compare and visualize public election results."], ["Source Library", "Record source links, provenance, methodology and publication dates."], ["Data Export", "Export permitted public data for analysis and citation."]], nav: ["Research Desk", "Datasets", "Geography", "Results", "Candidates", "Sources", "Exports", "AI Analyzer"] },
  journalist: { title: "Journalism & Election Desk", subtitle: "Research, verify and report public political developments from one workspace.", cards: [["Election Desk", "Follow results, electoral events and major developments."], ["Fact Check", "Compare claims against public records and source material."], ["Source Verification", "Track source provenance, timestamps and corroboration."], ["Candidate Profiles", "Quickly review public candidate and constituency context."], ["Press Calendar", "Manage election events, deadlines and publication planning."], ["Story Evidence", "Attach public datasets and source notes to reporting work."]], nav: ["News Desk", "Elections", "Geography", "Candidates", "Fact Check", "Sources", "Press Calendar", "AI Analyzer"] },
  media_house: { title: "Media House Newsroom", subtitle: "A newsroom command center for public political data and election coverage.", cards: [["Newsroom Command", "Coordinate desks, assignments and election coverage."], ["Data Desk", "Use public election, geography and candidate intelligence."], ["Verification Desk", "Centralize source checking and fact-check workflows."], ["Assignment Board", "Create stories, assign staff and track deadlines."], ["Editorial Calendar", "Plan election coverage and publishing schedules."], ["Audience Intelligence", "Review permitted public trends and reporting metrics."]], nav: ["Newsroom", "Assignments", "Elections", "Data Desk", "Verification", "Staff", "Editorial Calendar", "AI Analyzer"] },
};

export default function PersonalWorkspaceDashboard() {
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState({ regions: 0, constituencies: 0, pollingStations: 0 });
  const [loading, setLoading] = useState(true);
  const token = useMemo(() => typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || "", []);

  useEffect(() => {
    const api = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
    if (!api || !token) { setLoading(false); return; }
    let active = true;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${api}/api/personal-workspace/profile`, { headers }).then((r) => r.json()),
      fetch(`${api}/api/electoral-geography/summary`, { headers }).then((r) => r.json()),
    ]).then(([p, g]) => {
      if (!active) return;
      setProfile(p?.data || null);
      setSummary(g?.data || { regions: 0, constituencies: 0, pollingStations: 0 });
    }).catch(() => {}).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [token]);

  const purpose = profile?.purpose || "personal_use";
  const config = PURPOSES[purpose] || PURPOSES.personal_use;
  const navigation = [{ section: "WORKSPACE", items: config.nav.map((label) => ({ label, href: label === "AI Analyzer" ? "/personal#ai-analyzer" : "/personal", icon: "◆", key: label.toLowerCase().replace(/\s+/g, "-") })) }];

  return <DashboardShell role={purpose} navigation={navigation} activeSection="overview">
    <main style={{ minHeight: "100vh", padding: 20, background: "#f4f7f5" }}>
      <section style={{ maxWidth: 1500, margin: "0 auto", padding: 28, borderRadius: 22, background: "linear-gradient(135deg,#04351a,#075f2b)", border: "1px solid #c9a227", color: "#fff" }}>
        <span style={{ color: "#e6c85a", fontSize: 10, fontWeight: 900, letterSpacing: 1.5 }}>POLISYNC PERSONAL WORKSPACE</span>
        <h1 style={{ margin: "8px 0", fontSize: 32 }}>{config.title}</h1>
        <p style={{ maxWidth: 800, color: "rgba(255,255,255,.78)", lineHeight: 1.6 }}>{config.subtitle}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          <span style={pill}>Role: {purpose.replace(/_/g, " ")}</span>
          <span style={pill}>Scope: {profile?.scopeLevel || "public platform"}</span>
          <span style={pill}>Electoral geography connected</span>
        </div>
      </section>
      <section style={metricGrid}>
        <Metric label="Regions" value={loading ? "—" : summary.regions} />
        <Metric label="Constituencies" value={loading ? "—" : summary.constituencies} />
        <Metric label="Polling Stations" value={loading ? "—" : summary.pollingStations} />
        <Metric label="Access" value={profile?.accessProfile || "public_read"} />
      </section>
      <section style={cardGrid}>
        {config.cards.map(([title, text]) => <article key={title} style={card}><div style={icon}>✦</div><h2 style={{ margin: "0 0 7px", color: "#075f2b", fontSize: 16 }}>{title}</h2><p style={{ margin: 0, color: "#748078", lineHeight: 1.55, fontSize: 12 }}>{text}</p><button style={button}>Open workspace →</button></article>)}
      </section>
      <section id="ai-analyzer" style={{ marginTop: 14, padding: 16, borderRadius: 16, background: "#fff", border: "1px solid #c9a227" }}><AIAnalyzer role={purpose} /></section>
      <section style={{ marginTop: 14, padding: 14, borderRadius: 14, background: "#fbfaf4", border: "1px solid #e9dfb5", color: "#6f674b", fontSize: 11 }}><strong>Data boundary:</strong> personal workspaces receive public/read access according to role and scope. Private party, observer, candidate and administrative records remain protected by organization permissions.</section>
    </main>
  </DashboardShell>;
}

const pill = { padding: "7px 10px", borderRadius: 999, background: "rgba(255,255,255,.10)", border: "1px solid rgba(230,200,90,.45)", fontSize: 9, fontWeight: 800 };
const metricGrid = { maxWidth: 1500, margin: "12px auto", display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 };
const cardGrid = { maxWidth: 1500, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 };
const card = { padding: 17, borderRadius: 16, background: "#fff", border: "1px solid #dce6df", boxShadow: "0 8px 22px rgba(17,65,36,.05)" };
const icon = { width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 10, background: "#eaf5ee", color: "#075f2b", marginBottom: 11 };
const button = { marginTop: 14, padding: "8px 11px", border: "1px solid #c9a227", borderRadius: 9, background: "#075f2b", color: "#fff", fontSize: 9, fontWeight: 800 };
function Metric({ label, value }) { return <div style={{ padding: 14, borderRadius: 13, background: "#fff", border: "1px solid #dce6df" }}><span style={{ display: "block", color: "#8a948d", fontSize: 9 }}>{label}</span><strong style={{ display: "block", marginTop: 5, color: "#075f2b", fontSize: 19 }}>{value}</strong></div>; }
