"use client";

import Link from "next/link";
import { useState } from "react";

const PARTY_OPTIONS = ["NPP", "NDC", "CPP", "LPG", "GUM", "PNC", "PPP", "The Base Party", "UP (Movement for Change)", "The New Force", "Independent"];
const TYPES = [
  ["political_party", "Political Party", "Party organization and national command structure."],
  ["observer_organization", "Observer Organization", "Independent election observation organization."],
  ["presidential_candidate", "Presidential Candidate", "Candidate campaign organization."],
  ["parliamentary_candidate", "Parliamentary Candidate", "Candidate organization for a constituency."],
  ["research", "Research Organization", "Research institution or individual research workspace."],
];

export default function OrganizationRegistrationPage() {
  const [organizationType, setOrganizationType] = useState("");
  const [name, setName] = useState("");
  const [party, setParty] = useState("");
  const [researchType, setResearchType] = useState("research_institution");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const token = localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token");
    if (!token) {
      setError("Please sign in to your personal PoliSync account first. Organization accounts are created from an approved personal account.");
      return;
    }
    if (!organizationType || !name.trim()) {
      setError("Organization type and organization name are required.");
      return;
    }
    if (organizationType === "political_party" && !party) {
      setError("Select the political party.");
      return;
    }

    setLoading(true);
    try {
      const api = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
      if (!api) throw new Error("Production API URL is not configured.");

      const payload = {
        organizationType,
        name: organizationType === "political_party" ? party : name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        description: description.trim(),
        ...(organizationType === "research" ? { researchType } : {}),
      };

      const response = await fetch(`${api}/api/organizations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || "Organization request failed.");

      setSuccess(data.message || "Organization request submitted.");
      setName("");
      setParty("");
      setEmail("");
      setPhone("");
      setDescription("");
    } catch (err) {
      setError(err.message || "Unable to submit organization request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={page}>
      <section style={card}>
        <div style={eyebrow}>POLISYNC AFRICA • ORGANIZATION ONBOARDING</div>
        <h1 style={title}>Create an Organizational Account</h1>
        <p style={subtitle}>Your personal account remains separate. Organization creation is a request and requires Super Admin approval.</p>

        <div style={notice}>✓ Personal accounts are self-created and automatically approved. ✓ Organizations are reviewed separately.</div>

        <div style={typeGrid}>
          {TYPES.map(([value, label, text]) => (
            <button key={value} type="button" onClick={() => setOrganizationType(value)} style={{ ...typeButton, ...(organizationType === value ? selectedType : {}) }}>
              <strong>{label}</strong>
              <span>{text}</span>
            </button>
          ))}
        </div>

        {organizationType && (
          <form onSubmit={submit} style={form}>
            {organizationType === "political_party" ? (
              <select value={party} onChange={(e) => { setParty(e.target.value); setName(e.target.value); }} style={input} required>
                <option value="">Select Political Party</option>
                {PARTY_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            ) : (
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Organization / candidate name" style={input} required />
            )}

            {organizationType === "research" && (
              <select value={researchType} onChange={(e) => setResearchType(e.target.value)} style={input}>
                <option value="research_institution">Research Institution</option>
                <option value="individual_researcher">Individual Researcher</option>
              </select>
            )}

            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Organization email (optional)" style={input} />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Organization phone (+233...) (optional)" style={input} />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={4} style={{ ...input, resize: "vertical" }} />

            {error && <div style={errorBox}>{error}</div>}
            {success && <div style={successBox}>{success}</div>}

            <button type="submit" disabled={loading} style={primary}>{loading ? "Submitting Request..." : "Submit Organization Request"}</button>
          </form>
        )}

        <p style={footer}>Already have an account? <Link href="/login" style={link}>Sign in</Link></p>
      </section>
    </main>
  );
}

const page = { minHeight: "100vh", padding: "28px 16px", background: "linear-gradient(135deg,#f8faf8,#eef7f0)", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "Arial,sans-serif", boxSizing: "border-box" };
const card = { width: "100%", maxWidth: 760, background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,.08)", border: "1px solid #dce6df", boxSizing: "border-box" };
const eyebrow = { color: "#c9a227", fontSize: 10, fontWeight: 900, letterSpacing: 1.3, textAlign: "center" };
const title = { textAlign: "center", color: "#075f2b", fontSize: 28, margin: "8px 0" };
const subtitle = { textAlign: "center", color: "#6e7871", fontSize: 13, lineHeight: 1.6, margin: "0 auto 16px", maxWidth: 620 };
const notice = { padding: 12, borderRadius: 12, background: "#ecfdf3", border: "1px solid #b7dfc5", color: "#08733a", fontSize: 12, lineHeight: 1.5, marginBottom: 16 };
const typeGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 10 };
const typeButton = { textAlign: "left", padding: 15, borderRadius: 13, border: "1px solid #dce6df", background: "#fff", cursor: "pointer", color: "#25332b" };
const selectedType = { border: "2px solid #075f2b", background: "#f1f9f3" };
const form = { display: "grid", gap: 11, marginTop: 16 };
const input = { width: "100%", boxSizing: "border-box", padding: "13px 14px", border: "1px solid #d5e0d8", borderRadius: 10, background: "#fbfdfb", fontSize: 14, fontFamily: "inherit" };
const primary = { width: "100%", padding: 14, border: 0, borderRadius: 11, background: "#075f2b", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" };
const errorBox = { padding: 12, borderRadius: 10, background: "#fff2f2", border: "1px solid #efcaca", color: "#a00000", fontSize: 12 };
const successBox = { padding: 12, borderRadius: 10, background: "#ecfdf3", border: "1px solid #b7dfc5", color: "#08733a", fontSize: 12, lineHeight: 1.5 };
const footer = { textAlign: "center", color: "#6e7871", fontSize: 12, marginTop: 20 };
const link = { color: "#075f2b", fontWeight: 800 };
