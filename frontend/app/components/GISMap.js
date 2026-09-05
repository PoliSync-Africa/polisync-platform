"use client";

export default function GISMap() {

  return (
    <div
      style={{
        background: "#082C24",
        borderRadius: 24,
        padding: 30,
        color: "white",
        textAlign: "center"
      }}
    >
      <h2 style={{ color: "#D4AF37" }}>
        Continental GIS Engine
      </h2>

      <p>
        Official electoral boundaries will render here.
      </p>

      <div
        style={{
          marginTop: 20,
          height: 420,
          border: "2px dashed #D4AF37",
          borderRadius: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        Interactive Africa Map
      </div>
    </div>
  );

}
