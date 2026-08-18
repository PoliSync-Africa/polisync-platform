
"use client";

export default function SupportBubble() {
  return (
    <button
      style={{
        position: "fixed",
        bottom: 25,
        right: 25,
        width: 65,
        height: 65,
        borderRadius: "50%",
        background: "#D4AF37",
        color: "#082C24",
        border: "none",
        fontSize: 28,
        cursor: "pointer",
        boxShadow: "0 8px 20px rgba(0,0,0,.25)"
      }}
    >
      💬
    </button>
  );
}
