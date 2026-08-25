```tsx
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
      // Temporary login flow.
      // Real backend authentication will be connected next.
      await new Promise((resolve) => setTimeout(resolve, 1000));

      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100%",
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
          boxSizing: "border-box",
          boxShadow: "0 20px 60px rgba(0,0,0,.10)",
          border: "1px solid rgba(0,0,0,.05)",
        }}
      >
        {/* POLISYNC AFRICA LOGO */}
        <div
          className="polisync-logo-wrapper"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "18px",
            overflow: "visible",
          }}
        >
          <Image
            src="/IMG_9654.jpeg"
            alt="PoliSync Africa"
            width={220}
            height={220}
            priority
            className="polisync-logo"
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
            lineHeight: "1.5",
          }}
        >
          Sign in to your PoliSync Africa account
        </p>

        {/* EMAIL */}
        <div style={{ marginBottom: "18px" }}>
          <label
            htmlFor="email"
            style={{
              display: "block",
              fontWeight: "700",
              marginBottom: "8px",
              color: "#222",
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

        {/* PASSWORD */}
        <div style={{ marginBottom: "14px" }}>
          <label
            htmlFor="password"
            style={{
              display: "block",
              fontWeight: "700",
              marginBottom: "8px",
              color: "#222",
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
                cursor: "pointer",
                fontWeight: "700",
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* REMEMBER / FORGOT */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
            fontSize: "14px",
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

        {/* LOGIN */}
        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "17px",
            borderRadius: "999px",
            border: "none",
            background: loading
              ? "#6FAF87"
              : "linear-gradient(90deg,#0A8F3C,#065F2B)",
            color: "#FFF",
            fontSize: "17px",
            fontWeight: "800",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 12px 30px rgba(6,95,43,.25)",
          }}
        >
          {loading ? "Signing In..." : "Login"}
        </button>

        {/* DIVIDER */}
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

        {/* GOOGLE */}
        <button
          type="button"
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: "999px",
            border: "1.5px solid #DDD",
            background: "#FFF",
            marginBottom: "14px",
            fontWeight: "600",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          Continue with Google
        </button>

        {/* APPLE */}
        <button
          type="button"
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: "999px",
            border: "1.5px solid #DDD",
            background: "#FFF",
            marginBottom: "14px",
            fontWeight: "600",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          Continue with Apple
        </button>

        {/* FACEBOOK */}
        <button
          type="button"
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: "999px",
            border: "1.5px solid #DDD",
            background: "#FFF",
            fontWeight: "600",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          Continue with Facebook
        </button>

        {/* CREATE ACCOUNT */}
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

        {/* FOOTER */}
        <p
          style={{
            marginTop: "22px",
            marginBottom: 0,
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
```
