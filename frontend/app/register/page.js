"use client";

import Link from "next/link";

const options = [
  ["Personal Use", "Civic information, elections and public political records.", "/register/personal"],
  ["Researcher", "Research datasets, electoral geography, results, sources and exports.", "/register/personal?purpose=researcher"],
  ["Journalist", "Election desk, source verification, fact-checking and reporting tools.", "/register/personal?purpose=journalist"],
  ["Media House", "Newsroom, data desk, assignments, verification and editorial planning.", "/register/personal?purpose=media_house"],
  ["Organization / Candidate", "Political parties, candidates and observer organizations.", "/register/organization"],
];

export default function RegisterChooser() {
  return <main style={{ minHeight: "100vh", padding: "30px 16px", background: "linear-gradient(135deg,#f8faf8,#eef7f0)", fontFamily: "Arial,sans-serif" }}>
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <section style={{ padding: 30, borderRadius: 26, background: "linear-gradient(135deg,#04351a,#075f2b)", border: "1px solid #c9a227", color: "#fff" }}>
        <span style={{ color: "#e6c85a", fontSize: 10, fontWeight: 900, letterSpacing: 1.5 }}>POLISYNC AFRICA</span>
        <h1 style={{ margin: "9px 0", fontSize: 32 }}>Create your PoliSync account</h1>
        <p style={{ maxWidth: 720, color: "rgba(255,255,255,.78)", lineHeight: 1.6 }}>Choose the purpose that defines your workspace. Personal accounts remain personal identities; organization memberships can be added separately with their own permissions.</p>
      </section>
      <section style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12 }}>
        {options.map(([title,text,href]) => <Link key={title} href={href} style={{ padding: 19, borderRadius: 17, background: "#fff", border: "1px solid #dce6df", textDecoration: "none", color: "#25332b", boxShadow: "0 8px 20px rgba(17,65,36,.04)" }}><strong style={{ display: "block", color: "#075f2b", fontSize: 16 }}>{title}</strong><span style={{ display: "block", marginTop: 7, color: "#718078", fontSize: 12, lineHeight: 1.55 }}>{text}</span><span style={{ display: "block", marginTop: 15, color: "#c9a227", fontSize: 11, fontWeight: 900 }}>Continue →</span></Link>)}
      </section>
      <p style={{ textAlign: "center", color: "#6e7871", fontSize: 13, marginTop: 20 }}>Already have an account? <Link href="/login" style={{ color: "#075f2b", fontWeight: 800 }}>Sign in</Link></p>
    </div>
  </main>;
}
