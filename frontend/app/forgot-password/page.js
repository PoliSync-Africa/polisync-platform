"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export default function ForgotPasswordPage() {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const requestReset = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return setError("Please enter your email address.");

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await readJson(response);
      if (!response.ok || data?.success === false) throw new Error(data?.message || "Unable to request a password reset.");
      setEmail(normalizedEmail);
      setMessage("If an account exists for this email, a 6-digit reset code has been sent to it.");
      setStep("code");
    } catch (requestError) {
      setError(requestError?.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const normalizedCode = code.trim();
    if (!/^\d{6}$/.test(normalizedCode)) return setError("Enter the 6-digit code sent to your email.");

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, code: normalizedCode }),
      });
      const data = await readJson(response);
      if (!response.ok || data?.success === false) throw new Error(data?.message || "The reset code is invalid or expired.");
      setMessage("Code verified. Create a new password below.");
      setStep("password");
    } catch (verifyError) {
      setError(verifyError?.message || "Unable to verify the reset code.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 8) return setError("Your new password must contain at least 8 characters.");
    if (password !== confirmPassword) return setError("The passwords do not match.");

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, code, newPassword: password }),
      });
      const data = await readJson(response);
      if (!response.ok || data?.success === false) throw new Error(data?.message || "Password reset failed.");
      setMessage("Password reset successfully. You can now sign in with your new password.");
      setStep("done");
    } catch (resetError) {
      setError(resetError?.message || "Unable to reset your password.");
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await readJson(response);
      if (!response.ok || data?.success === false) throw new Error(data?.message || "Unable to resend the code.");
      setCode("");
      setMessage("A new reset code has been sent to your email.");
    } catch (resendError) {
      setError(resendError?.message || "Unable to resend the reset code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <Image src="/IMG_9654.jpeg" alt="PoliSync Africa" width={240} height={150} priority style={{ width: 240, height: "auto", maxWidth: "100%", objectFit: "contain" }} />
        </div>

        {step === "email" && (
          <>
            <h1 style={styles.title}>Forgot Password?</h1>
            <p style={styles.subtitle}>Enter the email address registered to your PoliSync Africa account.</p>
            <form onSubmit={requestReset}>
              <label style={styles.label} htmlFor="email">Email Address</label>
              <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" disabled={loading} style={styles.input} />
              <button disabled={loading} style={styles.button}>{loading ? "Sending Code..." : "Send Reset Code"}</button>
            </form>
          </>
        )}

        {step === "code" && (
          <>
            <h1 style={styles.title}>Enter Reset Code</h1>
            <p style={styles.subtitle}>Enter the 6-digit code sent to <strong>{email}</strong>. The code expires in 15 minutes.</p>
            <form onSubmit={verifyCode}>
              <label style={styles.label} htmlFor="code">6-Digit Reset Code</label>
              <input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" disabled={loading} style={{ ...styles.input, letterSpacing: 8, textAlign: "center", fontWeight: 800 }} />
              <button disabled={loading} style={styles.button}>{loading ? "Verifying..." : "Verify Code"}</button>
            </form>
            <button type="button" onClick={resendCode} disabled={loading} style={styles.linkButton}>{loading ? "Please wait..." : "Resend Code"}</button>
            <button type="button" onClick={() => { setStep("email"); setMessage(""); setError(""); }} style={styles.secondaryButton}>Change Email</button>
          </>
        )}

        {step === "password" && (
          <>
            <h1 style={styles.title}>Create New Password</h1>
            <p style={styles.subtitle}>Choose a new password with at least 8 characters.</p>
            <form onSubmit={resetPassword}>
              <label style={styles.label} htmlFor="new-password">New Password</label>
              <div style={{ position: "relative" }}>
                <input id="new-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter new password" disabled={loading} style={{ ...styles.input, paddingRight: 75 }} />
                <button type="button" onClick={() => setShowPassword((value) => !value)} style={styles.showButton}>{showPassword ? "Hide" : "Show"}</button>
              </div>
              <label style={styles.label} htmlFor="confirm-password">Confirm New Password</label>
              <input id="confirm-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" disabled={loading} style={styles.input} />
              <button disabled={loading} style={styles.button}>{loading ? "Resetting..." : "Reset Password"}</button>
            </form>
          </>
        )}

        {step === "done" && (
          <div style={{ textAlign: "center" }}>
            <div style={styles.successIcon}>✓</div>
            <h1 style={styles.title}>Password Reset Complete</h1>
            <p style={styles.subtitle}>{message}</p>
            <Link href="/login" style={styles.buttonLink}>Return to Login</Link>
          </div>
        )}

        {message && step !== "done" && <div role="status" style={styles.success}>{message}</div>}
        {error && <div role="alert" style={styles.error}>{error}</div>}

        {step !== "done" && <div style={styles.footer}><Link href="/login" style={styles.loginLink}>← Back to Login</Link></div>}
      </div>
    </main>
  );
}

