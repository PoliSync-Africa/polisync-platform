"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";

const nav = [{ section: "INTELLIGENCE", items: [
  { label: "Ghana News", href: "/news", key: "news" },
  { label: "Trending", href: "/news?category=trending", key: "trending" },
  { label: "Major Foreign News", href: "/news?category=foreign", key: "foreign" },
  { label: "Politics", href: "/news?category=politics", key: "politics" },
  { label: "Governance", href: "/news?category=governance", key: "governance" },
  { label: "Economy", href: "/news?category=economy", key: "economy" },
  { label: "Research", href: "/research", key: "research" },
]}];

const tabs = [
  ["all", "All News"],
  ["trending", "Trending Ghana"],
  ["politics", "Politics"],
  ["governance", "Governance"],
  ["economy", "Economy"],
  ["foreign", "Major Foreign News"],
];

export default function News() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/news/ghana", { cache: "no-store" });
      const payload = await response.json();
      setItems(Array.isArray(payload?.data) ? payload.data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const current = new URLSearchParams(window.location.search).get("category") || "all";
    setCategory(tabs.some(([value]) => value === current) ? current : "all");
    load();
  }, []);

  const filtered = useMemo(() => category === "all" ? items : items.filter((item) => item.category === category), [items, category]);

  const selectCategory = (value) => {
    setCategory(value);
    window.history.replaceState(null, "", value === "all" ? "/news" : `/news?category=${value}`);
  };

  return <DashboardShell role="user" navigation={nav} activeSection={category === "all" ? "news" : category}>
    <main className="page">
      <header className="hero">
        <div className="hero-copy">
          <span>GHANA PUBLIC-AFFAIRS INTELLIGENCE</span>
          <h1>Ghana News &amp; Global Affairs</h1>
          <p>Track Ghana politics, governance and the economy alongside trending Ghana stories and major international developments relevant to Ghana.</p>
        </div>
        <button className="refresh" type="button" onClick={load} disabled={loading}>{loading ? "Updating…" : "Refresh feed"}</button>
      </header>

      <div className="tabs" role="tablist" aria-label="News categories">
        {tabs.map(([value, label]) => <button type="button" role="tab" aria-selected={category === value} className={category === value ? "active" : ""} key={value} onClick={() => selectCategory(value)}>{label}</button>)}
      </div>

      {loading ? <div className="loading">Loading current news…</div> : <section className="grid">
        {filtered.map((item) => <article className="story" key={`${item.category}-${item.link}`}>
          <div className="story-top"><span>{item.categoryLabel}</span>{item.category === "trending" && <b>Trending</b>}{item.category === "foreign" && <b>International</b>}</div>
          <h2>{item.title}</h2>
          {item.description && <p>{item.description}</p>}
          <small>{item.source} · {item.published ? new Date(item.published).toLocaleString() : "Recent"}</small>
          <button type="button" onClick={() => window.open(item.link, "_blank", "noopener,noreferrer")}>Read original →</button>
        </article>)}
        {!filtered.length && <div className="empty">No stories are available for this category right now.</div>}
      </section>}
      <footer>Sources are aggregated through Google News RSS. PoliSync links to original publishers and does not present publisher content as its own reporting.</footer>
    </main>
    <style jsx>{`.page{width:100%;min-width:0;box-sizing:border-box;padding:clamp(14px,2.5vw,32px);background:#f4f7f5;min-height:100%;color:#193127;overflow-x:hidden}.hero{display:flex;justify-content:space-between;gap:20px;align-items:flex-end;min-width:0;padding:clamp(20px,3.5vw,30px);border-radius:22px;background:linear-gradient(135deg,#04351a,#075f2b);border:1px solid #c9a227;color:#fff;box-sizing:border-box}.hero-copy{min-width:0}.hero span{color:#c9a227;font-size:10px;font-weight:900;letter-spacing:1.5px}.hero h1{margin:8px 0;font-size:clamp(26px,3.6vw,38px);line-height:1.1;overflow-wrap:anywhere}.hero p{max-width:800px;margin:0;color:#dce9e1;font-size:clamp(11px,1.4vw,13px);line-height:1.6}.refresh{flex:0 0 auto;padding:11px 14px;border:1px solid #c9a227;border-radius:10px;background:#fff;color:#075f2b;font-weight:850;font-size:10px;white-space:nowrap}.tabs{display:flex;gap:7px;margin:12px 0;max-width:100%;overflow-x:auto;padding-bottom:3px;scrollbar-width:thin}.tabs button{flex:0 0 auto;padding:9px 13px;border:1px solid #dce6df;border-radius:999px;background:#fff;color:#64726a;font-size:10px;font-weight:800;white-space:nowrap}.tabs .active{background:#075f2b;color:#fff;border-color:#075f2b}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px;min-width:0}.story{min-width:0;display:flex;flex-direction:column;padding:17px;border:1px solid #dce6df;border-radius:16px;background:#fff;box-sizing:border-box;overflow:hidden}.story-top{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.story-top span{color:#c39a1f;font-size:9px;font-weight:900;text-transform:uppercase}.story-top b{padding:3px 6px;border-radius:999px;background:#eaf5ee;color:#075f2b;font-size:8px}.story h2{margin:8px 0;color:#24372e;font-size:14px;line-height:1.4;overflow-wrap:anywhere}.story p{flex:1;margin:0;color:#748078;font-size:10px;line-height:1.5;overflow-wrap:anywhere}.story small{margin-top:12px;color:#8a958e;font-size:8px;overflow-wrap:anywhere}.story button{align-self:flex-start;margin-top:12px;padding:0;border:0;background:none;color:#075f2b;font-size:9px;font-weight:850}.loading,.empty{padding:30px;color:#8a958e;font-size:11px}.page footer{margin-top:14px;color:#8a958e;font-size:9px;line-height:1.5;overflow-wrap:anywhere}@media(max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:640px){.page{padding:12px}.hero{flex-direction:column;align-items:flex-start;border-radius:18px}.refresh{width:100%;max-width:180px}.grid{grid-template-columns:minmax(0,1fr)}.tabs{margin-right:-2px}.story{padding:15px}}`}</style>
  </DashboardShell>;
}
