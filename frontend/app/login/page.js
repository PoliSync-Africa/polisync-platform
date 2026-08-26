"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [showPassword, setShowPassword] =
    useState(false);

  const [remember, setRemember] =
    useState(false);

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  // ==========================================================
  // LOGIN
  // ==========================================================

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    if (!password) {
      setError(
        "Please enter your password."
      );
      return;
    }

    setLoading(true);

    try {
      // ========================================================
      // POLISYNC PRODUCTION BACKEND
      // ========================================================

      const API_URL = (
        process.env.NEXT_PUBLIC_API_URL || ""
      ).replace(/\/+$/, "");

      if (!API_URL) {
        throw new Error(
          "Production API URL is not configured."
        );
      }

      // ========================================================
      // LOGIN REQUEST
      // ========================================================

      const controller =
        new AbortController();

      const timeout =
        setTimeout(() => {
          controller.abort();
        }, 90000);

      let response;

      try {
        response = await fetch(
          `${API_URL}/api/auth/login`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            credentials:
              "include",

            body:
              JSON.stringify({
                email:
                  normalizedEmail,

                password:
                  password,
              }),

            signal:
              controller.signal,
          }
        );
      } finally {
        clearTimeout(timeout);
      }

      // ========================================================
      // READ SERVER RESPONSE
      // ========================================================

      let data = {};

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        try {
          data =
            await response.json();
        } catch {
          data = {};
        }
      } else {
        const text =
          await response.text();

        try {
          data =
            text
              ? JSON.parse(text)
              : {};
        } catch {
          data = {
            message:
              text ||
              "Login request failed.",
          };
        }
      }

      // ========================================================
      // LOGIN FAILED
      // ========================================================

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Invalid email or password."
        );
      }

      if (
        Object.prototype.hasOwnProperty.call(
          data,
          "success"
        ) &&
        data.success === false
      ) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Login failed."
        );
      }

      // ========================================================
      // SAVE AUTHENTICATION TOKEN
      // ========================================================

      const token =
        data?.token ||
        data?.accessToken ||
        data?.access_token ||
        null;

      if (token) {
        if (remember) {
          localStorage.setItem(
            "polisync_token",
            token
          );
        } else {
          sessionStorage.setItem(
            "polisync_token",
            token
          );
        }
      }

      // ========================================================
      // SAVE USER INFORMATION
      // ========================================================

      if (data?.user) {
        const userData =
          JSON.stringify(
            data.user
          );

        if (remember) {
          localStorage.setItem(
            "polisync_user",
            userData
          );
        } else {
          sessionStorage.setItem(
            "polisync_user",
            userData
          );
        }
      }

      // ========================================================
      // SAVE REMEMBER-ME PREFERENCE
      // ========================================================

      if (remember) {
        localStorage.setItem(
          "polisync_remember",
          "true"
        );
      } else {
        localStorage.removeItem(
          "polisync_remember"
        );
      }

      // ========================================================
      // LOGIN SUCCESS
      // ========================================================

      window.location.href =
        "/dashboard";

    } catch (loginError) {
      console.error(
        "PoliSync login error:",
        loginError
      );

      if (
        loginError?.name ===
        "AbortError"
      ) {
        setError(
          "The server is taking too long to respond. Please try again."
        );
      } else if (
        loginError?.message ===
        "Production API URL is not configured."
      ) {
        setError(
          "The production server is not configured correctly."
        );
      } else {
        setError(
          loginError?.message ||
            "Unable to connect to the server. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <main
      style={{
        minHeight: "100vh",

        background:
          "linear-gradient(135deg,#F8FAF8 0%,#EEF7F0 100%)",

        display:
          "flex",

        justifyContent:
          "center",

        alignItems:
          "center",

        padding:
          "24px 16px",

        boxSizing:
          "border-box",
      }}
    >
      <div
  style={{
    width: "100%",
    maxWidth: "680px",
    margin: "0 auto",

    background: "#FFFFFF",

    border: "3px solid #B89A4A",
    borderRadius: "42px",

    padding: "40px 34px",

    boxSizing: "border-box",

    boxShadow:
      "0 12px 35px rgba(0, 0, 0, 0.08)",
  }}
>
        {/* ==================================================
            POLISYNC LOGO
        ================================================== */}

        <div
          style={{
            display:
              "flex",

            justifyContent:
              "center",

            alignItems:
              "center",

            marginBottom:
              "8px",
          }}
        >
          <Image
            src="/IMG_9654.jpeg"
            alt="PoliSync Africa"
            width={280}
            height={180}
            priority
            style={{
              width:
                "280px",

              height:
                "auto",

              maxWidth:
                "100%",

              objectFit:
                "contain",
            }}
          />
        </div>

        {/* ==================================================
            WELCOME
        ================================================== */}

        <h1
          style={{
            textAlign:
              "center",

            fontSize:
              "27px",

            lineHeight:
              "1.2",

            fontWeight:
              "750",

            color:
              "#065F2B",

            margin:
              "4px 0 6px",
          }}
        >
          Welcome Back
        </h1>

        <p
          style={{
            textAlign:
              "center",

            color:
              "#666",

            fontSize:
              "14px",

            lineHeight:
              "1.5",

            margin:
              "0 0 26px",
          }}
        >
          Sign in to your PoliSync Africa account
        </p>

        {/* ==================================================
            LOGIN FORM
        ================================================== */}

        <form
          onSubmit={
            handleLogin
          }
        >

          {/* EMAIL */}

          <div
            style={{
              marginBottom:
                "17px",
            }}
          >
            <label
              htmlFor="email"
              style={{
                display:
                  "block",

                fontWeight:
                  "650",

                color:
                  "#222",

                marginBottom:
                  "8px",

                fontSize:
                  "15px",
              }}
            >
              Email Address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="Enter your email"
              disabled={loading}
              style={{
                width:
                  "100%",

                boxSizing:
                  "border-box",

                padding:
                  "15px 18px",

                borderRadius:
                  "999px",

                border:
  "3px solid #B89A4A",

background:
  loading
    ? "#F5F5F5"
    : "#FFFFFF",

fontSize:
  "16px",

outline:
  "none",
              }}
            />
          </div>

          {/* PASSWORD */}

          <div
            style={{
              marginBottom:
                "12px",
            }}
          >
            <label
              htmlFor="password"
              style={{
                display:
                  "block",

                fontWeight:
                  "650",

                color:
                  "#222",

                marginBottom:
                  "8px",

                fontSize:
                  "15px",
              }}
            >
              Password
            </label>

            <div
              style={{
                position:
                  "relative",

                width:
                  "100%",
              }}
            >
              <input
                id="password"
                name="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter your password"
                disabled={loading}
                style={{
                  width:
                    "100%",

                  boxSizing:
                    "border-box",

                  padding:
                    "15px 70px 15px 18px",

                  borderRadius:
                    "999px",

                  border:
                    "1.5px solid #D8D8D8",

                  background:
                    loading
                      ? "#F5F5F5"
                      : "#FFFFFF",

                  fontSize:
                    "16px",

                  outline:
                    "none",
                }}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                disabled={loading}
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                style={{
                  position:
                    "absolute",

                  right:
                    "16px",

                  top:
                    "50%",

                  transform:
                    "translateY(-50%)",

                  background:
                    "transparent",

                  border:
                    "none",

                  color:
                    "#065F2B",

                  cursor:
                    loading
                      ? "not-allowed"
                      : "pointer",

                  fontWeight:
                    "700",

                  fontSize:
                    "14px",

                  padding:
                    "4px",
                }}
              >
                {showPassword
                  ? "Hide"
                  : "Show"}
              </button>
            </div>
          </div>

          {/* REMEMBER / FORGOT */}

          <div
            style={{
              display:
                "flex",

              justifyContent:
                "space-between",

              alignItems:
                "center",

              gap:
                "12px",

              margin:
                "14px 0 24px",

              fontSize:
                "14px",
            }}
          >
            <label
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                gap:
                  "8px",

                cursor:
                  "pointer",

                color:
                  "#333",
              }}
            >
              <input
                type="checkbox"
                checked={
                  remember
                }
                onChange={() =>
                  setRemember(
                    !remember
                  )
                }
                disabled={loading}
                style={{
                  width:
                    "17px",

                  height:
                    "17px",

                  cursor:
                    "pointer",
                }}
              />

              <span>
                Remember Me
              </span>
            </label>

            <Link
              href="/forgot-password"
              style={{
                color:
                  "#065F2B",

                textDecoration:
                  "none",

                fontWeight:
                  "700",

                whiteSpace:
                  "nowrap",
              }}
            >
              Forgot Password?
            </Link>
          </div>

          {/* ERROR */}

          {error && (
            <div
              role="alert"
              style={{
                marginBottom:
                  "16px",

                padding:
                  "12px 14px",

                borderRadius:
                  "12px",

                background:
                  "#FFF3F3",

                border:
                  "1px solid #F0CACA",

                color:
                  "#A00000",

                fontSize:
                  "14px",

                lineHeight:
                  "1.4",
              }}
            >
              {error}
            </div>
          )}

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            disabled={loading}
            style={{
              width:
                "100%",

              padding:
                "16px",

              borderRadius:
  "12px",

              border:
                "none",

              background:
                loading
                  ? "#7BAE8D"
                  : "linear-gradient(90deg,#0A8F3C,#065F2B)",

              color:
                "#FFFFFF",

              fontSize:
                "17px",

              fontWeight:
                "800",

              cursor:
                loading
                  ? "not-allowed"
                  : "pointer",

              boxShadow:
                "0 12px 30px rgba(6,95,43,.25)",

              transition:
                "all .2s ease",
            }}
          >
            {loading
              ? "Signing In..."
              : "Login"}
          </button>

        </form>

        {/* ==================================================
            CREATE ACCOUNT
        ================================================== */}

        <div
          style={{
            textAlign:
              "center",

            marginTop:
              "27px",

            color:
              "#555",

            fontSize:
              "15px",

            lineHeight:
              "1.6",
          }}
        >
          <div>
            Don't have an account?
          </div>

          <Link
            href="/register"
            style={{
              display:
                "inline-block",

              marginTop:
                "3px",

              color:
                "#C9A227",

              textDecoration:
                "none",

              fontWeight:
                "800",

              fontSize:
                "16px",
            }}
          >
            Create Account
          </Link>
        </div>

        {/* ==================================================
            BRAND FOOTER
        ================================================== */}

        <footer
          style={{
            textAlign:
              "center",

            marginTop:
              "30px",

            paddingTop:
              "18px",

            borderTop:
              "1px solid #E8E8E8",

            color:
              "#777",

            fontSize:
              "12px",

            lineHeight:
              "1.7",
          }}
        >
          <div
            style={{
              fontWeight:
                "700",

              color:
                "#065F2B",

              fontSize:
                "12px",
            }}
          >
            PoliSync Africa-
            Africa Best Political
            Intelligence Platform
          </div>

          <div>
            Powered by{" "}
            <strong>
              SyncTech Technologies
            </strong>
          </div>

          <div>
            All rights reserved
          </div>
        </footer>

      </div>
    </main>
  );
}


<div
  style={{
    width:
      "100%",

    maxWidth:
      "440px",

    background:
      "#FFFFFF",

    borderRadius:
      "30px",

    padding:
      "28px 26px 24px",

    boxShadow:
      "0 20px 60px rgba(0,0,0,.08)",

    border:
      "1px solid rgba(0,0,0,.05)",

    boxSizing:
      "border-box",
  }}
>
