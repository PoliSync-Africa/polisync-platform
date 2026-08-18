
export default function SocialLoginButtons() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          margin: "8px 0"
        }}
      >
        <div style={{ flex: 1, height: "1px", background: "#E5E7EB" }} />
        <span style={{ fontSize: "13px", color: "#6B7280" }}>
          OR CONTINUE WITH
        </span>
        <div style={{ flex: 1, height: "1px", background: "#E5E7EB" }} />
      </div>

      <button
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "10px",
          padding: "14px",
          borderRadius: "12px",
          border: "1px solid #D1D5DB",
          background: "#FFFFFF",
          cursor: "pointer",
          fontSize: "15px",
          fontWeight: 600
        }}
      >
        Continue with Google
      </button>

      <button
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "10px",
          padding: "14px",
          borderRadius: "12px",
          border: "1px solid #D1D5DB",
          background: "#000000",
          color: "#FFFFFF",
          cursor: "pointer",
          fontSize: "15px",
          fontWeight: 600
        }}
      >
        Continue with Apple
      </button>

      <button
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "10px",
          padding: "14px",
          borderRadius: "12px",
          border: "1px solid #D1D5DB",
          background: "#2563EB",
          color: "#FFFFFF",
          cursor: "pointer",
          fontSize: "15px",
          fontWeight: 600
        }}
      >
        Continue with Microsoft
      </button>
    </div>
  );
}
