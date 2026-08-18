
export default function Home() {
  return (
    <main
      style={{
        background: "linear-gradient(180deg,#041E1A,#0B3D2E)",
        color: "white",
        minHeight: "100vh"
      }}
    >
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "120px 24px"
        }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: "#D4AF37",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 42,
            fontWeight: "bold",
            color: "#0B3D2E"
          }}
        >
          P
        </div>

        <h1
          style={{
            fontSize: 54,
            marginTop: 30,
            marginBottom: 10,
            color: "#D4AF37"
          }}
        >
          POLISYNC AFRICA
        </h1>

        <p
          style={{
            maxWidth: 700,
            fontSize: 22,
            lineHeight: 1.6
          }}
        >
          Africa's Political Operating System — One secure platform for
          political parties, candidates, election observers, researchers and
          governments.
        </p>

        <div style={{ marginTop: 40 }}>
          <button
            style={{
              padding: "16px 36px",
              background: "#D4AF37",
              color: "#0B3D2E",
              border: "none",
              borderRadius: 14,
              fontWeight: "bold",
              fontSize: 18,
              cursor: "pointer"
            }}
          >
            Get Started
          </button>
        </div>
      </section>

      <section
        style={{
          background: "white",
          color: "#111",
          padding: "80px 24px"
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontSize: 36,
            marginBottom: 40
          }}
        >
          Everything Political Teams Need
        </h2>

        <div
          style={{
            display: "grid",
            gap: 24,
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            maxWidth: 1100,
            margin: "0 auto"
          }}
        >
          {[
            "Election Management",
            "Live Results",
            "Campaign CRM",
            "Research",
            "SupportOS",
            "Secure Authentication"
          ].map((feature) => (
            <div
              key={feature}
              style={{
                background: "#F8F9FA",
                padding: 28,
                borderRadius: 18,
                border: "1px solid #E5E7EB"
              }}
            >
              <h3 style={{ color: "#0B3D2E" }}>{feature}</h3>
              <p>
                Enterprise-grade tools designed specifically for African
                political organizations.
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
