"use client";

export default function GlobalError({ reset }) {
  return (
    <html lang="en">
      <body style={styles.body}>
        <main style={styles.page} role="alert">
          <section style={styles.card}>
            <div style={styles.badge}>POLISYNC AFRICA</div>
            <h1 style={styles.title}>PoliSync is temporarily unavailable</h1>
            <p style={styles.text}>
              The application encountered a critical page error. Please retry,
              or return to the main dashboard.
            </p>
            <div style={styles.actions}>
              <button type="button" onClick={() => reset()} style={styles.primary}>
                Try again
              </button>
              <button type="button" onClick={() => window.location.assign("/dashboard")} style={styles.secondary}>
                Dashboard
              </button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}

const styles = {
  body: { margin: 0 },
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    boxSizing: "border-box",
    background: "#f4f7f5",
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#10231b",
  },
  card: {
    width: "min(100%, 560px)",
    boxSizing: "border-box",
    background: "#fff",
    border: "1px solid #dce7e1",
    borderRadius: "22px",
    padding: "clamp(24px, 5vw, 42px)",
    boxShadow: "0 18px 55px rgba(16,35,27,.10)",
    textAlign: "center",
  },
  badge: {
    display: "inline-flex",
    padding: "7px 11px",
    borderRadius: "999px",
    background: "#e8f2ed",
    color: "#075b3a",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: ".12em",
  },
  title: { margin: "22px 0 0", fontSize: "clamp(24px, 6vw, 34px)", lineHeight: 1.15 },
  text: { margin: "14px auto 0", maxWidth: "440px", lineHeight: 1.65, color: "#53645c", fontSize: "15px" },
  actions: { display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginTop: "25px" },
  primary: { border: 0, borderRadius: "12px", padding: "12px 18px", background: "#075b3a", color: "#fff", fontWeight: 800, cursor: "pointer" },
  secondary: { border: "1px solid #cbd9d2", borderRadius: "12px", padding: "12px 18px", background: "#fff", color: "#17382b", fontWeight: 800, cursor: "pointer" },
};
