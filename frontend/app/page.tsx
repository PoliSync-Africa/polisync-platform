const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://polisync-app.onrender.com").replace(/\/$/, "");

type CSSProperties = React.CSSProperties;

const modules = [
  { title: "Election Control", text: "Create and manage election deployments, electoral geography, polling stations and role-based election access.", href: "/elections", tag: "ELECTIONS" },
  { title: "Results Transmission", text: "Transmit polling-station results through a controlled workflow with validation, document checks and an audit trail.", href: "/submit-result", tag: "TRANSMISSION" },
  { title: "Live Results", text: "Review received results by polling station, constituency and region as records move through verification.", href: "/results", tag: "RESULTS" },
  { title: "Political Parties", text: "Preserve party organizations, party administrators, polling agents and party-linked election access.", href: "/party", tag: "PARTIES" },
  { title: "Candidates", text: "Preserve presidential and parliamentary candidate profiles and their election-result visibility.", href: "/presidential-candidate", tag: "CANDIDATES" },
  { title: "Election Integrity", text: "Keep submissions attributable, validate totals and maintain a clear status for each transmitted result.", href: "/integrity", tag: "INTEGRITY" },
];

const jsonLd = { "@context":"https://schema.org","@graph":[
  {"@type":"Organization",name:"PoliSync Africa",url:siteUrl,description:"Election technology platform for election operations and election results transmission."},
  {"@type":"WebSite",name:"PoliSync Africa",url:siteUrl,description:"Election operations and results transmission platform."},
  {"@type":"SoftwareApplication",name:"PoliSync Africa",applicationCategory:"Election Technology",operatingSystem:"Web",url:siteUrl,description:"Election management, results transmission, verification and results monitoring."}
]};

