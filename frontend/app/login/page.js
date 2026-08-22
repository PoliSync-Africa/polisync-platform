"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#00160A 0%,#01351A 40%,#065F2B 100%)",
        backgroundImage:
          "radial-gradient(circle at 20% 20%, rgba(212,175,55,.18), transparent 30%), radial-gradient(circle at 80% 30%, rgba(0,255,140,.12), transparent 35%)",
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
          background: "rgba(255,255,255,.96)",
          backdropFilter: "blur(18px)",
          borderRadius: "34px",
          padding: "34px 28px",
          boxShadow: "0 25px 70px rgba(0,0,0,.35)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Image
            src="/polisync-logo.png"
            alt="PoliSync Africa"
            width={210}
            height={210}
            priority
            style={{
              width: "210px",
              height: "auto",
              objectFit: "contain",
              filter: "drop-shadow(0 14px 32px rgba(212,175,55,.45))",
            }}
          />
        </div>

        <h1
          style={{
            textAlign: "center",
            color: "#065F2B",
            fontSize: "44px",
            fontWeight: 800,
            margin: "8px 0 0",
          }}
        >
          PoliSync Africa
        </h1>

        <h2
          style={{
            textAlign: "center",
            color: "#111",
            fontSize: "32px",
            fontWeight: 700,
            margin: "18px 0 6px",
          }}
        >
          Welcome Back
        </h2>

        <p
          style={{
            textAlign: "center",
            color: "#666",
            marginBottom: "28px",
            fontSize: "16px",
          }}
        >
          Sign in to your PoliSync Africa account
        </p>

        <div style={{ marginBottom: "18px" }}>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              color: "#111",
              marginBottom: "8px",
            }}
          >
            Email Address
          </label>

          <input
            type="email"
            placeholder="Enter your email"
            style={{
              width: "100%",
              padding: "17px 18px",
              borderRadius: "999px",
              border: "1.8px solid #D5D5D5",
              fontSize: "16px",
              outline: "none",
            }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              color: "#111",
              marginBottom: "8px",
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
                padding: "17px 70px 17px 18px",
                borderRadius: "999px",
                border: "1.8px solid #D5D5D5",
                fontSize: "16px",
                outline: "none",
              }}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "#666",
                cursor: "pointer",
                fontWeight: 600,
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
            marginBottom: "24px",
            fontSize: "15px",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={remember}
              onChange={() => setRemember(!remember)}
            />
            Remember Me
          </label>

          <Link
            href="/forgot-password"
            style={{
              color: "#065F2B",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Forgot Password?
          </Link>
        </div>

        <button
          style={{
            width: "100%",
            padding: "18px",
            borderRadius: "999px",
            border: "none",
            background: "linear-gradient(90deg,#0A8F35,#065F2B)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "18px",
            cursor: "pointer",
            boxShadow: "0 12px 30px rgba(6,95,43,.35)",
          }}
        >
          Login
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            margin: "26px 0",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "1px",
              background: "#DDD",
            }}
          />

          <span style={{ color: "#777" }}>OR</span>

          <div
            style={{
              flex: 1,
              height: "1px",
              background: "#DDD",
            }}
          />
        </div>

        <Link
          href="/register"
          style={{
            display: "block",
            textAlign: "center",
            padding: "16px",
            borderRadius: "999px",
            border: "2px solid #065F2B",
            color: "#065F2B",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Create Free Account
        </Link>
      </div>
    </main>
  );
}
