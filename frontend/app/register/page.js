
"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "polling-agent"
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      alert(data.message || "Registration completed.");

    } catch (error) {
      alert("Unable to connect to server.");
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(180deg,#041E1A,#0B3D2E)"
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "90%",
          maxWidth: 450,
          background: "rgba(255,255,255,.08)",
          padding: 35,
          borderRadius: 20,
          color: "white"
        }}
      >
        <h1
          style={{
            color: "#D4AF37",
            textAlign: "center"
          }}
        >
          Create Account
        </h1>

        <input
          placeholder="Full Name"
          style={inputStyle}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <input
          placeholder="Email"
          type="email"
          style={inputStyle}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        <input
          placeholder="Password"
          type="password"
          style={inputStyle}
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
        />

        <select
          style={inputStyle}
          onChange={(e) =>
            setForm({ ...form, role: e.target.value })
          }
        >
          <option value="polling-agent">Polling Agent</option>
          <option value="candidate">Candidate</option>
          <option value="researcher">Researcher</option>
          <option value="observer">Observer</option>
        </select>

        <button
          type="submit"
          style={buttonStyle}
        >
          Register
        </button>
      </form>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: "14px",
  marginBottom: "18px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,.2)",
  background: "rgba(255,255,255,.08)",
  color: "white"
};

const buttonStyle = {
  width: "100%",
  padding: "16px",
  background: "#D4AF37",
  color: "#0B3D2E",
  border: "none",
  borderRadius: "12px",
  fontWeight: "bold"
};
