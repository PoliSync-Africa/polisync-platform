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
          "linear-gradient(135deg, #F8FAF8 0%, #EEF7F0 100%)",
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
          padding: "34px 28px",
          boxShadow: "0 20px 60px rgba(0,0,0,.08)",
          border: "1px solid rgba(0,0,0,.05)",
        }}
      >
        {/* Official PoliSync Africa Logo */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "22px",
          }}
        >
          <Image
            src="/IMG_9654.jpeg"
            alt="PoliSync Africa"
            width={240}
            height={240}
            priority
            style={{
              width: "240px",
              height: "auto",
              objectFit: "contain",
            }}
          />
        </div>

        <h1
          style={{
            textAlign: "center",
            fontSize: "34px",
            fontWeight: "800",
            color: "#065F2B",
            margin: "0 0 8px",
          }}
        >
          Welcome Back
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#555",
            fontSize: "15px",
            marginBottom: "30px",
          }}
        >
          Sign in to your PoliSync Africa account
        </p>

        <div style={{ marginBottom: "18px" }}>
          <label
            style={{
              display: "block",
              fontWeight: "600",
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
              padding: "16px 18px",
              borderRadius: "999px",
              border: "1.5px solid #D8D8D8",
              fontSize: "16px",
              outline: "none",
            }}
          />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              display: "block",
              fontWeight: "600",
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
                padding: "16px 70px 16px 18px",
                borderRadius: "999px",
                border: "1.5px solid #D8D8D8",
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
                fontWeight: "600",
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
            marginBottom: "26px",
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
              fontWeight: "700",
            }}
          >
            Forgot Password?
          </Link>
        </div>

        <button
          style={{
            width: "100%",
            padding: "17px",
            borderRadius: "999px",
            border: "none",
            background: "linear-gradient(90deg,#0A8F3C,#065F2B)",
            color: "#FFF",
            fontSize: "17px",
            fontWeight: "800",
            cursor: "pointer",
            boxShadow: "0 12px 30px rgba(6,95,43,.25)",
          }}
        >
          Login
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            margin: "28px 0",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "1px",
              background: "#DDD",
            }}
          />

          <span
            style={{
              color: "#888",
              fontSize: "14px",
            }}
          >
            OR
          </span>

          <div
            style={{
              flex: 1,
              height: "1px",
              background: "#DDD",
            }}
          />
        </div>

        <button
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: "999px",
            border: "1.5px solid #DDD",
            background: "#FFF",
            marginBottom: "12px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Continue with Google
        </button>

        <button
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: "999px",
            border: "1.5px solid #DDD",
            background: "#FFF",
            marginBottom: "12px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Continue with Apple
        </button>

        <button
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: "999px",
            border: "1.5px solid #DDD",
            background: "#FFF",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Continue with Microsoft
        </button>

        <div
          style={{
            textAlign: "center",
            marginTop: "30px",
            color: "#555",
          }}
        >
          Don't have an account?
          <br />

          <Link
            href="/register"
            style={{
              color: "#D4AF37",
              textDecoration: "none",
              fontWeight: "800",
            }}
          >
            Create Account
          </Link>
        </div>
      </div>
    </main>
  );
}
