"use client";

import { useEffect } from "react";

export default function GlobalRouteError({ error, reset }) {
  useEffect(() => {
    console.error("PoliSync route error:", error);
  }, [error]);

  return (
    <main style={styles.page} role="alert">
      <section style={styles.card}>
        <div style={styles.badge}>POLISYNC AFRICA</div>
        <div style={styles.icon}>!</div>
        <h1 style={styles.title}>Something went wrong</h1>
        <p style={styles.text}>
          PoliSync could not complete this page request. Your account and saved
          data have not been intentionally changed.
        </p>
        <div style={styles.actions}>
          <button type="button" onClick={() => reset()} style={styles.primary}>
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.assign("/dashboard")}
            style={styles.secondary}
          >
            Return to dashboard
          </button>
        </div>
        <p style={styles.support}>
          If the problem continues, wait a moment and try again. Persistent
          failures should be reported to the PoliSync administrator.
        </p>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    background: "#f4f7f5",
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#10231b",
  },
  card: {
    width: "min(100%, 560px)",
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
  icon: {
    width: "48px",
    height: "48px",
    margin: "24px auto 14px",
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    background: "#fff4d6",
    color: "#8a6200",
    fontSize: "24px",
    fontWeight: 900,
  },
  title: { margin: 0, fontSize: "clamp(25px, 6vw, 34px)", lineHeight: 1.15 },
  text: { margin: "14px auto 0", maxWidth: "440px", lineHeight: 1.65, color: "#53645c", fontSize: "15px" },
  actions: { display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginTop: "25px" },
  primary: { border: 0, borderRadius: "12px", padding: "12px 18px", background: "#075b3a", color: "#fff", fontWeight: 800, cursor: "pointer" },
  secondary: { border: "1px solid #cbd9d2", borderRadius: "12px", padding: "12px 18px", background: "#fff", color: "#17382b", fontWeight: 800, cursor: "pointer" },
  support: { margin: "22px 0 0", color: "#7a8882", fontSize: "12px", lineHeight: 1.5 },
};
