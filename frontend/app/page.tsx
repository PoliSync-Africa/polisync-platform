const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://polisync-app.onrender.com").replace(/\/$/, "");

const capabilities = [
  {
    title: "Election Management",
    text: "Plan elections, manage election structures, coordinate operations and work with electoral geography from national level to polling stations.",
  },
  {
    title: "Political Research",
    text: "Research political issues, organize evidence and turn data into practical insights for candidates, parties, researchers and civic organizations.",
  },
  {
    title: "Campaign & Field Operations",
    text: "Coordinate campaign activity, volunteers, field teams, polling-station work and operational tasks in one connected workspace.",
  },
  {
    title: "Election Results",
    text: "Support structured result collation, polling-station submissions, verification and election intelligence with an auditable workflow.",
  },
  {
    title: "Political Intelligence",
    text: "Bring together political, governance and economic information with news, analysis and AI-assisted tools for better decisions.",
  },
  {
    title: "Organizations & People",
    text: "Give personal users, political parties, candidates and observer organizations the workspace and role-based tools they need.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "PoliSync Africa",
      url: siteUrl,
      logo: `${siteUrl}/IMG_9654.jpeg`,
      description:
        "PoliSync Africa is an African political technology platform for elections, research, campaign operations, field work, election results and political intelligence.",
    },
    {
      "@type": "WebSite",
      name: "PoliSync Africa",
      url: siteUrl,
      description: "Africa's Political Operating System",
      publisher: { "@type": "Organization", name: "PoliSync Africa" },
    },
    {
      "@type": "SoftwareApplication",
      name: "PoliSync Africa",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: siteUrl,
      description:
        "Political technology for elections, political research, campaigns, field operations, election results and political intelligence across Africa.",
    },
  ],
};

