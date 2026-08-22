"use client";

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/polisync-hero.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
      }}
    >
      {/* Dark overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,20,10,.55)",
        }}
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "430px",
          background: "rgba(255,255,255,.12)",
          backdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,.2)",
          borderRadius: "28px",
          padding: "32px",
          boxShadow: "0 25px 70px rgba(0,0,0,.45)",
          color: "white",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "22px" }}>
          <img
            src="/polisync-logo.png"
            alt="PoliSync Africa"
            style={{
              width: "220px",
              height: "auto",
            }}
          />
        </div>

        <h1
          style={{
            textAlign: "center",
            fontSize: "34px",
            color: "#D4AF37",
            marginBottom: "8px",
            fontWeight: "800",
          }}
        >
          Welcome Back
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#E8E8E8",
            marginBottom: "28px",
          }}
        >
          Africa's Political Intelligence Platform
        </p>

        <Input placeholder="Email Address" type="email" />
        <Input placeholder="Password" type="password" />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "22px",
            fontSize: "14px",
          }}
        >
          <label style={{ display: "flex", gap: "8px" }}>
            <input type="checkbox" />
            Remember me
          </label>

          <a href="#" style={{ color: "#FFD54F", textDecoration: "none" }}>
            Forgot Password?
          </a>
        </div>

        <button
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "16px",
            border: "none",
            background: "#0A8F3C",
            color: "white",
            fontSize: "17px",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          Login
        </button>

        <button
          style={{
            width: "100%",
            padding: "15px",
            marginTop: "14px",
            borderRadius: "16px",
            border: "2px solid #D4AF37",
            background: "transparent",
            color: "#D4AF37",
            fontSize: "16px",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          Create Free Account
        </button>
      </div>
    </main>
  );
}

function Input({ placeholder, type = "text" }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "15px",
        marginBottom: "16px",
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,.25)",
        background: "rgba(255,255,255,.12)",
        color: "white",
        fontSize: "16px",
        outline: "none",
      }}
    />
  );
}
