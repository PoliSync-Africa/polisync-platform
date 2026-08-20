"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        "https://YOUR-BACKEND-URL.onrender.com/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }

      alert(data.message || "Login successful");

      if (data.token) {
        localStorage.setItem("polisyncToken", data.token);
      }

      if (data.user?.role) {
        localStorage.setItem("polisyncRole", data.user.role);
      }

      window.location.href = "/dashboard";
    } catch (error) {
      alert("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "linear-gradient(180deg,#041E1A 0%,#0B3D2E 100%)",
        padding: 20,
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: "90%",
          maxWidth: 420,
          background: "rgba(255,255,255,.08)",
          backdropFilter: "blur(12px)",
          padding: 35,
          borderRadius: 20,
          color: "white",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            color: "#D4AF37",
            marginBottom: 10,
          }}
        >
          POLISYNC Login
        </h1>

        <p
          style={{
            textAlign: "center",
            opacity: 0.8,
            marginBottom: 30,
          }}
        >
          Secure access to Africa's Political Operating System
        </p>

        <label>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Enter email"
          style={inputStyle}
          required
        />

        <label>Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Enter password"
          style={inputStyle}
          required
        />

        <button
          type="submit"
          disabled={loading}
          style={buttonStyle}
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>

        <div
          style={{
            textAlign: "center",
            marginTop: 18,
            opacity: 0.8,
            cursor: "pointer",
          }}
        >
          Forgot Password?
        </div>
      </form>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: "14px",
  marginTop: 8,
  marginBottom: 20,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,.2)",
  background: "rgba(255,255,255,.08)",
  color: "white",
  outline: "none",
  boxSizing: "border-box",
};

const buttonStyle = {
  width: "100%",
  padding: "16px",
  background: "#D4AF37",
  color: "#0B3D2E",
  border: "none",
  borderRadius: 12,
  fontWeight: "bold",
  fontSize: 17,
  cursor: "pointer",
};
