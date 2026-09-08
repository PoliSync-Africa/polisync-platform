"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://polisync-platform-1.onrender.com").replace(/\/+$/, "");
const partyNavigation = [
  { section: "PARTY COMMAND", items: [
    { label: "Dashboard", href: "/party", icon: "⌂", key: "overview" },
    { label: "National Command", href: "/party/national", icon: "◎", key: "national" },
    { label: "Regional Administration", href: "/party/regions", icon: "⌖", key: "regions" },
    { label: "Constituencies", href: "/party/constituencies", icon: "▦", key: "constituencies" },
    { label: "Polling Stations", href: "/party/polling-stations", icon: "▣", key: "polling-stations" },
  ]},
  { section: "PARTY OPERATIONS", items: [
    { label: "Members", href: "/party/members", icon: "♙", key: "members" },
    { label: "Party Administrators", href: "/party/administrators", icon: "♚", key: "administrators" },
    { label: "Deployment Center", href: "/party/deployments", icon: "⇄", key: "deployments" },
    { label: "Polling Agents", href: "/party/polling-agents", icon: "♟", key: "agents" },
    { label: "Candidates", href: "/party/candidates", icon: "★", key: "candidates" },
    { label: "Field Operations", href: "/party/field", icon: "⌁", key: "field" },
  ]},
  { section: "ELECTION MANAGEMENT", items: [
    { label: "Live Results", href: "/party/results", icon: "▤", key: "results" },
  ]},
];

function token() {
  if (typeof window === "undefined") return "";
  return ["polisync_token", "authToken", "accessToken", "token"].map((key) => localStorage.getItem(key) || sessionStorage.getItem(key)).find(Boolean) || "";
}

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    cache: "no-store",
    ...options,
    headers: { Accept: "application/json", "Content-Type": "application/json", ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) throw new Error(body.message || `Request failed (${response.status})`);
  return body;
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) return reject(new Error("Please select a valid candidate photo."));
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read the selected photo."));
    reader.readAsDataURL(file);
  });
}

async function compressPhoto(file) {
  const source = await readImage(file);
  const image = await new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error("Candidate photo could not be processed.")); img.src = source; });
  const max = 1000;
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const scale = Math.min(1, max / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to prepare candidate photo.");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  let quality = 0.82;
  let result = canvas.toDataURL("image/jpeg", quality);
  while (result.length > 850 * 1024 * 1.37 && quality > 0.48) { quality -= 0.07; result = canvas.toDataURL("image/jpeg", quality); }
  return result;
}

export default function PartyCandidatesPage() {
  const [party, setParty] = useState(null);
  const [elections, setElections] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [photos, setPhotos] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const dashboard = await request("/api/party-organization/me/dashboard");
      setParty(dashboard.organization || null);
      const result = await request("/api/elections");
      const presidential = (result.elections || []).filter((election) => String(election.type || "").toLowerCase() === "presidential");
      const data = {};
      await Promise.all(presidential.map(async (election) => {
        try {
          const own = await request(`/api/elections/${election._id}/candidates/my-party`);
          data[election._id] = own.candidate || { name: "", profilePictureUrl: "" };
        } catch (err) {
          data[election._id] = { name: "", profilePictureUrl: "", unavailable: err.message };
        }
      }));
      setElections(presidential);
      setSubmissions(data);
    } catch (err) {
      setError(err.message || "Unable to load party candidate workspace.");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function update(id, value) { setSubmissions((current) => ({ ...current, [id]: { ...(current[id] || {}), name: value } })); }

  async function photo(id, file) {
    if (!file) return;
    setError(""); setMessage("");
    try { const value = await compressPhoto(file); setPhotos((current) => ({ ...current, [id]: value })); setSubmissions((current) => ({ ...current, [id]: { ...(current[id] || {}), profilePictureUrl: value } })); }
    catch (err) { setError(err.message || "Unable to prepare candidate photo."); }
  }

  async function save(election) {
    const candidate = submissions[election._id] || {};
    if (!candidate.name?.trim()) { setError(`Enter the presidential candidate name for ${election.name}.`); return; }
    if (!candidate.profilePictureUrl) { setError(`Upload a profile photo for the presidential candidate for ${election.name}.`); return; }
    setSaving(election._id); setError(""); setMessage("");
    try {
      await request(`/api/elections/${election._id}/candidates/my-party`, { method: "PATCH", body: JSON.stringify({ name: candidate.name.trim(), profilePictureUrl: candidate.profilePictureUrl }) });
      setMessage(`${party?.politicalPartyName || party?.name || "Your party"} candidate saved permanently for ${election.name}. It remains unchanged until your party edits it.`);
      await load();
    } catch (err) { setError(err.message || "Unable to save candidate."); }
    finally { setSaving(null); }
  }

  return <DashboardShell role="national_party_admin" navigation={partyNavigation} activeSection="candidates" title="Party Candidates" subtitle="Submit your party's presidential candidate for each participating election">
    <main className="page">
      <header className="hero"><div><span>POLISYNC AFRICA • PARTY CANDIDATE PORTAL</span><h1>{party?.politicalPartyName || party?.name || "Political Party"}</h1><p>Each participating political party has its own presidential candidate slot. Your party controls the name and profile photo submitted for its candidate.</p></div><button onClick={load}>↻ Refresh</button></header>
      {message && <div className="notice success">✓ {message}</div>}
      {error && <div className="notice error">{error}</div>}
      {loading ? <section className="card empty">Loading presidential elections…</section> : !elections.length ? <section className="card empty">No presidential elections are currently available.</section> : <section className="grid">
        {elections.map((election) => { const candidate = submissions[election._id] || {}; return <article className="card election" key={election._id}>
          <div className="top"><div><span className="eyebrow">PRESIDENTIAL ELECTION</span><h2>{election.name}</h2><p>{election.year} • {election.status}</p></div><span className="badge">PRESIDENT</span></div>
          <div className="party"><div className="logo">{party?.logo ? <img src={party.logo} alt="" /> : (party?.politicalPartyName || party?.name || "PTY").slice(0,3).toUpperCase()}</div><div><b>{party?.politicalPartyName || party?.name || "Your political party"}</b><small>Participating party</small></div></div>
          <div className="candidate"><div className="photo">{candidate.profilePictureUrl ? <img src={candidate.profilePictureUrl} alt="Presidential candidate" /> : <span>PHOTO</span>}</div><div className="fields"><label>Presidential candidate full name<input value={candidate.name || ""} onChange={(event) => update(election._id, event.target.value)} placeholder="Enter candidate full name" /></label><label className="upload">{candidate.profilePictureUrl ? "Change profile photo" : "Upload profile photo"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => photo(election._id, event.target.files?.[0])} /></label></div></div>
          <div className="footer"><span>{candidate.name && candidate.profilePictureUrl ? "Ready to submit" : "Name and profile photo required"}</span><button onClick={() => save(election)} disabled={saving === election._id}>{saving === election._id ? "Saving…" : candidate.name ? "Save / Update Candidate" : "Submit Candidate"}</button></div>
        </article>; })}
      </section>}
    </main>
    <style jsx>{styles}</style>
  </DashboardShell>;
}

