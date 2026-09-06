export default function Loading() {
  return (
    <main style={styles.page} aria-busy="true" aria-label="Loading PoliSync Africa">
      <section style={styles.card}>
        <div style={styles.mark} aria-hidden="true">P</div>
        <div style={styles.spinner} aria-hidden="true" />
        <h1 style={styles.title}>Loading PoliSync Africa</h1>
        <p style={styles.text}>Preparing your workspace securely…</p>
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
    width: "min(100%, 420px)",
    textAlign: "center",
    padding: "34px 24px",
  },
  mark: {
    width: "54px",
    height: "54px",
    margin: "0 auto 20px",
    display: "grid",
    placeItems: "center",
    borderRadius: "15px",
    background: "#075b3a",
    color: "#f2c94c",
    fontSize: "25px",
    fontWeight: 900,
  },
  spinner: {
    width: "24px",
    height: "24px",
    margin: "0 auto 18px",
    border: "3px solid #dce7e1",
    borderTopColor: "#075b3a",
    borderRadius: "50%",
    animation: "polisync-spin 0.8s linear infinite",
  },
  title: { margin: 0, fontSize: "20px" },
  text: { margin: "8px 0 0", color: "#66766e", fontSize: "14px" },
};
