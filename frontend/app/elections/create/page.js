"use client";

import { useState } from "react";

export default function CreateElectionPage() {
  const [form, setForm] = useState({ name: "", country: "", type: "General Election", date: "" });
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <main className="create-page">
      <section className="create-card">
        <span className="eyebrow">ELECTION OPERATIONS</span>
        <h1>Create New Election</h1>
        <p className="intro">Set up an election workspace with a country, election type and reporting date.</p>
        <div className="form">
          <label>Election name<input placeholder="Election Name" value={form.name} onChange={(e) => update("name", e.target.value)} /></label>
          <label>Country<input placeholder="Country" value={form.country} onChange={(e) => update("country", e.target.value)} /></label>
          <label>Election type<select value={form.type} onChange={(e) => update("type", e.target.value)}><option>General Election</option><option>Primary</option><option>Local Election</option><option>Party Election</option></select></label>
          <label>Election date<input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} /></label>
        </div>
        <button className="publish" type="button">Publish Election</button>
      </section>
      <style jsx>{`.create-page{min-height:100dvh;width:100%;min-width:0;display:flex;justify-content:center;align-items:flex-start;padding:clamp(16px,5vw,40px);background:#f3f5f7;box-sizing:border-box;overflow-x:hidden}.create-card{width:100%;max-width:700px;min-width:0;padding:clamp(20px,5vw,36px);border-radius:clamp(18px,3vw,24px);background:#fff;box-shadow:0 12px 35px rgba(7,59,34,.08);box-sizing:border-box;overflow:hidden}.eyebrow{color:#c39a1f;font-size:10px;font-weight:900;letter-spacing:1.5px}.create-card h1{margin:7px 0;color:#0b3d2e;font-size:clamp(26px,5vw,36px);line-height:1.1;overflow-wrap:anywhere}.intro{margin:0 0 22px;color:#6b786f;font-size:12px;line-height:1.6}.form{display:grid;gap:14px}.form label{display:grid;gap:6px;color:#607068;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.4px}.form input,.form select{width:100%;min-width:0;max-width:100%;padding:13px 14px;margin:0;border:1px solid #d1d5db;border-radius:12px;background:#fff;color:#263b31;font:inherit;font-size:13px;text-transform:none;letter-spacing:0;box-sizing:border-box}.publish{width:100%;min-height:48px;margin-top:18px;padding:13px 20px;border:0;border-radius:12px;background:#d4af37;color:#0b3d2e;font-weight:900;font-size:12px;cursor:pointer}@media(max-width:480px){.create-page{padding:12px}.create-card{padding:18px;border-radius:17px}.publish{margin-top:14px}}`}</style>
    </main>
  );
}
