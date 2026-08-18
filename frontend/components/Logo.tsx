export default function Logo() {
  return (
    <div style={{ textAlign: "center", marginBottom: "24px" }}>
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "20px",
          background: "#0A2540",
          color: "#D4AF37",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "32px",
          margin: "0 auto 12px",
          fontWeight: "bold"
        }}
      >
        P
      </div>

      <h1
        style={{
          margin: 0,
          fontSize: "28px",
          color: "#0A2540"
        }}
      >
        POLISYNC AFRICA
      </h1>

      <p
        style={{
          marginTop: "8px",
          color: "#555",
          fontSize: "14px"
        }}
      >
        Secure Political Intelligence Platform
      </p>
    </div>
  );
}
