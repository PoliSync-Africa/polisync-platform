"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    accountType: "individual",
  });

  function update(field, value) {
    setForm({ ...form, [field]: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.fullName || !form.email || !form.phone || !form.password) {
      alert("Please complete all required fields.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Registration failed.");
        return;
      }

      alert("Account created successfully!");
      window.location.href = "/login";
    } catch {
      alert("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "16px",
    borderRadius: "999px",
    border: "1.5px solid #D8D8D8",
    fontSize: "16px",
    outline: "none",
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
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "450px",
          background: "#FFF",
          borderRadius: "32px",
          padding: "34px 28px",
          boxShadow: "0 20px 60px rgba(0,0,0,.08)",
        }}
      >
        <div className="polisync-logo-wrapper">
          <Image
            src="/IMG_9654.jpeg"
            alt="PoliSync Africa"
            width={220}
            height={220}
            priority
            className="polisync-logo"
          />
        </div>

        <h1
          style={{
            textAlign: "center",
            color: "#065F2B",
            fontSize: "32px",
            fontWeight: "800",
            marginBottom: "8px",
          }}
        >
          Create Account
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#666",
            marginBottom: "28px",
          }}
        >
          Join PoliSync Africa for free.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <input
            placeholder="Full Name"
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            style={inputStyle}
          />

          <input
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            style={inputStyle}
          />

          <input
            type="tel"
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            style={inputStyle}
          />

          <select
            value={form.accountType}
            onChange={(e) => update("accountType", e.target.value)}
            style={{
              ...inputStyle,
              borderRadius: "18px",
            }}
          >
            <option value="individual">Individual</option>
            <option value="organization">Organization</option>
            <option value="political-party">Political Party</option>
          </select>

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "17px",
              borderRadius: "999px",
              border: "none",
              background: "linear-gradient(90deg,#0A8F3C,#065F2B)",
              color: "#FFF",
              fontSize: "17px",
              fontWeight: "800",
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div
          style={{
            textAlign: "center",
            marginTop: "24px",
            color: "#555",
          }}
        >
          Already have an account?
          <br />
          <Link
            href="/login"
            style={{
              color: "#D4AF37",
              fontWeight: "800",
              textDecoration: "none",
            }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
