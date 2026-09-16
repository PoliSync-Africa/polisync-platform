"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

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
    const storedPhone = sessionStorage.getItem("polisync_login_phone") || "";
    if (!storedEmail || !storedChallenge) { window.location.href = "/login"; return; }
    setEmail(storedEmail); setChallengeToken(storedChallenge); setPhone(storedPhone);
  }, []);

  const handleVerify = async (event) => {
    event.preventDefault(); setError(""); setSuccess("");
    const cleanOtp = otp.trim();
    if (!cleanOtp) return setError("Please enter the verification code.");
    if (!/^\d{4,15}$/.test(cleanOtp)) return setError("Please enter a valid verification code.");
    setLoading(true);
    try {
      const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
      if (!API_URL) throw new Error("Production API URL is not configured.");
      const response = await fetch(`${API_URL}/api/auth/verify-login-otp`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ email, code: cleanOtp, challengeToken }) });
      let data = {};
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) data = await response.json(); else { const text = await response.text(); try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text || "Verification failed." }; } }
      if (!response.ok || !data?.success) throw new Error(data?.message || "Invalid or expired verification code.");
      const token = data?.token || data?.accessToken || data?.access_token || null;
      if (!token) throw new Error("Verification succeeded but no authentication token was returned.");
      const user = data?.user || null;
      localStorage.setItem("polisync_token", token); localStorage.setItem("polisync_user", JSON.stringify(user || {}));
      sessionStorage.setItem("polisync_token", token); if (user) sessionStorage.setItem("polisync_user", JSON.stringify(user));
      sessionStorage.removeItem("polisync_login_email"); sessionStorage.removeItem("polisync_login_challenge"); sessionStorage.removeItem("polisync_login_phone"); sessionStorage.removeItem("polisync_login_otp_expires");
      setSuccess("Phone verification successful. Signing you in...");
      window.location.href = user?.platformRole === "super_admin" ? "/super-admin" : "/dashboard";
    } catch (verificationError) { console.error("PoliSync login OTP verification error:", verificationError); setError(verificationError?.message || "Unable to verify the security code."); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    setError(""); setSuccess(""); setResending(true);
    try {
      const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
      if (!API_URL) throw new Error("Production API URL is not configured.");
      const response = await fetch(`${API_URL}/api/auth/resend-login-otp`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ email }) });
      let data = {};
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) data = await response.json(); else { const text = await response.text(); try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text || "Unable to resend code." }; } }
      if (!response.ok || !data?.success) throw new Error(data?.message || "Unable to resend the verification code.");
      if (data?.challengeToken) { sessionStorage.setItem("polisync_login_challenge", data.challengeToken); setChallengeToken(data.challengeToken); }
      if (data?.phone) { sessionStorage.setItem("polisync_login_phone", data.phone); setPhone(data.phone); }
      if (data?.expiresAt) sessionStorage.setItem("polisync_login_otp_expires", data.expiresAt);
      setSuccess(data?.message || "A new verification code has been sent.");
    } catch (resendError) { console.error("PoliSync resend login OTP error:", resendError); setError(resendError?.message || "Unable to resend the verification code."); }
    finally { setResending(false); }
  };

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg,#F8FAF8 0%,#EEF7F0 100%)", display: "flex", justifyContent: "center", alignItems: "center", padding: "24px 16px", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "420px", background: "#FFFFFF", border: "1px solid #D9E3DB", borderRadius: "18px", padding: "28px 28px 24px", boxShadow: "0 8px 28px rgba(6,59,30,.10)" }}>
        <div style={{ textAlign: "center", marginBottom: "22px" }}>
          <div className="brand-lockup" aria-label="PoliSync Africa official logo"><Image src="/polisync-official-logo.svg" alt="PoliSync Africa" width={240} height={136} priority style={{ width: "100%", height: "auto", objectFit: "contain" }} /></div>
          <h1 style={{ margin: "14px 0 0", fontSize: "23px", fontWeight: 700, color: "#123B1E" }}>Verify your phone</h1>
          <p style={{ marginTop: "9px", marginBottom: 0, color: "#5F6B63", fontSize: "14px", lineHeight: 1.5 }}>Enter the security code sent to your registered phone.</p>
          {phone && <p style={{ marginTop: "7px", marginBottom: 0, fontWeight: 600, color: "#123B1E" }}>{phone}</p>}
        </div>
        <form onSubmit={handleVerify}>
          <label style={{ display: "block", marginBottom: "7px", fontWeight: 600, color: "#25332A", fontSize: "14px" }}>Verification code</label>
          <input type="text" inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 15))} placeholder="Enter verification code" disabled={loading} style={{ width: "100%", boxSizing: "border-box", padding: "13px", border: "1px solid #C9D4CC", borderRadius: "10px", fontSize: "18px", letterSpacing: "3px", textAlign: "center", outline: "none", marginBottom: "14px" }} />
          {error && <div style={{ background: "#FFF1F1", color: "#B42318", padding: "11px", borderRadius: "9px", marginBottom: "12px", fontSize: "13px" }}>{error}</div>}
          {success && <div style={{ background: "#ECFDF3", color: "#027A48", padding: "11px", borderRadius: "9px", marginBottom: "12px", fontSize: "13px" }}>{success}</div>}
          <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", border: "none", borderRadius: "10px", background: loading ? "#91A895" : "linear-gradient(90deg,#0A8F3C,#065F2B)", color: "#FFFFFF", fontSize: "15px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>{loading ? "Verifying..." : "Verify & Continue"}</button>
        </form>
        <button type="button" onClick={handleResend} disabled={resending || loading} style={{ width: "100%", marginTop: "10px", padding: "13px", border: "1px solid #176B2C", borderRadius: "10px", background: "#FFFFFF", color: "#176B2C", fontSize: "14px", fontWeight: 700, cursor: resending || loading ? "not-allowed" : "pointer" }}>{resending ? "Sending..." : "Resend security code"}</button>
        <div style={{ textAlign: "center", marginTop: "18px" }}><Link href="/login" style={{ color: "#176B2C", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>Back to login</Link></div>
      </div>
      <style jsx>{`.brand-lockup{width:240px;max-width:72%;margin:0 auto}.brand-lockup img{display:block}.brand-lockup :global(img){width:100%!important;height:auto!important;max-height:136px!important}@media(max-width:520px){.brand-lockup{width:210px;max-width:68%}.brand-lockup :global(img){max-height:120px!important}}`}</style>
    </main>
  );
}
