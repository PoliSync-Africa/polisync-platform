"use client";

import { useState } from "react";

export default function PasswordField() {
  const [show, setShow] = useState(false);

  return (
    <div style={{ marginBottom: "18px" }}>
      <label
        style={{
          display: "block",
          marginBottom: "6px",
          fontWeight: "600"
        }}
      >
        Password
      </label>

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type={show ? "text" : "password"}
          placeholder="Enter password"
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: "10px",
            border: "1px solid #ccc"
          }}
        />

        <button
          onClick={() => setShow(!show)}
          style={{
            padding: "14px",
            borderRadius: "10px"
          }}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
