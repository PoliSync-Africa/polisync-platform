"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const socialButton = {
    width: "100%",
    padding: "15px",
    borderRadius: "999px",
    border: "1.5px solid #DDD",
    background: "#FFF",
    marginBottom: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    fontSize: "16px",
    transition: ".25s ease",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#F8FAF8 0%,#EEF7F0 100%)",
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
        {/* Animated PoliSync Logo */}
        <div className="polisync-logo-wrapper">
          <Image
            src="/IMG_9654.jpeg"
            alt="PoliSync Africa"
            width={240}
            height={240}
            priority
            className="polisync-logo"
          />
        </div>

        <h1
          style={{
            textAlign: "center",
            fontSize: "34px",
            fontWeight: "800",
            color: "#065F2B",
            marginBottom: "8px",
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
          <div style={{ flex: 1, height: "1px", background: "#DDD" }} />
          <span style={{ color: "#888", fontSize: "14px" }}>OR</span>
          <div style={{ flex: 1, height: "1px", background: "#DDD" }} />
        </div>

        {/* Google */}
        <button style={socialButton}>
          <svg width="22" height="22" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3c-1.6 5-6.3 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 19.3-8.1 20-20c0-1.3-.1-2.7-.4-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.6 19 12 24 12c3 0 5.8 1.1 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.2C29.2 35.1 26.7 36 24 36c-5 0-9.6-3-11.2-7.9l-6.5 5C9.6 39.5 16.3 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.4-2.3 4.4-4.3 5.7l6.3 5.2C41.1 35.4 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          Continue with Google
        </button>

        {/* Apple */}
        <button style={socialButton}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#000">
            <path d="M17.6 12.7c0-2.4 2-3.5 2.1-3.6-1.1-1.6-2.9-1.8-3.5-1.8-1.5-.2-2.9.9-3.6.9-.8 0-1.9-.9-3.1-.9-1.6 0-3 .9-3.9 2.3-1.7 2.9-.4 7.1 1.2 9.4.8 1.1 1.7 2.3 2.9 2.3s1.7-.7 3.2-.7 2 .7 3.2.7 2-.9 2.8-2c.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.6-1-2.6-3.9z"/>
            <path d="M15.2 5.9c.7-.8 1.2-1.9 1.1-3-.9.1-2 .6-2.7 1.4-.6.7-1.2 1.8-1 2.9 1 .1 2-.5 2.6-1.3z"/>
          </svg>
          Continue with Apple
        </button>

        {/* Facebook */}
        <button style={socialButton}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12C24 5.4 18.6 0 12 0S0 5.4 0 12c0 6 4.4 11 10.1 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3H15.8c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4C19.6 23 24 18 24 12z"/>
          </svg>
          Continue with Facebook
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
