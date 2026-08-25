"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      alert("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
      setLoading(false);
    }
  };

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
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          background: "#FFFFFF",
          borderRadius: "32px",
          padding: "34px 28px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.10)",
          boxSizing: "border-box",
        }}
      >
        {/* PoliSync Africa Logo */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "18px",
          }}
        >
          <Image
            src="/IMG_9654.jpeg"
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

        {/* Welcome */}
        <h1
          style={{
            textAlign: "center",
            fontSize: "32px",
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
            margin: "0 0 28px",
          }}
        >
          Sign in to your PoliSync Africa account
        </p>

        {/* Email */}
        <div style={{ marginBottom: "18px" }}>
          <label
            htmlFor="email"
            style={{
              display: "block",
              fontWeight: "700",
              marginBottom: "8px",
            }}
          >
            Email Address
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            autoComplete="email"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "16px 18px",
              borderRadius: "999px",
              border: "1.5px solid #D8D8D8",
              fontSize: "16px",
              outline: "none",
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: "14px" }}>
          <label
            htmlFor="password"
            style={{
              display: "block",
              fontWeight: "700",
              marginBottom: "8px",
            }}
          >
            Password
          </label>

          <div style={{ position: "relative" }}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "16px 72px 16px 18px",
                borderRadius: "999px",
                border: "1.5px solid #D8D8D8",
                fontSize: "16px",
                outline: "none",
              }}
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              style={{
                position: "absolute",
                right: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "#065F2B",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Remember / Forgot Password */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            fontSize: "14px",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
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

        {/* Login */}
        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "17px",
            borderRadius: "999px",
            border: "none",
            background: "linear-gradient(90deg, #0A8F3C, #065F2B)",
            color: "#FFFFFF",
            fontSize: "17px",
            fontWeight: "800",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Signing In..." : "Login"}
        </button>

        {/* Divider */}
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

        {/* Google */}
        <button
          type="button"
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: "999px",
            border: "1.5px solid #DDD",
            background: "#FFFFFF",
            marginBottom: "14px",
            fontWeight: "600",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Continue with Google
        </button>

        {/* Apple */}
        <button
          type="button"
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: "999px",
            border: "1.5px solid #DDD",
            background: "#FFFFFF",
            marginBottom: "14px",
            fontWeight: "600",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Continue with Apple
        </button>

        {/* Facebook */}
        <button
          type="button"
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: "999px",
            border: "1.5px solid #DDD",
            background: "#FFFFFF",
            fontWeight: "600",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Continue with Facebook
        </button>

        {/* Register */}
        <div
          style={{
            textAlign: "center",
            marginTop: "28px",
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

        {/* Footer */}
        <p
          style={{
            marginTop: "22px",
            textAlign: "center",
            color: "#888",
            fontSize: "13px",
          }}
        >
          Secure Political Intelligence Platform for Africa
        </p>
      </div>
    </main>
  );
}
