"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "./Logo";
import SocialLoginButtons from "./SocialLoginButtons";
import ThemeSelector from "./ThemeSelector";

export default function LoginCard() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      // Backend login will replace this later.
      setTimeout(() => {
        setLoading(false);
        router.push("/dashboard");
      }, 1000);
    } catch (err) {
      setLoading(false);
      alert("Login failed.");
    }
  };

  const handleCreateAccount = () => {
    router.push("/register");
  };

  const handleForgotPassword = () => {
    router.push("/forgot-password");
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "420px",
        background: "#ffffff",
        borderRadius: "24px",
        padding: "32px",
        boxShadow: "0 20px 50px rgba(0,0,0,0.12)"
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <Logo />

        <h2
          style={{
            marginTop: "16px",
            marginBottom: "8px",
            fontSize: "28px",
            color: "#1B365D"
          }}
        >
          Welcome Back
        </h2>

        <p style={{ color: "#666" }}>
          Sign in to your PoliSync Africa account
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label>Email Address</label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              border: "1px solid #ddd",
              marginTop: "6px"
            }}
          />
        </div>

        <div>
          <label>Password</label>

          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid #ddd",
                marginTop: "6px"
              }}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "#1B365D",
                cursor: "pointer"
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <button
            type="button"
            onClick={handleForgotPassword}
            style={{
              background: "transparent",
              border: "none",
              color: "#0A84FF",
              cursor: "pointer"
            }}
          >
            Forgot Password?
          </button>
        </div>

        <label style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input type="checkbox" />
          Remember Me
        </label>

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "12px",
            background: "#0A2540",
            color: "#fff",
            border: "none",
            fontWeight: "bold",
            fontSize: "16px",
            cursor: "pointer",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Signing In..." : "Login"}
        </button>

        <button
          type="button"
          onClick={handleCreateAccount}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "12px",
            background: "#F3F4F6",
            color: "#1B365D",
            border: "1px solid #ddd",
            fontSize: "16px",
            cursor: "pointer"
          }}
        >
          Create Account
        </button>
      </div>

      <div style={{ marginTop: "24px" }}>
        <SocialLoginButtons />
      </div>

      <div style={{ marginTop: "24px" }}>
        <ThemeSelector />
      </div>

      <p
        style={{
          marginTop: "20px",
          textAlign: "center",
          color: "#888",
          fontSize: "13px"
        }}
      >
        Secure Political Intelligence Platform for Africa
      </p>
    </div>
  );
}
