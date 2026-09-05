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

    const storedChallenge =
      sessionStorage.getItem("polisync_login_challenge") || "";

    const storedPhone = sessionStorage.getItem("polisync_login_phone") || "";

    if (!storedEmail || !storedChallenge) {
      window.location.href = "/login";
      return;
    }

    setEmail(storedEmail);
    setChallengeToken(storedChallenge);
    setPhone(storedPhone);
  }, []);

  const handleVerify = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanOtp = otp.trim();

    if (!cleanOtp) {
      setError("Please enter the verification code.");
      return;
    }

    if (!/^\d{4,15}$/.test(cleanOtp)) {
      setError("Please enter a valid verification code.");
      return;
    }

    setLoading(true);

    try {
      const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(
        /\/+$/,
        ""
      );

      if (!API_URL) {
        throw new Error("Production API URL is not configured.");
      }

      const response = await fetch(`${API_URL}/api/auth/verify-login-otp`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Accept: "application/json",
        },

        body: JSON.stringify({
          email,
          code: cleanOtp,
          challengeToken,
        }),
      });

      let data = {};

      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();

        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = {
            message: text || "Verification failed.",
          };
        }
      }

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || "Invalid or expired verification code."
        );
      }

      const token =
        data?.token || data?.accessToken || data?.access_token || null;

      if (!token) {
        throw new Error(
          "Verification succeeded but no authentication token was returned."
        );
      }

      const user = data?.user || null;

      localStorage.removeItem("polisync_token");

      localStorage.removeItem("polisync_user");

      sessionStorage.removeItem("polisync_token");

      sessionStorage.removeItem("polisync_user");

      sessionStorage.setItem("polisync_token", token);

      if (user) {
        sessionStorage.setItem("polisync_user", JSON.stringify(user));
      }

      sessionStorage.removeItem("polisync_login_email");

      sessionStorage.removeItem("polisync_login_challenge");

      sessionStorage.removeItem("polisync_login_phone");

      sessionStorage.removeItem("polisync_login_otp_expires");

      setSuccess("Phone verification successful. Signing you in...");

      if (user?.platformRole === "super_admin") {
        window.location.href = "/super-admin";
        return;
      }

      window.location.href = "/dashboard";
    } catch (verificationError) {
      console.error(
        "PoliSync login OTP verification error:",
        verificationError
      );

      setError(
        verificationError?.message || "Unable to verify the security code."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");
    setResending(true);

    try {
      const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(
        /\/+$/,
        ""
      );

      if (!API_URL) {
        throw new Error("Production API URL is not configured.");
      }

      const response = await fetch(`${API_URL}/api/auth/resend-login-otp`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Accept: "application/json",
        },

        body: JSON.stringify({
          email,
        }),
      });

      let data = {};

      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();

        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = {
            message: text || "Unable to resend code.",
          };
        }
      }

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || "Unable to resend the verification code."
        );
      }

      if (data?.challengeToken) {
        sessionStorage.setItem("polisync_login_challenge", data.challengeToken);

        setChallengeToken(data.challengeToken);
      }

      if (data?.phone) {
        sessionStorage.setItem("polisync_login_phone", data.phone);

        setPhone(data.phone);
      }

      if (data?.expiresAt) {
        sessionStorage.setItem("polisync_login_otp_expires", data.expiresAt);
      }

      setSuccess(data?.message || "A new verification code has been sent.");
    } catch (resendError) {
      console.error("PoliSync resend login OTP error:", resendError);

      setError(
        resendError?.message || "Unable to resend the verification code."
      );
    } finally {
      setResending(false);
    }
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
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "#FFFFFF",
          borderRadius: "20px",
          padding: "32px 24px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.10)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "28px",
          }}
        >
          <Image
            src="/logo.png"
            alt="PoliSync Africa"
            width={72}
            height={72}
            style={{
              objectFit: "contain",
              marginBottom: "12px",
            }}
          />

          <h1
            style={{
              margin: 0,
              fontSize: "25px",
              fontWeight: 700,
              color: "#123B1E",
            }}
          >
            Verify your phone
          </h1>

          <p
            style={{
              marginTop: "10px",
              marginBottom: 0,
              color: "#5F6B63",
              fontSize: "15px",
              lineHeight: 1.5,
            }}
          >
            Enter the security code sent to your registered phone.
          </p>

          {phone && (
            <p
              style={{
                marginTop: "8px",
                marginBottom: 0,
                fontWeight: 600,
                color: "#123B1E",
              }}
            >
              {phone}
            </p>
          )}
        </div>

        <form onSubmit={handleVerify}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
              color: "#25332A",
            }}
          >
            Verification code
          </label>

          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={(event) =>
              setOtp(event.target.value.replace(/\D/g, "").slice(0, 15))
            }
            placeholder="Enter verification code"
            disabled={loading}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "15px",
              border: "1px solid #C9D4CC",
              borderRadius: "10px",
              fontSize: "18px",
              letterSpacing: "3px",
              textAlign: "center",
              outline: "none",
              marginBottom: "16px",
            }}
          />

          {error && (
            <div
              style={{
                background: "#FFF1F1",
                color: "#B42318",
                padding: "12px",
                borderRadius: "9px",
                marginBottom: "14px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                background: "#ECFDF3",
                color: "#027A48",
                padding: "12px",
                borderRadius: "9px",
                marginBottom: "14px",
                fontSize: "14px",
              }}
            >
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              border: "none",
              borderRadius: "10px",
              background: loading ? "#91A895" : "#176B2C",
              color: "#FFFFFF",
              fontSize: "16px",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Verifying..." : "Verify & Continue"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending || loading}
          style={{
            width: "100%",
            marginTop: "12px",
            padding: "14px",
            border: "1px solid #176B2C",
            borderRadius: "10px",
            background: "#FFFFFF",
            color: "#176B2C",
            fontSize: "15px",
            fontWeight: 700,
            cursor: resending || loading ? "not-allowed" : "pointer",
          }}
        >
          {resending ? "Sending..." : "Resend security code"}
        </button>

        <div
          style={{
            textAlign: "center",
            marginTop: "20px",
          }}
        >
          <Link
            href="/login"
            style={{
              color: "#176B2C",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Back to login
          </Link>
        </div>
      </div>
    </main>
  );
}
