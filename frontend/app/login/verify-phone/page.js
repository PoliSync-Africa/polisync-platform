"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_BASES = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.BACKEND_URL,
  "https://polisync-platform.onrender.com",
  "https://polisync-platform-1.onrender.com",
].map((value) => String(value || "").replace(/\/+$/, "")).filter((value, index, list) => value && list.indexOf(value) === index);

async function requestJson(path, options = {}) {
  let lastError = null;
  for (const base of API_BASES) {
    try {
      const response = await fetch(`${base}${path}`, {
        ...options,
        headers: { "Content-Type": "application/json", Accept: "application/json", ...(options.headers || {}) },
      });
      const text = await response.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
      if (response.ok || response.status < 500) return { response, data };
      lastError = new Error(data?.message || `Server returned ${response.status}.`);
    } catch (error) { lastError = error; }
  }
  throw lastError || new Error("Unable to connect to the PoliSync server.");
}

export default function VerifyPhoneLoginPage() {
  const [email, setEmail] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("polisync_login_email") || "";
    const storedChallenge = sessionStorage.getItem("polisync_login_challenge") || "";
    if (!storedEmail || !storedChallenge) { window.location.assign("/login"); return; }
    setEmail(storedEmail);
    setChallengeToken(storedChallenge);
    setPhone(sessionStorage.getItem("polisync_login_phone") || "");
  }, []);

  const handleVerify = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    const code = otp.trim();
    if (!/^\d{4,15}$/.test(code)) return setError("Please enter a valid verification code.");
    if (!challengeToken) return setError("Your verification session has expired. Please sign in again.");
    setLoading(true);
    try {
      const { response, data } = await requestJson("/api/auth/verify-login-otp", {
        method: "POST",
        body: JSON.stringify({ email, code, challengeToken, challengeId: challengeToken }),
      });
      if (!response.ok || !data?.success) throw new Error(data?.message || "Invalid or expired verification code.");
      const token = data?.token || data?.accessToken || data?.access_token;
      if (!token) throw new Error("Verification succeeded but no authentication token was returned.");
      const user = data?.user || {};
      localStorage.setItem("polisync_token", token);
      localStorage.setItem("polisync_user", JSON.stringify(user));
      sessionStorage.setItem("polisync_token", token);
      sessionStorage.setItem("polisync_user", JSON.stringify(user));
      ["polisync_login_email", "polisync_login_challenge", "polisync_login_phone", "polisync_login_otp_expires", "polisync_login_otp_minutes"].forEach((key) => sessionStorage.removeItem(key));
      setSuccess("Phone verification successful. Signing you in...");
      window.location.assign(user?.platformRole === "super_admin" ? "/super-admin" : "/dashboard");
    } catch (verificationError) {
      setError(verificationError?.message || "Unable to verify the security code.");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");
    setResending(true);
    try {
      const { response, data } = await requestJson("/api/auth/resend-login-otp", {
        method: "POST",
        body: JSON.stringify({ email, challengeToken, challengeId: challengeToken }),
      });
      if (!response.ok || !data?.success) throw new Error(data?.message || "Unable to resend the verification code.");
      const nextChallenge = data?.challengeToken || data?.challengeId || challengeToken;
      setChallengeToken(nextChallenge);
      sessionStorage.setItem("polisync_login_challenge", String(nextChallenge));
      if (data?.phone) { setPhone(data.phone); sessionStorage.setItem("polisync_login_phone", data.phone); }
      setSuccess(data?.message || "A new verification code has been sent.");
    } catch (resendError) { setError(resendError?.message || "Unable to resend the verification code."); }
    finally { setResending(false); }
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 16, background: "linear-gradient(135deg,#F8FAF8,#EEF7F0)" }}>
      <section style={{ width: "100%", maxWidth: 420, background: "#fff", padding: 28, borderRadius: 18, boxShadow: "0 8px 28px rgba(6,59,30,.10)" }}>
        <div style={{ textAlign: "center" }}><img src="/polisync-official-logo.svg" alt="PoliSync Africa" style={{ width: 220, maxWidth: "80%" }} /></div>
        <h1 style={{ textAlign: "center", color: "#065F2B" }}>Verify your phone</h1>
        <p style={{ textAlign: "center", color: "#66736B" }}>{phone ? `Enter the code sent to ${phone}.` : "Enter the security code sent to your registered phone."}</p>
        <form onSubmit={handleVerify}>
          <input inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 15))} disabled={loading} placeholder="Verification code" style={{ width: "100%", boxSizing: "border-box", padding: 14, textAlign: "center", letterSpacing: 3 }} />
          {error && <p role="alert" style={{ color: "#A00000", background: "#FFF3F3", padding: 10, borderRadius: 8 }}>{error}</p>}
          {success && <p style={{ color: "#027A48", background: "#ECFDF3", padding: 10, borderRadius: 8 }}>{success}</p>}
          <button type="submit" disabled={loading} style={{ width: "100%", padding: 14, marginTop: 12, background: "#065F2B", color: "white", border: 0, borderRadius: 10, fontWeight: 700 }}>{loading ? "Verifying..." : "Verify & Continue"}</button>
        </form>
        <button type="button" onClick={handleResend} disabled={resending || loading} style={{ width: "100%", padding: 13, marginTop: 10, background: "white", color: "#065F2B", border: "1px solid #065F2B", borderRadius: 10 }}>{resending ? "Sending..." : "Resend security code"}</button>
        <p style={{ textAlign: "center" }}><Link href="/login">Back to login</Link></p>
      </section>
    </main>
  );
}
