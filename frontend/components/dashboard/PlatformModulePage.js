import DashboardShell from "./DashboardShell";

export default function PlatformModulePage({ title, subtitle, activeSection, description }) {
  return (
    <DashboardShell role="super_admin" title={title} subtitle={subtitle} activeSection={activeSection}>
      <main style={{ minHeight: "100vh", padding: 24, boxSizing: "border-box", background: "#f5f8f6" }}>
        <section style={{ maxWidth: 1200, margin: "0 auto", background: "#fff", border: "1px solid #dce6df", borderRadius: 18, padding: 28, boxShadow: "0 8px 24px rgba(16,59,34,.06)" }}>
          <div style={{ color: "#c9a227", fontSize: 10, fontWeight: 900, letterSpacing: 1.4, textTransform: "uppercase" }}>POLISYNC AFRICA • SUPER ADMIN</div>
          <h2 style={{ margin: "8px 0 6px", color: "#075f2b", fontSize: 28 }}>{title}</h2>
          <p style={{ margin: 0, color: "#66736b", lineHeight: 1.6 }}>{description || subtitle || "This Super Admin module is available and ready for its connected platform data."}</p>
          <div style={{ marginTop: 22, padding: 18, borderRadius: 14, background: "#f5f8f6", border: "1px solid #e2ebe5", color: "#526058", fontSize: 13 }}>
            <strong style={{ color: "#075f2b" }}>Connected module</strong>
            <div style={{ marginTop: 5 }}>The route is now registered. No demo records are displayed here. Data and actions should come from the corresponding PoliSync backend service.</div>
          </div>
        </section>
      </main>
    </DashboardShell>
  );
}
