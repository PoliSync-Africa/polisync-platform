"use client";

import Link from "next/link";
import { useState } from "react";

const API_BASES = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.BACKEND_URL,
  "https://polisync-platform.onrender.com",
  "https://polisync-platform-1.onrender.com",
].map((value) => String(value || "").replace(/\/+$/, "")).filter((value, index, list) => value && list.indexOf(value) === index);

const requestJson = async (path, options = {}) => {
  let lastError = null;
  for (const base of API_BASES) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(`${base}${path}`, {
        ...options,
        headers: { "Content-Type": "application/json", Accept: "application/json", ...(options.headers || {}) },
        signal: controller.signal,
      });
      const text = await response.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
      if (response.ok || response.status < 500) return { response, data };
      lastError = new Error(data?.message || `Server returned ${response.status}.`);
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError || new Error("Unable to connect to the PoliSync server.");
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) return setError("Email and password are required.");
    setLoading(true);
    try {
      const { response, data } = await requestJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      if (response.status === 202 && data?.success && data?.code === "PHONE_OTP_REQUIRED") {
        const challenge = data.challengeToken || data.challengeId || "";
        if (!challenge) throw new Error("The server did not return a login verification challenge. Please try again.");
        sessionStorage.setItem("polisync_login_email", normalizedEmail);
        sessionStorage.setItem("polisync_login_challenge", String(challenge));
        sessionStorage.setItem("polisync_login_phone", String(data.phone || ""));
        sessionStorage.setItem("polisync_login_otp_expires", String(data.expiresAt || ""));
        sessionStorage.setItem("polisync_login_otp_minutes", String(data.expiresInMinutes || 5));
        window.location.assign("/login/verify-phone");
        return;
      }

      if (!response.ok || data?.success === false) throw new Error(data?.message || "Invalid email or password.");
      const token = data?.token || data?.accessToken || data?.access_token;
      if (!token) throw new Error("Login succeeded but no authentication token was returned.");
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem("polisync_token", token);
      if (data?.user) storage.setItem("polisync_user", JSON.stringify(data.user));
      if (remember) localStorage.setItem("polisync_remember", "true"); else localStorage.removeItem("polisync_remember");
      window.location.assign(data?.user?.platformRole === "super_admin" ? "/super-admin" : "/dashboard");
    } catch (loginError) {
      setError(loginError?.name === "AbortError" ? "The server took too long to respond. Please try again." : loginError?.message || "Unable to complete login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 16, background: "linear-gradient(135deg,#F8FAF8,#EEF7F0)" }}>
      <section style={{ width: "100%", maxWidth: 420, background: "#fff", padding: 28, borderRadius: 18, boxShadow: "0 8px 28px rgba(6,59,30,.10)" }}>
        <div style={{ textAlign: "center" }}><img src="/polisync-official-logo.svg" alt="PoliSync Africa" style={{ width: 220, maxWidth: "80%" }} /></div>
        <h1 style={{ textAlign: "center", color: "#065F2B" }}>Welcome Back</h1>
        <p style={{ textAlign: "center", color: "#66736B" }}>Sign in to your PoliSync Africa account</p>
        <form onSubmit={handleLogin}>
          <label htmlFor="email">Email Address</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading} style={{ display: "block", width: "100%", boxSizing: "border-box", padding: 13, margin: "7px 0 15px" }} />
          <label htmlFor="password">Password</label>
          <div style={{ display: "flex", gap: 8, marginTop: 7 }}><input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading} style={{ flex: 1, minWidth: 0, padding: 13 }} /><button type="button" onClick={() => setShowPassword((value) => !value)} disabled={loading}>{showPassword ? "Hide" : "Show"}</button></div>
          <label style={{ display: "flex", gap: 8, margin: "15px 0" }}><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} disabled={loading} /> Remember Me</label>
          {error && <p role="alert" style={{ color: "#A00000", background: "#FFF3F3", padding: 10, borderRadius: 8 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ width: "100%", padding: 14, background: "#065F2B", color: "white", border: 0, borderRadius: 10, fontWeight: 700 }}>{loading ? "Signing In..." : "Sign In →"}</button>
        </form>
        <p style={{ textAlign: "center" }}><Link href="/forgot-password">Forgot Password?</Link></p>
        <p style={{ textAlign: "center" }}>Don't have an account? <Link href="/register">Create Account</Link></p>
      </section>
    </main>
  );
}
