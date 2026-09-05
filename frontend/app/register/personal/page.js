"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const PURPOSES = [
  { value: "personal_use", title: "Personal Use", text: "Civic information, elections, candidates and public records." },
  { value: "researcher", title: "Researcher", text: "Political research, datasets, electoral geography, results and exports." },
  { value: "journalist", title: "Journalist", text: "Reporting, source verification, fact-checking, newsroom-style research and election intelligence." },
];

export default function PersonalRegistration() {
  const [purpose, setPurpose] = useState("personal_use");
  const [form, setForm] = useState({ firstName:"", middleName:"", lastName:"", dateOfBirth:"", nationality:"Ghanaian", identificationType:"ghana_card", identificationNumber:"", email:"", phone:"", password:"", confirmPassword:"", researchFields:"", journalismBeat:"" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search).get("purpose");
      if (PURPOSES.some((x) => x.value === p)) setPurpose(p);
    } catch {}
  }, []);

  const update = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
    setBusy(true);

    try {
      const api = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
      if (!api) throw new Error("Production API URL is not configured.");
      const response = await fetch(`${api}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...form, personalPurpose: purpose, registrationType: "personal", scopeLevel: "public_platform", researchFields: form.researchFields.split(",").map((item) => item.trim()).filter(Boolean) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || "Registration failed.");
      localStorage.setItem("polisync_personal_purpose", purpose);
      setSuccess("Account created successfully. Verify your phone with the Arkesel SMS code, then sign in. Email verification is not required.");
    } catch (err) {
      setError(err.message || "Unable to complete registration.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight:"100vh", padding:"28px 16px", background:"linear-gradient(135deg,#f8faf8,#eef7f0)", fontFamily:"Arial,sans-serif" }}>
      <div style={{ maxWidth:920, margin:"0 auto" }}>
        <section style={{ padding:28, borderRadius:24, background:"linear-gradient(135deg,#04351a,#075f2b)", border:"1px solid #c9a227", color:"#fff" }}>
          <span style={{ color:"#e6c85a", fontSize:10, fontWeight:900, letterSpacing:1.4 }}>POLISYNC AFRICA</span>
          <h1 style={{ margin:"8px 0", fontSize:31 }}>Create your personal workspace</h1>
          <p style={{ maxWidth:720, color:"rgba(255,255,255,.78)", lineHeight:1.6 }}>Personal accounts are self-created and automatically enrolled. Choose the purpose that defines your workspace; Super Admin approval is not required.</p>
        </section>
        <form onSubmit={submit} style={{ marginTop:14, padding:22, borderRadius:20, background:"#fff", border:"1px solid #dce6df" }}>
          <h2 style={{ color:"#075f2b", marginTop:0 }}>Choose your purpose</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:10 }}>
            {PURPOSES.map((item) => (
              <button type="button" key={item.value} onClick={() => setPurpose(item.value)} style={{ textAlign:"left", padding:15, borderRadius:14, border:purpose===item.value?"2px solid #c9a227":"1px solid #dce6df", background:purpose===item.value?"#f5faf6":"#fff", cursor:"pointer" }}>
                <strong style={{ display:"block", color:"#075f2b", fontSize:15 }}>{item.title}</strong>
                <span style={{ display:"block", marginTop:6, color:"#718078", fontSize:11, lineHeight:1.5 }}>{item.text}</span>
              </button>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:11, marginTop:20 }}>
            {[["firstName","First name"],["middleName","Middle name"],["lastName","Last name"],["dateOfBirth","Date of birth"],["nationality","Nationality"],["identificationNumber","Identification number"],["email","Email"],["phone","Phone (+233...)"],["password","Password"],["confirmPassword","Confirm password"]].map(([key,labelText]) => (
              <label key={key} style={label}>{labelText}<input required={key!=="middleName"} type={key.includes("password")?"password":key==="dateOfBirth"?"date":key==="email"?"email":"text"} value={form[key]} onChange={(event)=>update(key,event.target.value)} style={input}/></label>
            ))}
          </div>
          <label style={{ ...label, marginTop:11 }}>Identification type
            <select value={form.identificationType} onChange={(event)=>update("identificationType",event.target.value)} style={input}>
              <option value="ghana_card">Ghana Card</option><option value="passport">Passport</option><option value="voter_id">Voter ID</option>
            </select>
          </label>
          {purpose === "researcher" && <label style={{ ...label, marginTop:11 }}>Research fields <span style={{ fontWeight:400, color:"#87928b" }}>(comma separated)</span><input value={form.researchFields} onChange={(event)=>update("researchFields",event.target.value)} placeholder="elections, governance, public policy" style={input}/></label>}
          {purpose === "journalist" && <label style={{ ...label, marginTop:11 }}>Journalism beat<input value={form.journalismBeat} onChange={(event)=>update("journalismBeat",event.target.value)} placeholder="Politics, elections, parliament" style={input}/></label>}
          {error && <div style={errorBox}>{error}</div>}
          {success && <div style={successBox}>{success}</div>}
          <button disabled={busy} type="submit" style={{ ...primary, marginTop:15 }}>{busy ? "Creating workspace..." : "Create Personal Account"}</button>
          <p style={{ textAlign:"center", color:"#77827b", fontSize:12 }}>Already have an account? <Link href="/login" style={{ color:"#075f2b", fontWeight:800 }}>Sign in</Link> · <Link href="/register" style={{ color:"#075f2b", fontWeight:800 }}>Back to account choices</Link></p>
        </form>
      </div>
    </main>
  );
}

const label={display:"block",color:"#3d4b43",fontSize:11,fontWeight:800};
const input={display:"block",width:"100%",boxSizing:"border-box",marginTop:6,padding:"12px 13px",border:"1px solid #d6e1d9",borderRadius:9,background:"#fbfdfb",fontSize:13,outline:"none"};
const primary={width:"100%",padding:15,border:0,borderRadius:11,background:"#075f2b",color:"#fff",fontSize:15,fontWeight:800};
const errorBox={marginTop:14,padding:11,borderRadius:9,background:"#fff2f2",border:"1px solid #efcaca",color:"#a00000",fontSize:12};
const successBox={marginTop:14,padding:11,borderRadius:9,background:"#ecfdf3",border:"1px solid #b7dfc5",color:"#08733a",fontSize:12,lineHeight:1.5};
