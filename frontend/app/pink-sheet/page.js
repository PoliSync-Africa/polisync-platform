"use client";

export default function PinkSheetPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#07111F",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#0F1E33",
          borderRadius: "22px",
          padding: "28px",
        }}
      >
        <h1 style={{ marginBottom: "8px" }}>
          📄 Pink Sheet Capture
        </h1>

        <p style={{ color: "#BFD7EA", marginBottom: "28px" }}>
          Capture or upload an official Electoral Commission Pink Sheet for verification.
        </p>

        <div
          style={{
            border: "2px dashed #4B6B95",
            borderRadius: "18px",
            padding: "42px 20px",
            textAlign: "center",
            background: "#102640",
            marginBottom: "24px",
          }}
        >
          <div style={{ fontSize: "52px" }}>📷</div>

          <h3 style={{ marginTop: "14px" }}>
            Capture Pink Sheet
          </h3>

          <p style={{ color: "#BFD7EA" }}>
            Camera upload will be enabled in the next sprint.
          </p>
        </div>

        <button
          style={{
            width: "100%",
            padding: "18px",
            borderRadius: "14px",
            border: "none",
            background: "#0A7F5A",
            color: "white",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            marginBottom: "12px",
          }}
        >
          📷 Open Camera
        </button>

        <button
          style={{
            width: "100%",
            padding: "18px",
            borderRadius: "14px",
            border: "1px solid #4B6B95",
            background: "transparent",
            color: "white",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          🖼 Upload from Gallery
        </button>
      </div>
    </main>
  );
}
