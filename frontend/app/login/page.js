"use client";

import Link from "next/link";
import { useState } from "react";

const API_DEFAULT = "https://polisync-platform-1.onrender.com";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return setError("Please enter your email address.");
    if (!password) return setError("Please enter your password.");
    setLoading(true);

    try {
      const configured = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
      const apiBases = [configured, API_DEFAULT].filter((value, index, list) => value && list.indexOf(value) === index);
      let response = null;
      let data = {};
      let lastError = null;

      for (const base of apiBases) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
          response = await fetch(`${base}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ email: normalizedEmail, password }),
            signal: controller.signal,
          });
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("application/json")) data = await response.json().catch(() => ({}));
          else {
            const text = await response.text();
            try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text || "Login request failed." }; }
          }
          break;
        } catch (err) {
          lastError = err;
          response = null;
        } finally {
          clearTimeout(timeout);
        }
      }

      if (!response) {
        if (lastError?.name === "AbortError") throw new Error("The server is taking too long to respond. Please try again.");
        throw new Error("Unable to connect to the PoliSync server. Please try again.");
      }

      if (response.status === 202 && data?.success === true && data?.code === "PHONE_OTP_REQUIRED") {
        sessionStorage.setItem("polisync_login_email", normalizedEmail);
        sessionStorage.setItem("polisync_login_challenge", String(data.challengeToken || ""));
        sessionStorage.setItem("polisync_login_phone", String(data.phone || ""));
        sessionStorage.setItem("polisync_login_otp_expires", String(data.expiresAt || ""));
        sessionStorage.setItem("polisync_login_otp_minutes", String(data.expiresInMinutes || 5));
        window.location.href = "/login/verify-phone";
        return;
      }

      if (!response.ok) throw new Error(data?.message || data?.error || "Invalid email or password.");
      if (data?.success === false) throw new Error(data?.message || data?.error || "Login failed.");
      const token = data?.token || data?.accessToken || data?.access_token || null;
      if (!token) throw new Error("Login succeeded but no authentication token was returned.");

      const storage = remember ? localStorage : sessionStorage;
      storage.setItem("polisync_token", token);
      if (data?.user) storage.setItem("polisync_user", JSON.stringify(data.user));
      if (remember) localStorage.setItem("polisync_remember", "true");
      else localStorage.removeItem("polisync_remember");

      window.location.href = data?.user?.platformRole === "super_admin" ? "/super-admin" : "/dashboard";
    } catch (loginError) {
      console.error("PoliSync login error:", loginError);
      setError(loginError?.message || "Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#F8FAF8 0%,#EEF7F0 100%)", display: "flex", justifyContent: "center", alignItems: "center", padding: "24px 16px", boxSizing: "border-box" }}>
      <div style={{ width: "100%", maxWidth: "420px", margin: "0 auto", background: "#FFFFFF", border: "1px solid #D9E3DB", borderRadius: "18px", padding: "28px 28px 24px", boxSizing: "border-box", boxShadow: "0 8px 28px rgba(6,59,30,.10)" }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div className="brand-lockup" aria-label="PoliSync Africa official logo">
            <img src="/polisync-official-logo.svg" alt="PoliSync Africa" />
          </div>
        </div>
        <h1 style={{ textAlign: "center", fontSize: "25px", lineHeight: "1.2", fontWeight: "750", color: "#065F2B", margin: "0 0 6px" }}>Welcome Back</h1>
        <p style={{ textAlign: "center", color: "#66736B", fontSize: "14px", lineHeight: "1.5", margin: "0 0 24px" }}>Sign in to your PoliSync Africa account</p>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "15px" }}><label htmlFor="email" style={{ display: "block", fontWeight: "650", color: "#222", marginBottom: "7px", fontSize: "14px" }}>Email Address</label><input id="email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" disabled={loading} style={{ width: "100%", boxSizing: "border-box", padding: "13px 15px", borderRadius: "10px", border: "1px solid #C9D4CC", background: loading ? "#F5F7F5" : "#FFFFFF", fontSize: "16px", outline: "none" }} /></div>
          <div style={{ marginBottom: "10px" }}><label htmlFor="password" style={{ display: "block", fontWeight: "650", color: "#222", marginBottom: "7px", fontSize: "14px" }}>Password</label><div style={{ position: "relative", width: "100%" }}><input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" disabled={loading} style={{ width: "100%", boxSizing: "border-box", padding: "13px 65px 13px 15px", borderRadius: "10px", border: "1px solid #C9D4CC", background: loading ? "#F5F7F5" : "#FFFFFF", fontSize: "16px", outline: "none" }} /><button type="button" onClick={() => setShowPassword(!showPassword)} disabled={loading} aria-label={showPassword ? "Hide password" : "Show password"} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#065F2B", cursor: loading ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "13px", padding: "4px" }}>{showPassword ? "Hide" : "Show"}</button></div></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", margin: "13px 0 20px", fontSize: "13px" }}><label style={{ display: "flex", alignItems: "center", gap: "7px", cursor: "pointer", color: "#333" }}><input type="checkbox" checked={remember} onChange={() => setRemember(!remember)} disabled={loading} style={{ width: "16px", height: "16px", cursor: "pointer" }} /><span>Remember Me</span></label><Link href="/forgot-password" style={{ color: "#065F2B", textDecoration: "none", fontWeight: "700", whiteSpace: "nowrap" }}>Forgot Password?</Link></div>
          {error && <div role="alert" style={{ marginBottom: "14px", padding: "11px 12px", borderRadius: "10px", background: "#FFF3F3", border: "1px solid #F0CACA", color: "#A00000", fontSize: "13px", lineHeight: "1.4" }}>{error}</div>}
          <button className="auth-action" type="submit" disabled={loading} aria-busy={loading} style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "none", background: loading ? "#7BAE8D" : "linear-gradient(90deg,#0A8F3C,#065F2B)", color: "#FFFFFF", fontSize: "16px", fontWeight: "800", cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 9px 22px rgba(6,95,43,.20)", transition: "transform .16s ease, box-shadow .25s ease, filter .25s ease" }}>
            {loading ? <span className="button-content"><span className="spinner" aria-hidden="true" /> Signing In...</span> : <span className="button-content"><span>Sign In</span><span className="arrow" aria-hidden="true">→</span></span>}
          </button>
        </form>
        <div style={{ textAlign: "center", marginTop: "22px", color: "#555", fontSize: "14px", lineHeight: "1.6" }}><div>Don't have an account?</div><Link className="auth-link" href="/register" style={{ display: "inline-block", marginTop: "2px", color: "#B08A16", textDecoration: "none", fontWeight: "800", fontSize: "15px" }}>Create Account</Link></div>
        <footer style={{ textAlign: "center", marginTop: "24px", paddingTop: "15px", borderTop: "1px solid #E8E8E8", color: "#7A817C", fontSize: "11px", lineHeight: "1.6" }}><div style={{ fontWeight: "700", color: "#065F2B", fontSize: "11px" }}>PoliSync Africa™ is powered by SyncTech Co. Ltd.</div><div>© 2026 SyncTech Co. Ltd. All rights reserved.</div></footer>
      </div>
      <style jsx>{` .brand-lockup { width: 240px; max-width: 72%; margin: 0 auto; } .brand-lockup img { display: block; width: 100%; height: auto; max-height: 136px; object-fit: contain; } .auth-action { position: relative; overflow: hidden; } .auth-action::after { content: ""; position: absolute; inset: 0; transform: translateX(-110%); background: linear-gradient(105deg, transparent 25%, rgba(255,255,255,.24) 50%, transparent 75%); pointer-events: none; } .auth-action:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 12px 26px rgba(6,95,43,.28) !important; filter: brightness(1.04); } .auth-action:not(:disabled):hover::after { animation: buttonShine .7s ease; } .auth-action:not(:disabled):active { transform: scale(.975); } .button-content { position: relative; z-index: 1; display: inline-flex; align-items: center; justify-content: center; gap: 9px; } .arrow { display: inline-block; transition: transform .2s ease; } .auth-action:not(:disabled):hover .arrow { transform: translateX(3px); } .spinner { width: 17px; height: 17px; border: 2px solid rgba(255,255,255,.42); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; } .auth-link { transition: transform .18s ease, opacity .18s ease; } .auth-link:hover { transform: translateY(-1px); opacity: .84; } .auth-link:active { transform: scale(.96); } @keyframes buttonShine { from { transform: translateX(-110%); } to { transform: translateX(110%); } } @keyframes spin { to { transform: rotate(360deg); } } @media (max-width: 520px) { .brand-lockup { width: 210px; max-width: 68%; } .brand-lockup img { max-height: 120px; } } @media (prefers-reduced-motion: reduce) { .auth-action, .auth-link, .arrow { transition: none; } .auth-action::after, .spinner { animation: none; } } `}</style>
    </main>
  );
}
