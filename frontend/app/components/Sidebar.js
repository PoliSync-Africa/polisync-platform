
"use client";

const menu = [
  "Dashboard",
  "Elections",
  "Results",
  "Campaign",
  "Research",
  "Support",
  "Settings"
];

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 240,
        background: "#082C24",
        color: "white",
        padding: 24,
        minHeight: "100vh"
      }}
    >
      <h2 style={{ color: "#D4AF37" }}>POLISYNC</h2>

      <div style={{ marginTop: 40 }}>
        {menu.map((item) => (
          <div
            key={item}
            style={{
              padding: "14px",
              borderRadius: 10,
              marginBottom: 8,
              cursor: "pointer"
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </aside>
  );
}