export default function Home() {
  return <main style={styles.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd)}} />
    <header style={styles.nav}>
      <a href="/" style={styles.brand}><img src="/polisync-official-logo.svg" alt="PoliSync Africa" style={styles.logo}/></a>
      <nav style={styles.navLinks} aria-label="Primary navigation">
        <a href="#platform" style={styles.navLink}>Platform</a>
        <a href="/elections" style={styles.navLink}>Elections</a>
        <a href="/results" style={styles.navLink}>Results</a>
        <a href="/party" style={styles.navLink}>Parties</a>
        <a href="/presidential-candidate" style={styles.navLink}>Candidates</a>
        <a href="/login" style={styles.login}>Sign in</a>
        <a href="/register" style={styles.register}>Create account</a>
      </nav>
    </header>

    <section style={styles.hero} id="platform">
      <div>
        <p style={styles.eyebrow}>ELECTION TECHNOLOGY • POLISYNC AFRICA</p>
        <h1 style={styles.title}>Election operations.<br/><span style={styles.accent}>Results transmitted.</span></h1>
        <p style={styles.lead}>A focused digital platform for election administration workflows and secure election-result transmission.</p>
        <p style={styles.body}>PoliSync Africa is now centered on elections: election setup, electoral geography, polling-station reporting, result transmission, verification and live results. Political parties and candidates remain first-class participants in the election workflow.</p>
        <div style={styles.actions}><a href="/elections" style={styles.primary}>Open Election Center</a><a href="/submit-result" style={styles.secondary}>Transmit a Result</a></div>
        <div style={styles.trust}><span>✓ Structured submissions</span><span>✓ Polling-station workflow</span><span>✓ Verification trail</span></div>
      </div>
      <div style={styles.command}>
        <div style={styles.commandTop}><span style={styles.dot}/> LIVE ELECTION OPERATIONS</div>
        <div style={styles.commandTitle}>Results Transmission Center</div>
        <div style={styles.flow}>
          {["Election","Polling Station","Result Entry","Document Check","Transmission","Verification"].map((x,i)=><div key={x} style={styles.flowItem}><span style={styles.flowNumber}>{i+1}</span><div><b>{x}</b><small>{i<2?"Define scope":i===2?"Enter figures":i===3?"Check source":"Track status"}</small></div></div>)}
        </div>
      </div>
    </section>

    <section style={styles.section}>
      <div style={styles.sectionHead}><p style={styles.eyebrow}>ONE PURPOSE</p><h2 style={styles.heading}>Everything is organized around the election result.</h2><p style={styles.sectionLead}>Non-election workspaces are no longer presented as core PoliSync functions. The platform experience is built around election operations and the movement of verified results from the polling station upward.</p></div>
      <div style={styles.grid}>{modules.map(m=><a key={m.title} href={m.href} style={styles.card}><span style={styles.tag}>{m.tag}</span><h3>{m.title}</h3><p>{m.text}</p><span style={styles.cardLink}>Open →</span></a>)}</div>
    </section>

    <section style={styles.transmission}>
      <div><p style={styles.eyebrow}>RESULTS TRANSMISSION</p><h2 style={styles.heading}>From polling station to verified result.</h2><p style={styles.sectionLead}>The workflow keeps election scope, candidate figures, totals, supporting documents and verification status connected to each transmission.</p></div>
      <div style={styles.steps}>{["Assign election scope","Enter candidate results","Validate totals","Attach result document","Transmit","Verify & propagate"].map((x,i)=><div key={x} style={styles.step}><strong>{String(i+1).padStart(2,"0")}</strong><span>{x}</span></div>)}</div>
    </section>

    <section style={styles.participants}>
      <div><p style={styles.eyebrow}>PARTIES & CANDIDATES PRESERVED</p><h2 style={styles.heading}>Political participants remain connected to election results.</h2><p style={styles.sectionLead}>Party organizations, party administrators, polling agents, presidential candidates and parliamentary candidates remain supported. Their workspace is narrowed to election participation, results and election records.</p></div>
      <div style={styles.participantLinks}><a href="/party" style={styles.participant}>Political Party <b>→</b></a><a href="/presidential-candidate" style={styles.participant}>Presidential Candidate <b>→</b></a><a href="/parliamentary-candidate" style={styles.participant}>Parliamentary Candidate <b>→</b></a></div>
    </section>

    <section style={styles.productModules}>
      <div>
        <p style={styles.eyebrow}>RETAINED PRODUCT MODULES</p>
        <h2 style={styles.heading}>The platform stays useful beyond the election core.</h2>
        <p style={styles.sectionLead}>Calendar, personal workspace, weather, communications, AI analysis and operational command tools remain available as supporting product modules without changing PoliSync’s core purpose.</p>
      </div>
      <div style={styles.productGrid}>
        {[
          ["/calendar","Calendar","Meetings, deadlines and election schedules."],
          ["/personal","Personal Workspace","Private tasks, saved work and personal operations."],
          ["/weather","Weather","Location-aware weather and operational conditions."],
          ["/messages","Messages","Secure workspace communication."],
          ["/notifications","Notifications","Election, result and system alerts."],
          ["/ai-analyzer","AI Analyzer","Election data and result intelligence."],
          ["/command-center","Command Center","Operational overview and live system signals."],
          ["/war-room","War Room","High-priority election operations and incidents."]
        ].map(([href,title,text])=><a key={href} href={href} style={styles.productCard}><b style={styles.productCardTitle}>{title}</b><span style={styles.productCardText}>{text}</span><small style={styles.productCardLink}>Open →</small></a>)}
      </div>
    </section>

    <footer style={styles.footer}><span>© {new Date().getFullYear()} PoliSync Africa</span><span>Election Operations & Results Transmission</span></footer>
  </main>;
}

