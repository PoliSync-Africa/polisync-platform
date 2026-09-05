export default function Logo() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}
    >
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "20px",
          background: "#1B365D",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontSize: "32px",
          fontWeight: "bold"
        }}
      >
        P
      </div>

      <h1
        style={{
          marginTop: "12px",
          marginBottom: "0",
          color: "#1B365D",
          fontSize: "24px"
        }}
      >
        PoliSync Africa
      </h1>
    </div>
  );
}
