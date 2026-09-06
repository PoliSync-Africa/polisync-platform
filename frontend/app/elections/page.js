"use client";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ElectionCard from "../components/ElectionCard";
import SupportBubble from "../components/SupportBubble";

const elections = [
  { title: "Ghana General Election", country: "Ghana", date: "7 Dec 2028", progress: 92, status: "Live" },
  { title: "Nigeria State Election", country: "Nigeria", date: "2027", progress: 54, status: "Live" },
  { title: "Kenya Party Primaries", country: "Kenya", date: "2027", progress: 0, status: "Upcoming" },
];

export default function ElectionsPage() {
  return (
    <div className="elections-shell">
      <Sidebar />
      <div className="elections-main">
        <Topbar />
        <main className="elections-content">
          <header className="elections-hero">
            <div className="elections-hero-copy">
              <span>ELECTION INTELLIGENCE</span>
              <h1>Election Operations Center</h1>
              <p>Manage elections, reporting progress and operational visibility across Africa.</p>
            </div>
            <div className="elections-hero-badge">3 Elections</div>
          </header>
          <section className="elections-grid" aria-label="Available elections">
            {elections.map((election) => <ElectionCard key={election.title} {...election} />)}
          </section>
        </main>
        <SupportBubble />
      </div>
      <style jsx>{`
        .elections-shell{display:flex;width:100%;min-width:0;min-height:100dvh;background:#f3f5f7;overflow-x:hidden}
        .elections-main{flex:1 1 auto;min-width:0;width:0;max-width:100%;overflow-x:hidden}
        .elections-content{width:100%;min-width:0;max-width:100%;padding:clamp(16px,3vw,32px);box-sizing:border-box}
        .elections-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;min-width:0;padding:clamp(20px,4vw,34px);border-radius:22px;background:linear-gradient(135deg,#04351a,#075f2b);border:1px solid #c9a227;color:#fff;box-sizing:border-box}
        .elections-hero-copy{min-width:0;max-width:900px}
        .elections-hero span{color:#c9a227;font-size:10px;font-weight:900;letter-spacing:1.5px}
        .elections-hero h1{margin:8px 0 6px;color:#fff;font-size:clamp(27px,4vw,46px);line-height:1.08;overflow-wrap:anywhere}
        .elections-hero p{margin:0;max-width:720px;color:#dce9e1;font-size:clamp(11px,1.4vw,14px);line-height:1.6;overflow-wrap:anywhere}
        .elections-hero-badge{flex:0 0 auto;padding:9px 13px;border:1px solid #c9a227;border-radius:999px;background:rgba(255,255,255,.1);font-size:10px;font-weight:850;white-space:nowrap}
        .elections-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;width:100%;min-width:0;margin-top:20px}
        .elections-grid :global(*){min-width:0}
        @media(max-width:1050px){.elections-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:760px){.elections-content{padding:16px 12px 90px}.elections-hero{align-items:flex-start;flex-direction:column;border-radius:18px}.elections-hero-badge{align-self:flex-start}.elections-grid{grid-template-columns:minmax(0,1fr);gap:14px;margin-top:14px}}
        @media(max-width:430px){.elections-content{padding-left:10px;padding-right:10px}.elections-hero{padding:18px}.elections-hero h1{font-size:26px}.elections-hero p{font-size:11px}}
      `}</style>
    </div>
  );
}
