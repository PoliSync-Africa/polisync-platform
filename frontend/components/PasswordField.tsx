
"use client";

import { useState } from "react";

export default function PasswordField() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "#1B365D"
        }}
      >
        Password
      </label>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          border: "1px solid #D1D5DB",
          borderRadius: "12px",
          overflow: "hidden"
        }}
      >
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          style={{
            flex: 1,
            padding: "14px",
            border: "none",
            outline: "none",
            fontSize: "15px"
          }}
        />

        <button
          onClick={() => setShowPassword(!showPassword)}
          style={{
            background: "transparent",
            border: "none",
            padding: "0 14px",
            cursor: "pointer",
            color: "#1B365D",
            fontWeight: 600
          }}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
