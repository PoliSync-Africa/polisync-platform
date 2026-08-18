"use client";

import { useState } from "react";

export default function ThemeSelector() {
  const [theme, setTheme] = useState("System");

  return (
    <div style={{ marginBottom: "20px" }}>
      <label style={{ fontWeight: "600" }}>Theme</label>

      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "10px",
          marginTop: "8px"
        }}
      >
        <option>System</option>
        <option>Light</option>
        <option>Dark</option>
      </select>
    </div>
  );
}
