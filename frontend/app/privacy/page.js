"use client";

import { useEffect } from "react";

export default function PrivacyPage() {
  useEffect(() => {
    window.location.replace("/settings/security");
  }, []);

  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f4f7f5", color: "#075f2b", fontFamily: "Arial, sans-serif", fontWeight: 800 }}>Opening Privacy & Security…</main>;
}
