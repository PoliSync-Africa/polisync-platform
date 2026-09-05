"use client";

import Link from "next/link";

const options = [
  ["Personal Use", "Civic information, elections and public political records.", "/register/personal"],
  ["Researcher", "Research datasets, electoral geography, results, sources and exports.", "/register/personal?purpose=researcher"],
  ["Journalist", "Election desk, source verification, fact-checking, newsroom-style research and reporting tools.", "/register/personal?purpose=journalist"],
  ["Organization / Candidate", "Political parties, candidates and observer organizations.", "/register/organization"],
];

export default function RegisterChooser() {
  return <main style={{ minHeight:"100vh", padding:"30px 16px", background:"linear-gradient(135deg,#f8faf8,#eef7f0)", fontFamily:"Arial,sans-serif" }}>
    <div style={{ maxWidth:860, margin:"0 auto" }}>
      <section style={{ padding:30, borderRadius:26, background:"linear-gradient(135deg,#04351a,#075f2b)", border:"1px solid #c9a227", color:"#fff" }}>
        <span style={{ color:"#e6c85a", fontSize:10, fontWeight:900, letterSpacing:1.5 }}>POLISYNC AFRICA</span>
        <h1 style={{ margin:"9px 0", fontSize:32 }}>Create your PoliSync account</h1>
        <p style={{ maxWidth:720, color:"rgba(255,255,255,.78)", lineHeight:1.6 }}>Choose the purpose that defines your workspace. Personal accounts are self-created and automatically enrolled; organization memberships have their own permissions and onboarding.</p>
      </section>
      <section style={{ marginTop:14, display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:12 }}>
        {options.map(([title,text,href]) => <Link key={title} className="signup-choice" href={href} style={{ padding:19, borderRadius:17, background:"#fff", border:"1px solid #dce6df", textDecoration:"none", color:"#25332b", boxShadow:"0 8px 20px rgba(17,65,36,.04)" }}><strong style={{ display:"block", color:"#075f2b", fontSize:16 }}>{title}</strong><span style={{ display:"block", marginTop:7, color:"#718078", fontSize:12, lineHeight:1.55 }}>{text}</span><span className="continue-label" style={{ display:"block", marginTop:15, color:"#c9a227", fontSize:11, fontWeight:900 }}>Continue <span aria-hidden="true">→</span></span></Link>)}
      </section>
      <p style={{ textAlign:"center", color:"#6e7871", fontSize:13, marginTop:20 }}>Already have an account? <Link className="signin-link" href="/login" style={{ color:"#075f2b", fontWeight:800 }}>Sign in</Link></p>
    </div>
    <style jsx>{`
      .signup-choice { position: relative; display: block; overflow: hidden; transition: transform .18s ease, box-shadow .25s ease, border-color .2s ease; }
      .signup-choice::after { content: ""; position: absolute; inset: 0; transform: translateX(-115%); background: linear-gradient(105deg, transparent 24%, rgba(201,162,39,.14) 50%, transparent 76%); pointer-events: none; }
      .signup-choice:hover { transform: translateY(-3px); border-color: #c9a227 !important; box-shadow: 0 16px 32px rgba(17,65,36,.12) !important; }
      .signup-choice:hover::after { animation: cardShine .65s ease; }
      .signup-choice:active { transform: scale(.975); box-shadow: 0 6px 14px rgba(17,65,36,.08) !important; }
      .continue-label span { display: inline-block; transition: transform .2s ease; }
      .signup-choice:hover .continue-label span { transform: translateX(4px); }
      .signin-link { display: inline-block; transition: transform .18s ease, opacity .18s ease; }
      .signin-link:hover { transform: translateY(-1px); opacity: .82; }
      .signin-link:active { transform: scale(.96); }
      @keyframes cardShine { from { transform: translateX(-115%); } to { transform: translateX(115%); } }
      @media (prefers-reduced-motion: reduce) {
        .signup-choice, .signin-link, .continue-label span { transition: none; }
        .signup-choice::after { animation: none; }
      }
    `}</style>
  </main>;
}