export default function Home() {
  return (
    <main style={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header style={styles.nav}>
        <a href="/" style={styles.brand} aria-label="PoliSync Africa home">
          <img src="/IMG_9654.jpeg" alt="PoliSync Africa logo" style={styles.logo} />
          <span>POLISYNC AFRICA</span>
        </a>
        <nav style={styles.navLinks} aria-label="Primary navigation">
          <a href="#platform" style={styles.navLink}>Platform</a>
          <a href="#capabilities" style={styles.navLink}>Capabilities</a>
          <a href="#about" style={styles.navLink}>About</a>
          <a href="/login" style={styles.login}>Sign in</a>
          <a href="/register" style={styles.register}>Create account</a>
        </nav>
      </header>

      <section style={styles.hero} id="platform">
        <div style={styles.heroCopy}>
          <p style={styles.eyebrow}>AFRICA'S POLITICAL OPERATING SYSTEM</p>
          <h1 style={styles.title}>POLISYNC AFRICA</h1>
          <p style={styles.lead}>
            Political technology built for the way Africa organizes, researches, campaigns and runs elections.
          </p>
          <p style={styles.body}>
            PoliSync Africa connects elections, political research, campaign management, field operations,
            election results, civic work, news and political intelligence in one secure digital platform.
          </p>
          <div style={styles.actions}>
            <a href="/register" style={styles.primaryButton}>Get started</a>
            <a href="/login" style={styles.secondaryButton}>Sign in</a>
          </div>
          <p style={styles.note}>Built for political parties, candidates, researchers, civic organizations and individual political users.</p>
        </div>

        <div style={styles.heroPanel} aria-label="PoliSync Africa platform overview">
          <div style={styles.panelTop}>
            <span style={styles.liveDot} />
            <span>POLISYNC AFRICA PLATFORM</span>
          </div>
          <div style={styles.panelGrid}>
            {[
              ["Elections", "Manage & coordinate"],
              ["Research", "Evidence & insights"],
              ["Field Operations", "Teams & volunteers"],
              ["Results", "Collate & verify"],
              ["News", "Ghana & global"],
              ["Intelligence", "AI-assisted decisions"],
            ].map(([label, value]) => (
              <div key={label} style={styles.panelCard}>
                <strong>{label}</strong>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={styles.section} id="capabilities">
        <div style={styles.sectionHeading}>
          <p style={styles.eyebrow}>ONE CONNECTED PLATFORM</p>
          <h2 style={styles.heading}>Everything political teams need to operate.</h2>
          <p style={styles.sectionLead}>
            From political research and campaign planning to polling-station operations and results, PoliSync Africa is designed around connected workflows.
          </p>
        </div>
        <div style={styles.capabilityGrid}>
          {capabilities.map((item) => (
            <article key={item.title} style={styles.capability}>
              <div style={styles.capabilityMark}>P</div>
              <h3 style={styles.cardTitle}>{item.title}</h3>
              <p style={styles.cardText}>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={styles.about} id="about">
        <div>
          <p style={styles.eyebrow}>WHY POLISYNC AFRICA</p>
          <h2 style={styles.heading}>Built around African political realities.</h2>
        </div>
        <p style={styles.aboutText}>
          PoliSync Africa is being built as a practical political technology platform for Africa — connecting people,
          organizations, electoral geography, research, operations, communication and evidence so political work can be
          coordinated with greater clarity, speed and accountability.
        </p>
      </section>

      <section style={styles.cta}>
        <div>
          <p style={styles.eyebrow}>POLISYNC AFRICA</p>
          <h2 style={{ ...styles.heading, marginBottom: 10 }}>Build, research, organize and operate smarter.</h2>
          <p style={styles.sectionLead}>Create your PoliSync account and enter Africa's political operating system.</p>
        </div>
        <div style={styles.actions}>
          <a href="/register" style={styles.primaryButton}>Create account</a>
          <a href="/login" style={styles.secondaryButton}>Sign in</a>
        </div>
      </section>

      <footer style={styles.footer}>
        <span>© {new Date().getFullYear()} PoliSync Africa</span>
        <span>Africa's Political Operating System</span>
      </footer>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f7f9fc",
    color: "#102033",
    overflowX: "hidden",
  },
  nav: {
    width: "100%",
    maxWidth: 1240,
    margin: "0 auto",
    padding: "18px clamp(18px, 4vw, 42px)",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    flexWrap: "wrap",
  },
  brand: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    color: "#102033",
    textDecoration: "none",
    fontWeight: 800,
    letterSpacing: "0.04em",
    fontSize: 15,
  },
  logo: { width: 38, height: 38, objectFit: "cover", borderRadius: 10 },
  navLinks: { display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" },
  navLink: { color: "#4b5d72", textDecoration: "none", fontSize: 14, fontWeight: 600 },
  login: { color: "#102033", textDecoration: "none", fontSize: 14, fontWeight: 700 },
  register: {
    color: "#fff",
    background: "#102033",
    textDecoration: "none",
    padding: "10px 15px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
  },
  hero: {
    width: "100%",
    maxWidth: 1240,
    margin: "0 auto",
    padding: "clamp(52px, 8vw, 100px) clamp(18px, 4vw, 42px)",
    boxSizing: "border-box",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.05fr) minmax(300px, .95fr)",
    gap: "clamp(32px, 6vw, 80px)",
    alignItems: "center",
  },
  heroCopy: { minWidth: 0 },
  eyebrow: { margin: "0 0 12px", fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", color: "#56708d" },
  title: { margin: "0 0 18px", fontSize: "clamp(42px, 8vw, 84px)", lineHeight: .94, letterSpacing: "-0.055em", fontWeight: 900 },
  lead: { margin: "0 0 18px", fontSize: "clamp(20px, 3vw, 30px)", lineHeight: 1.25, fontWeight: 700, maxWidth: 720 },
  body: { margin: "0 0 26px", color: "#5a6a7c", fontSize: 17, lineHeight: 1.7, maxWidth: 680 },
  actions: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" },
  primaryButton: { display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#102033", color: "#fff", textDecoration: "none", padding: "13px 20px", borderRadius: 11, fontWeight: 800 },
  secondaryButton: { display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#fff", color: "#102033", textDecoration: "none", padding: "12px 20px", borderRadius: 11, border: "1px solid #d8e0e8", fontWeight: 800 },
  note: { margin: "18px 0 0", color: "#718095", fontSize: 13, lineHeight: 1.5 },
  heroPanel: { minWidth: 0, background: "#102033", borderRadius: 24, padding: "clamp(20px, 4vw, 30px)", boxShadow: "0 24px 70px rgba(16,32,51,.16)" },
  panelTop: { display: "flex", alignItems: "center", gap: 9, color: "#dce6f0", fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", marginBottom: 18 },
  liveDot: { width: 8, height: 8, borderRadius: "50%", background: "#8fd694", display: "inline-block" },
  panelGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10 },
  panelCard: { minWidth: 0, padding: "17px 15px", borderRadius: 14, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.09)", display: "flex", flexDirection: "column", gap: 7 },
  section: { width: "100%", maxWidth: 1240, margin: "0 auto", padding: "70px clamp(18px, 4vw, 42px)", boxSizing: "border-box" },
  sectionHeading: { maxWidth: 760, marginBottom: 30 },
  heading: { margin: 0, fontSize: "clamp(30px, 5vw, 48px)", lineHeight: 1.05, letterSpacing: "-0.035em" },
  sectionLead: { margin: "14px 0 0", color: "#64748b", fontSize: 16, lineHeight: 1.7 },
  capabilityGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(290px, 100%), 1fr))", gap: 14 },
  capability: { minWidth: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 24 },
  capabilityMark: { width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 10, background: "#edf3f8", color: "#102033", fontWeight: 900, marginBottom: 18 },
  cardTitle: { margin: "0 0 9px", fontSize: 19 },
  cardText: { margin: 0, color: "#66768a", fontSize: 14, lineHeight: 1.65 },
  about: { width: "100%", maxWidth: 1240, margin: "0 auto", padding: "50px clamp(18px, 4vw, 42px) 80px", boxSizing: "border-box", display: "grid", gridTemplateColumns: "minmax(0,.8fr) minmax(0,1.2fr)", gap: 40, alignItems: "start" },
  aboutText: { margin: 0, color: "#526276", fontSize: 18, lineHeight: 1.75 },
  cta: { width: "calc(100% - clamp(36px, 8vw, 84px))", maxWidth: 1156, margin: "0 auto 60px", padding: "clamp(28px, 5vw, 48px)", boxSizing: "border-box", borderRadius: 22, background: "#eaf0f5", display: "flex", justifyContent: "space-between", gap: 30, alignItems: "center", flexWrap: "wrap" },
  footer: { width: "100%", maxWidth: 1240, margin: "0 auto", padding: "24px clamp(18px, 4vw, 42px) 34px", boxSizing: "border-box", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", color: "#7a8798", fontSize: 12 },
};