async function readJson(response) {
  const type = response.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    try { return await response.json(); } catch { return {}; }
  }
  const text = await response.text();
  try { return text ? JSON.parse(text) : {}; } catch { return { message: text }; }
}

const styles = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg,#F8FAF8 0%,#EEF7F0 100%)", display: "flex", justifyContent: "center", alignItems: "center", padding: "24px 16px", boxSizing: "border-box" },
  card: { width: "100%", maxWidth: 560, background: "#fff", border: "3px solid #B89A4A", borderRadius: 34, padding: "34px 28px", boxSizing: "border-box", boxShadow: "0 12px 35px rgba(0,0,0,.08)" },
  title: { textAlign: "center", color: "#065F2B", fontSize: 28, margin: "8px 0 8px", fontWeight: 800 },
  subtitle: { textAlign: "center", color: "#666", fontSize: 14, lineHeight: 1.55, margin: "0 0 24px" },
  label: { display: "block", color: "#222", fontSize: 14, fontWeight: 700, margin: "0 0 8px" },
  input: { width: "100%", boxSizing: "border-box", padding: "15px 17px", borderRadius: 12, border: "3px solid #B89A4A", background: "#fff", fontSize: 16, outline: "none", marginBottom: 16 },
  button: { width: "100%", padding: 15, border: 0, borderRadius: 12, background: "linear-gradient(90deg,#0A8F3C,#065F2B)", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 10px 25px rgba(6,95,43,.22)" },
  showButton: { position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", border: 0, background: "transparent", color: "#065F2B", fontWeight: 700, cursor: "pointer" },
  linkButton: { width: "100%", marginTop: 14, padding: 11, border: 0, background: "transparent", color: "#065F2B", fontWeight: 800, cursor: "pointer" },
  secondaryButton: { width: "100%", padding: 10, border: 0, background: "transparent", color: "#777", cursor: "pointer" },
  success: { marginTop: 16, padding: "12px 14px", borderRadius: 12, background: "#EEF9F1", border: "1px solid #B7DCC1", color: "#176332", fontSize: 13, lineHeight: 1.45 },
  error: { marginTop: 16, padding: "12px 14px", borderRadius: 12, background: "#FFF3F3", border: "1px solid #F0CACA", color: "#A00000", fontSize: 13, lineHeight: 1.45 },
  footer: { marginTop: 24, paddingTop: 18, borderTop: "1px solid #E8E8E8", textAlign: "center" },
  loginLink: { color: "#065F2B", textDecoration: "none", fontWeight: 800, fontSize: 14 },
  buttonLink: { display: "block", width: "100%", boxSizing: "border-box", padding: 15, borderRadius: 12, background: "linear-gradient(90deg,#0A8F3C,#065F2B)", color: "#fff", textDecoration: "none", fontWeight: 800 },
  successIcon: { width: 64, height: 64, margin: "8px auto 18px", borderRadius: "50%", display: "grid", placeItems: "center", background: "#065F2B", color: "#fff", fontSize: 32, fontWeight: 900 },
};
