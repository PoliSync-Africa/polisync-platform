
"use client";

import { useState } from "react";

export default function ThemeSelector() {
  const [theme, setTheme] = useState("System");
  const [skin, setSkin] = useState("Ghana Gold");
  const [fontSize, setFontSize] = useState("Medium");
  const [fontStyle, setFontStyle] = useState("Inter");

  return (
    <div
      style={{
        marginTop: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}
    >
      <h3
        style={{
          margin: 0,
          color: "#1B365D",
          fontSize: "18px"
        }}
      >
        Personalize Your Experience
      </h3>

      <div>
        <label style={{ fontWeight: 600 }}>Theme</label>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "6px",
            borderRadius: "10px",
            border: "1px solid #D1D5DB"
          }}
        >
          <option>System</option>
          <option>Light</option>
          <option>Dark</option>
        </select>
      </div>

      <div>
        <label style={{ fontWeight: 600 }}>Skin Color</label>
        <select
          value={skin}
          onChange={(e) => setSkin(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "6px",
            borderRadius: "10px",
            border: "1px solid #D1D5DB"
          }}
        >
          <option>Ghana Gold</option>
          <option>Royal Blue</option>
          <option>Emerald Green</option>
          <option>Crimson Red</option>
          <option>Purple</option>
          <option>Teal</option>
          <option>Orange</option>
        </select>
      </div>

      <div>
        <label style={{ fontWeight: 600 }}>Font Size</label>
        <select
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "6px",
            borderRadius: "10px",
            border: "1px solid #D1D5DB"
          }}
        >
          <option>Small</option>
          <option>Medium</option>
          <option>Large</option>
          <option>Extra Large</option>
        </select>
      </div>

      <div>
        <label style={{ fontWeight: 600 }}>Font Style</label>
        <select
          value={fontStyle}
          onChange={(e) => setFontStyle(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "6px",
            borderRadius: "10px",
            border: "1px solid #D1D5DB"
          }}
        >
          <option>Inter</option>
          <option>Roboto</option>
          <option>Poppins</option>
          <option>Lato</option>
          <option>Open Sans</option>
        </select>
      </div>

      <div
        style={{
          background: "#F8FAFC",
          border: "1px solid #E5E7EB",
          borderRadius: "12px",
          padding: "14px"
        }}
      >
        <strong>Preview</strong>

        <p style={{ margin: "8px 0 4px", color: "#1B365D" }}>
          Theme: {theme}
        </p>

        <p style={{ margin: "4px 0", color: "#1B365D" }}>
          Skin: {skin}
        </p>

        <p style={{ margin: "4px 0", color: "#1B365D" }}>
          Font Size: {fontSize}
        </p>

        <p style={{ margin: "4px 0", color: "#1B365D" }}>
          Font: {fontStyle}
        </p>
      </div>
    </div>
  );
}
