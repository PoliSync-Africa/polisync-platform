"use client";

import Image from "next/image";
import { useState } from "react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F8FAF8",
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
          background: "#FFFFFF",
          borderRadius: "32px",
          padding: "32px 24px",
          boxShadow: "0 18px 45px rgba(0,0,0,.08)",
          border: "1px solid rgba(0,0,0,.06)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "18px" }}>
          <Image
            src="/IMG_9644.jpeg"
            alt="PoliSync Africa"
            width={220}
            height={220}
            priority
            style={{
              width: "220px",
              height: "auto",
              objectFit: "contain",
            }}
          />
        </div>

        <h1
          style={{
            textAlign: "center",
            fontSize: "36px",
            fontWeight: "800",
            color: "#064E2A",
            marginBottom: "8px",
          }}
        >
          Welcome Back
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#555",
            marginBottom: "28px",
            fontSize: "15px",
          }}
        >
          Sign in to your PoliSync Africa account
        </p>

        <form style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "700",
                color: "#111",
              }}
            >
              Email Address
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              style={{
                width: "100%",
                padding: "15px 18px",
                borderRadius: "999px",
                border: "1.5px solid #D7D7D7",
                fontSize: "16px",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "700",
                color: "#111",
              }}
            >
              Password
            </label>

            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                style={{
                  width: "100%",
                  padding: "15px 90px 15px 18px",
                  borderRadius: "999px",
                  border: "1.5px solid #D7D7D7",
                  fontSize: "16px",
                  outline: "none",
                }}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "18px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#666",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "15px",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#222",
              }}
            >
              <input type="checkbox" />
              Remember Me
            </label>

            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                color: "#0A8F3C",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "999px",
              border: "none",
              background: "linear-gradient(90deg,#0A8F3C,#064E2A)",
              color: "#FFF",
              fontSize: "17px",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            margin: "28px 0",
            color: "#888",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "#DDD" }} />
          <span>OR</span>
          <div style={{ flex: 1, height: "1px", background: "#DDD" }} />
        </div>

        {/* Social Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            ["Continue with Google", "🔵"],
            ["Continue with Apple", "🍎"],
            ["Continue with Microsoft", "🟦"],
          ].map(([label, icon]) => (
            <button
              key={label}
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: "999px",
                border: "1.5px solid #D7D7D7",
                background: "#FFF",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: "28px",
            color: "#555",
          }}
        >
          Don't have an account?
          <a
            href="/register"
            style={{
              display: "block",
              marginTop: "8px",
              color: "#D4AF37",
              fontWeight: "800",
              textDecoration: "none",
            }}
          >
            Create Account
          </a>
        </div>
      </div>
    </main>
  );
}