const styles = `
.page{min-height:100%;padding:clamp(14px,3vw,36px);background:#f4f7f5;color:#173b2c}.hero{max-width:1180px;margin:0 auto 18px;display:flex;justify-content:space-between;gap:18px;align-items:flex-end}.hero span,.eyebrow{font-size:10px;font-weight:900;letter-spacing:1.5px;color:#a47b15}.hero h1{margin:6px 0;color:#075f31;font-size:clamp(28px,5vw,44px)}.hero p{max-width:760px;margin:0;color:#718179;line-height:1.6}.hero button,.footer button{border:0;border-radius:9px;background:#075f31;color:#fff;padding:11px 15px;font-weight:900;cursor:pointer}.card{max-width:1180px;margin:0 auto;background:#fff;border:1px solid #dce6e0;border-radius:15px;box-shadow:0 6px 20px rgba(20,60,42,.05);padding:18px;box-sizing:border-box}.notice{max-width:1180px;margin:0 auto 12px;padding:11px 14px;border-radius:10px;font-size:12px;font-weight:800}.success{background:#e8f6ed;color:#17633e}.error{background:#fff0f0;color:#a03939}.grid{max-width:1180px;margin:0 auto;display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(340px,1fr))}.top{display:flex;justify-content:space-between;gap:12px}.top h2{margin:5px 0 3px;color:#075f31;font-size:21px}.top p{margin:0;color:#7a8881;font-size:11px}.badge{height:max-content;padding:7px 9px;border-radius:8px;background:#edf6f0;color:#075f31;font-size:9px;font-weight:900}.party{display:flex;align-items:center;gap:10px;margin:18px 0;padding:10px;border:1px solid #e1e9e4;border-radius:10px;background:#fbfdfc}.logo{width:46px;height:46px;border-radius:8px;background:#eef4f0;display:grid;place-items:center;overflow:hidden;font-size:10px;font-weight:900;color:#286047}.logo img{width:100%;height:100%;object-fit:contain}.party b{display:block;font-size:12px}.party small{display:block;margin-top:3px;color:#7c8983;font-size:9px}.candidate{display:grid;grid-template-columns:110px 1fr;gap:14px;align-items:start}.photo{width:108px;height:128px;border:1px solid #d6e1da;border-radius:9px;background:#eef4f0;display:grid;place-items:center;overflow:hidden;color:#7c8983;font-size:9px;font-weight:900}.photo img{width:100%;height:100%;object-fit:cover}.fields{display:grid;gap:10px}.fields label{display:grid;gap:6px;color:#4d6659;font-size:9px;font-weight:900}.fields input[type=text],.fields input:not([type]){border:1px solid #d2ded7;border-radius:9px;padding:11px 12px;font-size:16px;background:#fbfdfc;outline:none}.upload{position:relative;border:1px dashed #aac5b4;border-radius:9px;padding:11px;color:#17623e;text-align:center;cursor:pointer}.upload input{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer}.footer{border-top:1px solid #e7ece9;margin-top:16px;padding-top:12px;display:flex;justify-content:space-between;gap:10px;align-items:center}.footer span{font-size:9px;color:#77857e;font-weight:800}.footer button:disabled{opacity:.55;cursor:wait}.empty{text-align:center;color:#76847d;padding:35px}
@media(max-width:650px){.hero{display:block}.hero button{width:100%;margin-top:12px}.grid{grid-template-columns:1fr}.candidate{grid-template-columns:1fr}.photo{width:100%;height:180px}.footer{display:block}.footer button{width:100%;margin-top:9px}}
`;
