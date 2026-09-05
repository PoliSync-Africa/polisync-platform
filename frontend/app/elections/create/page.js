"use client";

import { useState } from "react";

export default function CreateElectionPage() {
  const [form, setForm] = useState({
    name: "",
    country: "",
    type: "General Election",
    date: ""
  });

  const update = (field, value) =>
    setForm({ ...form, [field]: value });

  return (
    <main
      style={{
        background: "#F3F5F7",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: 40
      }}
    >
      <div
        style={{
          background: "white",
          width: "100%",
          maxWidth: 700,
          borderRadius: 24,
          padding: 36
        }}
      >
        <h1 style={{ color: "#0B3D2E" }}>
          Create New Election
        </h1>

        <input
          placeholder="Election Name"
          style={input}
          onChange={(e) => update("name", e.target.value)}
        />

        <input
          placeholder="Country"
          style={input}
          onChange={(e) => update("country", e.target.value)}
        />

        <select
          style={input}
          onChange={(e) => update("type", e.target.value)}
        >
          <option>General Election</option>
          <option>Primary</option>
          <option>Local Election</option>
          <option>Party Election</option>
        </select>

        <input
          type="date"
          style={input}
          onChange={(e) => update("date", e.target.value)}
        />

        <button
          style={{
            background: "#D4AF37",
            color: "#0B3D2E",
            padding: "16px 28px",
            borderRadius: 12,
            border: "none",
            fontWeight: "bold"
          }}
        >
          Publish Election
        </button>
      </div>
    </main>
  );
}

const input = {
  width: "100%",
  padding: 14,
  marginBottom: 18,
  borderRadius: 12,
  border: "1px solid #D1D5DB"
};