const styles:Record<string,CSSProperties>={
 page:{minHeight:"100vh",background:"#f5f7f9",color:"#102033",fontFamily:"Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif"},
 nav:{width:"100%",maxWidth:1280,margin:"0 auto",padding:"16px clamp(18px,4vw,42px)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:20,flexWrap:"wrap",boxSizing:"border-box"},
 brand:{display:"inline-flex",alignItems:"center"},
 logo:{width:154,height:76,objectFit:"contain"},
 navLinks:{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"},
 navLink:{color:"#526274",textDecoration:"none",fontSize:13,fontWeight:700},
 login:{color:"#102033",textDecoration:"none",fontSize:13,fontWeight:800},
 register:{background:"#102033",color:"#fff",textDecoration:"none",padding:"10px 15px",borderRadius:10,fontSize:13,fontWeight:800},
 hero:{maxWidth:1280,margin:"0 auto",padding:"clamp(54px,8vw,100px) clamp(18px,4vw,42px) 76px",display:"grid",gridTemplateColumns:"minmax(0,1.08fr) minmax(330px,.92fr)",gap:"clamp(30px,6vw,78px)",alignItems:"center",boxSizing:"border-box"},
 eyebrow:{margin:"0 0 12px",fontSize:11,fontWeight:900,letterSpacing:".14em",color:"#587087"},
 title:{margin:"0 0 20px",fontSize:"clamp(42px,7vw,78px)",lineHeight:.96,letterSpacing:"-.055em",fontWeight:950},
 accent:{color:"#075f2b"},
 lead:{margin:"0 0 16px",fontSize:"clamp(19px,2.5vw,27px)",lineHeight:1.3,fontWeight:750,maxWidth:720},
 body:{margin:"0 0 26px",color:"#617184",fontSize:16,lineHeight:1.75,maxWidth:700},
 actions:{display:"flex",gap:11,flexWrap:"wrap"},
 primary:{display:"inline-flex",padding:"13px 18px",borderRadius:11,background:"#075f2b",color:"#fff",textDecoration:"none",fontWeight:850},
 secondary:{display:"inline-flex",padding:"12px 18px",borderRadius:11,background:"#fff",color:"#102033",border:"1px solid #d7dfe7",textDecoration:"none",fontWeight:850},
 trust:{display:"flex",gap:14,flexWrap:"wrap",marginTop:18,color:"#718092",fontSize:11,fontWeight:700},
 command:{background:"#0b2434",borderRadius:24,padding:"24px",boxShadow:"0 26px 70px rgba(11,36,52,.18)",color:"#fff"},
 commandTop:{display:"flex",alignItems:"center",gap:8,color:"#b9c9d6",fontSize:10,fontWeight:900,letterSpacing:".13em"},
 dot:{width:8,height:8,borderRadius:"50%",background:"#53c982",display:"inline-block"},
 commandTitle:{fontSize:25,fontWeight:850,margin:"18px 0 20px"},
 flow:{display:"grid",gap:8},
 flowItem:{display:"flex",alignItems:"center",gap:11,padding:"12px",border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.055)",borderRadius:12},
 flowNumber:{width:26,height:26,borderRadius:8,display:"grid",placeItems:"center",background:"#d4af37",color:"#102033",fontWeight:900,fontSize:11,flex:"0 0 auto"},
 section:{maxWidth:1280,margin:"0 auto",padding:"72px clamp(18px,4vw,42px)",boxSizing:"border-box"},
 sectionHead:{maxWidth:780,marginBottom:30},
 heading:{margin:0,fontSize:"clamp(30px,5vw,48px)",lineHeight:1.05,letterSpacing:"-.04em"},
 sectionLead:{margin:"14px 0 0",color:"#66768a",fontSize:16,lineHeight:1.7},
 grid:{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:14},
 card:{background:"#fff",border:"1px solid #dfe6ec",borderRadius:18,padding:22,textDecoration:"none",color:"#102033",minHeight:190,display:"flex",flexDirection:"column"},
 tag:{fontSize:9,fontWeight:900,letterSpacing:".13em",color:"#075f2b"},

 transmission:{maxWidth:1280,margin:"0 auto 70px",padding:"clamp(28px,5vw,48px) clamp(18px,4vw,42px)",boxSizing:"border-box",background:"#eaf2ed",borderTop:"1px solid #d2e0d6",borderBottom:"1px solid #d2e0d6",display:"grid",gridTemplateColumns:"minmax(0,.8fr) minmax(0,1.2fr)",gap:35,alignItems:"center"},
 steps:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10},
 step:{padding:"15px",borderRadius:13,background:"#fff",border:"1px solid #d8e4db",display:"grid",gap:8},
 participants:{maxWidth:1280,margin:"0 auto 70px",padding:"0 clamp(18px,4vw,42px)",display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(300px,.75fr)",gap:50,alignItems:"center",boxSizing:"border-box"},
 participantLinks:{display:"grid",gap:9},
 participant:{display:"flex",justifyContent:"space-between",padding:"17px 18px",background:"#fff",border:"1px solid #dfe6ec",borderRadius:13,textDecoration:"none",color:"#102033",fontWeight:800},
 productModules:{maxWidth:1280,margin:"0 auto 70px",padding:"0 clamp(18px,4vw,42px)",display:"grid",gridTemplateColumns:"minmax(0,.8fr) minmax(0,1.2fr)",gap:40,alignItems:"center",boxSizing:"border-box"},
 productGrid:{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10},
 productCard:{display:"grid",gap:5,padding:"15px",background:"#fff",border:"1px solid #dfe6ec",borderRadius:13,textDecoration:"none",color:"#102033"},
 productCard b:{fontSize:13},
 productCard span:{fontSize:11,color:"#68788a",lineHeight:1.45},
 productCard small:{fontSize:10,fontWeight:800,color:"#075f2b"},
 footer:{maxWidth:1280,margin:"0 auto",padding:"24px clamp(18px,4vw,42px) 34px",display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap",color:"#7a8798",fontSize:11,boxSizing:"border-box"}
};