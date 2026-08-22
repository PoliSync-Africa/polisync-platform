"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [accountType, setAccountType] = useState("individual");

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#ffffff 0%,#eef7ef 45%,#0A8F3C 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          background: "rgba(255,255,255,.88)",
          backdropFilter: "blur(18px)",
          borderRadius: "28px",
          padding: "30px",
          boxShadow: "0 20px 60px rgba(0,0,0,.18)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <img
            src="/polisync-logo.png"
            alt="PoliSync Africa"
            style={{ height: "70px" }}
          />
        </div>

        <h1
          style={{
            textAlign: "center",
            color: "#D4AF37",
            fontSize: "36px",
            marginBottom: "6px",
          }}
        >
          Create Account
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#555",
            marginBottom: "26px",
          }}
        >
          Registration is completely free.
        </p>

        {/* Account Type */}
        <div style={{ marginBottom: "22px" }}>
          <p
            style={{
              fontWeight: "bold",
              color: "#0A8F3C",
              marginBottom: "10px",
            }}
          >
            I am registering as
          </p>

          {[
            ["individual", "👤 Individual"],
            ["party", "🏛 Political Party"],
            ["organization", "🏢 Organization"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setAccountType(value)}
              style={{
                width: "100%",
                padding: "14px",
                marginBottom: "10px",
                borderRadius: "14px",
                border:
                  accountType === value
                    ? "2px solid #D4AF37"
                    : "1px solid #ddd",
                background:
                  accountType === value ? "#0A8F3C" : "white",
                color:
                  accountType === value ? "white" : "#333",
                fontWeight: "600",
              }}
            >
              {label}
            </button>
          ))}

          <small style={{ color: "#666" }}>
            Your election duties are assigned later.
          </small>
        </div>

        {/* Individual */}
        {accountType === "individual" && (
          <>
            <Input placeholder="Full Name" />
            <Input placeholder="Email" type="email" />
            <Input placeholder="Password" type="password" />
            <Input placeholder="Country" />
          </>
        )}

        {/* Political Party */}
        {accountType === "party" && (
          <>
            <Input placeholder="Political Party Name" />
            <Input placeholder="Country" />

            <label style={{ fontSize: "14px", color: "#444" }}>
              Party Logo
            </label>

            <input
              type="file"
              style={{ marginBottom: "18px", width: "100%" }}
            />

            <small style={{ color: "#666" }}>
              Official party verification unlocks election result submission.
            </small>
          </>
        )}

        {/* Organization */}
        {accountType === "organization" && (
          <>
            <Input placeholder="Organization Name" />
            <Input placeholder="Country" />

            <label style={{ fontSize: "14px", color: "#444" }}>
              Organization Logo
            </label>

            <input
              type="file"
              style={{ marginBottom: "18px", width: "100%" }}
            />

            <small style={{ color: "#666" }}>
              Organizations can manage campaigns, observers and research.
            </small>
          </>
        )}

        <button
          style={{
            width: "100%",
            padding: "16px",
            marginTop: "24px",
            background: "#D4AF37",
            color: "#fff",
            border: "none",
            borderRadius: "16px",
            fontWeight: "bold",
            fontSize: "17px",
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
        border: "1px solid #ddd",
        fontSize: "16px",
      }}
    />
  );
}
