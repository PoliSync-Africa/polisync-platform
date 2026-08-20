"use client";

export default function GhanaMap() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "900px",
        background: "#ffffff",
        borderRadius: "20px",
        padding: "24px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
      }}
    >
      <h2
        style={{
          color: "#1B365D",
          marginBottom: "8px",
        }}
      >
        🗺️ Ghana Political Intelligence Map
      </h2>

      <p
        style={{
          color: "#666",
          marginBottom: "20px",
        }}
      >
        Foundation for regions, districts, constituencies and polling stations.
      </p>

      <div
        style={{
          height: "420px",
          borderRadius: "16px",
          border: "2px dashed #1B365D",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F8FAFC",
          color: "#1B365D",
          fontWeight: "bold",
        }}
      >
        Interactive Ghana Map Coming Next
      </div>
    </div>
  );
}
