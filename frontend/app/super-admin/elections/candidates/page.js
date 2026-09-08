"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../../../../components/dashboard/DashboardShell";
import superAdminNavigation from "../../../../components/dashboard/superAdminNavigation";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://polisync-platform-1.onrender.com").replace(/\/+$/, "");
const MAX_PHOTO_BYTES = 850 * 1024;
const independent = { id: "independent", name: "Independent", logoUrl: "", isIndependent: true };

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
    if (!file || !file.type.startsWith("image/")) return reject(new Error("Please select a valid image file."));
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read the selected photo."));
    reader.readAsDataURL(file);
  });
}

async function compressPhoto(file) {
  const source = await readImage(file);
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("The selected photo could not be processed."));
    img.src = source;
  });
  const maxDimension = 1000;
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare the candidate photo.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  let quality = 0.82;
  let result = canvas.toDataURL("image/jpeg", quality);
  while (result.length > MAX_PHOTO_BYTES * 1.37 && quality > 0.48) {
    quality -= 0.07;
    result = canvas.toDataURL("image/jpeg", quality);
  }
  return result;
}

function makeCandidate(party = independent) {
  return {
    name: "",
    partyId: party.isIndependent ? null : party.id,
    party: party.name,
    partyLogoUrl: party.logoUrl || "",
    profilePictureUrl: "",
    constituencyId: null,
    position: "president",
  };
}

function participantFromElection(party) {
  return { ...party, id: party.partyId || party.id, name: party.name, logoUrl: party.logoUrl || "", isIndependent: false };
}

export default function ElectionCandidatesPage() {
  const [elections, setElections] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [tab, setTab] = useState("presidential");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const election = useMemo(() => elections.find((item) => String(item._id) === String(selectedId)), [elections, selectedId]);
  const parties = useMemo(() => (election?.parties || []).filter((p) => String(p.name || "").trim().toLowerCase() !== "independent").map(participantFromElection), [election]);
  const participants = useMemo(() => [...parties, independent], [parties]);
  const presidential = useMemo(() => candidates.filter((c) => (c.position || (c.constituencyId ? "parliamentary" : "president")) === "president"), [candidates]);
  const parliamentary = useMemo(() => candidates.filter((c) => (c.position || (c.constituencyId ? "parliamentary" : "president")) === "parliamentary"), [candidates]);

  async function load() {
    setLoading(true); setError("");
    try {
      const [electionsResult, geographyResult] = await Promise.all([
        request("/api/elections"),
        request("/api/electoral-geography/constituencies"),
      ]);
      const list = Array.isArray(electionsResult.elections) ? electionsResult.elections : [];
      const geo = Array.isArray(geographyResult) ? geographyResult : (geographyResult.data || geographyResult.constituencies || []);
      setElections(list);
      setConstituencies(Array.isArray(geo) ? geo : []);
      setSelectedId((current) => current || String(list[0]?._id || ""));
    } catch (err) {
      setError(err.message || "Unable to load election candidates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!election) { setCandidates([]); return; }
    setCandidates((election.candidates || []).map((candidate) => {
      const party = (election.parties || []).find((p) => String(p.partyId) === String(candidate.partyId)) || (election.parties || []).find((p) => String(p.name || "").trim().toLowerCase() === String(candidate.party || "").trim().toLowerCase());
      const isIndependent = !candidate.partyId || String(candidate.party || "").trim().toLowerCase() === "independent";
      return {
        ...candidate,
        partyId: isIndependent ? null : party?.partyId || candidate.partyId || null,
        party: isIndependent ? "Independent" : party?.name || candidate.party || "",
        partyLogoUrl: isIndependent ? "" : party?.logoUrl || candidate.partyLogoUrl || "",
        position: candidate.position || (candidate.constituencyId ? "parliamentary" : "president"),
      };
    }));
    setTab("presidential");
  }, [election]);

  function addCandidate() {
    setCandidates((current) => [...current, makeCandidate(parties[0] || independent)]);
    setMessage("New candidate added. Select the candidate's political party or Independent.");
    setError("");
  }

  function updateCandidate(index, key, value) {
    setCandidates((current) => current.map((candidate, i) => i === index ? { ...candidate, [key]: value } : candidate));
  }

  function assignParty(index, value) {
    const party = value === "independent" ? independent : participants.find((item) => String(item.id) === String(value));
    if (!party) return;
    setCandidates((current) => current.map((candidate, i) => i === index ? {
      ...candidate,
      partyId: party.isIndependent ? null : party.id,
      party: party.name,
      partyLogoUrl: party.isIndependent ? "" : party.logoUrl || "",
    } : candidate));
  }

  async function uploadPhoto(index, file) {
    if (!file) return;
    setUploading(index); setError(""); setMessage("");
    try {
      const photo = await compressPhoto(file);
      setCandidates((current) => current.map((candidate, i) => i === index ? { ...candidate, profilePictureUrl: photo } : candidate));
      setMessage("Candidate photo added. Save the candidate list to keep it.");
    } catch (err) {
      setError(err.message || "Unable to prepare candidate photo.");
    } finally {
      setUploading(null);
    }
  }

  function moveCandidate(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= presidential.length) return;
    const a = candidates.indexOf(presidential[index]);
    const b = candidates.indexOf(presidential[target]);
    if (a < 0 || b < 0) return;
    setCandidates((current) => {
      const next = [...current];
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
  }

  function removeCandidate(candidate) {
    setCandidates((current) => current.filter((item) => item !== candidate));
  }

  async function save() {
    if (!election) return;
    setSaving(true); setError(""); setMessage("");
    try {
      if (tab === "presidential") {
        const missing = parties.filter((party) => !presidential.some((candidate) => String(candidate.partyId) === String(party.id) && candidate.name?.trim()));
        if (missing.length) throw new Error(`Add one presidential candidate for: ${missing.map((p) => p.name).join(", ")}.`);
        const independentCandidates = presidential.filter((candidate) => !candidate.partyId && candidate.name?.trim());
        if (independentCandidates.length !== 1) throw new Error(independentCandidates.length ? "Only one Independent presidential candidate is allowed." : "Add the Independent presidential candidate too.");
      }
      if (tab === "parliamentary" && parliamentary.some((candidate) => !candidate.name?.trim() || !candidate.constituencyId)) throw new Error("Every parliamentary candidate needs a name and constituency before saving.");

      const payload = candidates.map((candidate) => ({
        name: String(candidate.name || "").trim(),
        partyId: candidate.partyId || null,
        party: candidate.party || "Independent",
        partyLogoUrl: candidate.partyLogoUrl || "",
        profilePictureUrl: candidate.profilePictureUrl || "",
        constituencyId: candidate.constituencyId || null,
      })).filter((candidate) => candidate.name);

      const result = await request(`/api/elections/${election._id}`, { method: "PATCH", body: JSON.stringify({ candidates: payload }) });
      setElections((current) => current.map((item) => item._id === result.election._id ? result.election : item));
      setMessage("Candidates, party assignments, Independent status, photos and ballot order saved successfully.");
    } catch (err) {
      setError(err.message || "Unable to save candidates.");
    } finally {
      setSaving(false);
    }
  }

  function partyLogo(candidate) {
    if (candidate.partyLogoUrl) return <img src={candidate.partyLogoUrl} alt="" />;
    return <span className={!candidate.partyId ? "ind-mark" : "party-mark"}>{candidate.partyId ? String(candidate.party || "").slice(0, 3).toUpperCase() : "IND"}</span>;
  }

  return <DashboardShell role="super_admin" navigation={superAdminNavigation} activeSection="presidential-candidates" title="Presidential Candidates" subtitle="Manage candidate photos, party affiliation and ballot order">
    <main className="page">
      <header className="header">
        <div><span className="eyebrow">POLISYNC AFRICA • ELECTION CONTROL</span><h1>Presidential Candidates</h1><p>{election ? `${election.name} • ${election.year}` : "Select an election to manage its presidential ballot."}</p></div>
        <button className="refresh" onClick={load}>↻ Refresh</button>
      </header>

      {message && <div className="notice success">✓ {message}</div>}
      {error && <div className="notice error">{error}</div>}

      <section className="card selector">
        <label>Election<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}><option value="">Select election</option>{elections.map((item) => <option key={item._id} value={item._id}>{item.name} — {item.year} — {item.type}</option>)}</select></label>
        {election && <div className="summary"><span><b>{parties.length}</b> participating parties</span><span><b>1</b> Independent slot</span><span><b>{presidential.length}</b> presidential candidates</span></div>}
      </section>

      {loading ? <section className="card empty">Loading candidates and electoral geography…</section> : !election ? <section className="card empty">Select an election to continue.</section> : <>
        <section className="card participants">
          <div className="participant-heading"><div><h2>Ballot Participants</h2><p>Independent is a first-class ballot participant and can be selected exactly like any participating political party.</p></div><button className="primary" onClick={addCandidate}>+ Add Candidate</button></div>
          <div className="participant-list">{participants.map((participant) => <div className="participant" key={participant.id}><div className="participant-logo">{participant.logoUrl ? <img src={participant.logoUrl} alt="" /> : participant.isIndependent ? "IND." : participant.name.slice(0, 3).toUpperCase()}</div><strong>{participant.name}</strong><small>{participant.isIndependent ? "Independent candidate" : "Participating political party"}</small></div>)}</div>
        </section>

        <div className="tabs"><button className={tab === "presidential" ? "active" : ""} onClick={() => setTab("presidential")}>Presidential Ballot</button><button className={tab === "parliamentary" ? "active" : ""} onClick={() => setTab("parliamentary")}>Parliamentary Candidates</button><button className={tab === "ballot" ? "active" : ""} onClick={() => setTab("ballot")}>Notice of Poll Preview</button></div>

        {tab === "presidential" && <section className="workspace">
          <div className="card candidate-card">
            <div className="section-head"><div><h2>Presidential Candidates ({presidential.length})</h2><p>Arrange candidates in the exact ballot order. Every row has its own photo and participant selector.</p></div><button className="primary" onClick={addCandidate}>+ Add Candidate</button></div>
            <div className="candidate-list">
              {presidential.length === 0 && <div className="empty">No presidential candidates added yet.</div>}
              {presidential.map((candidate, index) => {
                const realIndex = candidates.indexOf(candidate);
                return <article className={`candidate-row ${!candidate.partyId ? "independent" : ""}`} key={`${realIndex}-${candidate.name}`}>
                  <div className="order"><button disabled={index === 0} onClick={() => moveCandidate(index, -1)}>↑</button><b>{index + 1}</b><button disabled={index === presidential.length - 1} onClick={() => moveCandidate(index, 1)}>↓</button></div>
                  <div className="photo-wrap"><div className="photo">{candidate.profilePictureUrl ? <img src={candidate.profilePictureUrl} alt="Candidate" /> : <span>PHOTO</span>}</div><label className="upload"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadPhoto(realIndex, event.target.files?.[0])} />{uploading === realIndex ? "Preparing…" : candidate.profilePictureUrl ? "Change photo" : "Upload photo"}</label></div>
                  <div className="candidate-details"><label>Candidate name<input value={candidate.name} onChange={(event) => updateCandidate(realIndex, "name", event.target.value)} placeholder="Candidate full name" /></label><small>{candidate.party || "Independent"}</small></div>
                  <div className="participant-field"><label>Political party / participant<select value={candidate.partyId || "independent"} onChange={(event) => assignParty(realIndex, event.target.value)}>{participants.map((participant) => <option key={participant.id} value={participant.id}>{participant.name}</option>)}</select></label><div className="party-badge"><div>{partyLogo(candidate)}</div><span>{candidate.party || "Independent"}</span></div></div>
                  <div className="row-actions"><span className={candidate.profilePictureUrl ? "ready" : "missing"}>{candidate.profilePictureUrl ? "Photo ready" : "Photo required"}</span><button className="delete" onClick={() => removeCandidate(candidate)}>Delete</button></div>
                </article>;
              })}
            </div>
            <div className="save-bar"><div><b>Ballot order</b><small>Use the arrows to match the approved Notice of Poll order.</small></div><button className="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Presidential Ballot"}</button></div>
          </div>

          <aside className="card preview-card"><div className="section-head"><div><h2>Notice of Poll Preview</h2><p>System preview for ballot configuration. It is not an official EC document.</p></div></div><BallotPreview election={election} candidates={presidential} /></aside>
        </section>}

        {tab === "parliamentary" && <section className="card candidate-card"><div className="section-head"><div><h2>Parliamentary Candidates</h2><p>Every candidate can use any participating party or Independent and must be assigned to a constituency.</p></div><button className="primary" onClick={() => setCandidates((current) => [...current, { ...makeCandidate(parties[0] || independent), position: "parliamentary" }])}>+ Add Parliamentary Candidate</button></div><div className="parliamentary-list">{parliamentary.map((candidate) => { const realIndex = candidates.indexOf(candidate); return <div className="parliamentary-row" key={realIndex}><input value={candidate.name} onChange={(event) => updateCandidate(realIndex, "name", event.target.value)} placeholder="Candidate full name" /><select value={candidate.partyId || "independent"} onChange={(event) => assignParty(realIndex, event.target.value)}>{participants.map((participant) => <option key={participant.id} value={participant.id}>{participant.name}</option>)}</select><select value={candidate.constituencyId || ""} onChange={(event) => updateCandidate(realIndex, "constituencyId", event.target.value)}><option value="">Select constituency</option>{constituencies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select><button className="delete" onClick={() => removeCandidate(candidate)}>Delete</button></div>; })}</div>{parliamentary.length > 0 && <div className="save-bar"><div><b>Parliamentary registry</b><small>Constituency assignment is required before saving.</small></div><button className="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Parliamentary Candidates"}</button></div>}</section>}

        {tab === "ballot" && <section className="card preview-full"><div className="section-head"><div><h2>Notice of Poll Preview</h2><p>Candidate photos, participant marks and ballot numbers are aligned systematically for review.</p></div></div><BallotPreview election={election} candidates={presidential} large /></section>}
      </>}
    </main>
    <style jsx>{styles}</style>
  </DashboardShell>;
}

function BallotPreview({ election, candidates, large = false }) {
  return <div className={`notice-poll ${large ? "large" : ""}`}>
    <div className="poll-head"><div className="crest">★</div><strong>ELECTORAL COMMISSION OF GHANA</strong><b>{election?.name || "GENERAL ELECTION"}</b><span>PRESIDENTIAL BALLOT PAPER</span></div>
    <div className="poll-rows">{candidates.map((candidate, index) => <div className="poll-row" key={`${candidate.name}-${index}`}><div className="poll-number">{index + 1}</div><div className="poll-photo">{candidate.profilePictureUrl ? <img src={candidate.profilePictureUrl} alt="" /> : <span>PHOTO</span>}</div><div className="poll-name">{candidate.name || "Candidate name"}</div><div className="poll-party">{candidate.partyLogoUrl ? <img src={candidate.partyLogoUrl} alt="" /> : <span>{candidate.partyId ? String(candidate.party || "").slice(0, 3).toUpperCase() : "IND."}</span>}</div><div className="poll-mark">{candidate.partyId ? String(candidate.party || "").slice(0, 3).toUpperCase() : "IND."}</div></div>)}</div>
    <div className="poll-foot"><span>YOUR VOTE, YOUR FUTURE</span><small>TRANSPARENCY • INTEGRITY • A STRONGER GHANA</small></div>
  </div>;
}

const styles = `
.page{min-height:100%;padding:clamp(14px,3vw,36px);background:#f4f7f5;color:#173b2c;box-sizing:border-box}.header,.card,.tabs,.workspace,.notice{max-width:1240px;margin-left:auto;margin-right:auto}.header{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;margin-bottom:18px}.eyebrow{font-size:10px;font-weight:900;letter-spacing:1.6px;color:#b48a19}.header h1{margin:6px 0;color:#075f31;font-size:clamp(28px,5vw,44px)}.header p{margin:0;color:#72827a}.refresh,.primary{border:0;border-radius:9px;background:#075f31;color:#fff;padding:11px 16px;font-weight:900;cursor:pointer}.refresh{white-space:nowrap}.card{background:#fff;border:1px solid #dce6e0;border-radius:15px;box-shadow:0 6px 20px rgba(20,60,42,.05);padding:18px;box-sizing:border-box}.notice{padding:11px 14px;border-radius:10px;margin-bottom:12px;font-size:12px;font-weight:800}.notice.success{background:#e8f6ed;color:#17633e}.notice.error{background:#fff0f0;color:#a03939}.selector{display:flex;align-items:flex-end;justify-content:space-between;gap:18px}.selector label{display:grid;gap:6px;max-width:620px;width:100%;font-size:11px;font-weight:900;color:#365746}.selector select,.candidate-details input,.participant-field select,.parliamentary-row input,.parliamentary-row select{width:100%;box-sizing:border-box;border:1px solid #d3e0d8;border-radius:9px;background:#fbfdfc;color:#183d2d;padding:11px 12px;font-size:16px;outline:none}.summary{display:flex;gap:12px;flex-wrap:wrap}.summary span{padding:9px 11px;background:#f0f7f3;border-radius:8px;font-size:10px;color:#587066}.summary b{color:#075f31;margin-right:4px}.participants{margin-top:14px}.participant-heading,.section-head{display:flex;justify-content:space-between;align-items:center;gap:16px}.participant-heading h2,.section-head h2{margin:0;color:#075f31;font-size:19px}.participant-heading p,.section-head p{margin:4px 0 0;color:#77857e;font-size:11px;line-height:1.5}.participant-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-top:14px}.participant{display:grid;grid-template-columns:38px 1fr;grid-template-rows:auto auto;align-items:center;column-gap:9px;padding:9px;border:1px solid #dfe8e2;border-radius:10px;background:#fbfdfc}.participant-logo{grid-row:1/3;width:38px;height:38px;border-radius:7px;background:#eef4f0;display:grid;place-items:center;overflow:hidden;font-size:9px;font-weight:900;color:#286047}.participant-logo img{width:100%;height:100%;object-fit:contain}.participant strong{font-size:11px}.participant small{font-size:8px;color:#829088}.tabs{display:flex;gap:7px;overflow:auto;margin-top:15px}.tabs button{border:1px solid #d4e0d9;background:#fff;color:#53695d;padding:10px 13px;border-radius:9px;font-weight:900;white-space:nowrap;cursor:pointer}.tabs button.active{background:#075f31;border-color:#075f31;color:#fff}.workspace{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(300px,.85fr);gap:14px;margin-top:12px}.candidate-card{min-width:0}.candidate-list{margin-top:14px;display:grid;gap:8px}.candidate-row{display:grid;grid-template-columns:48px 84px minmax(150px,1.1fr) minmax(180px,1fr) 100px;gap:10px;align-items:center;padding:10px;border:1px solid #dce7e0;border-radius:11px;background:#fff}.candidate-row.independent{border-color:#bfd8c8;background:#fbfefc}.order{display:grid;justify-items:center;gap:2px}.order b{font-size:14px;color:#174d36}.order button{width:27px;height:24px;border:1px solid #d2ded7;background:#fff;border-radius:6px;color:#1f563e;cursor:pointer}.order button:disabled{opacity:.3}.photo-wrap{display:grid;justify-items:center;gap:5px}.photo{width:72px;height:82px;border-radius:7px;background:#eef4f0;border:1px solid #d9e4dd;overflow:hidden;display:grid;place-items:center;color:#809088;font-size:9px;font-weight:900}.photo img{width:100%;height:100%;object-fit:cover}.upload{position:relative;border:1px solid #c8d9ce;background:#fff;border-radius:7px;color:#17623e;padding:5px 7px;font-size:8px;font-weight:900;cursor:pointer;text-align:center}.upload input{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer}.candidate-details{display:grid;gap:5px}.candidate-details label,.participant-field label{display:grid;gap:5px;font-size:9px;font-weight:900;color:#536b5e}.candidate-details small{font-size:9px;color:#778980;font-weight:700}.participant-field{display:grid;gap:6px}.party-badge{display:flex;align-items:center;gap:7px;font-size:9px;color:#50675b}.party-badge>div{width:28px;height:28px;border-radius:6px;background:#eef4f0;display:grid;place-items:center;overflow:hidden;font-size:7px;font-weight:900}.party-badge img{width:100%;height:100%;object-fit:contain}.party-mark{color:#1b5c3e}.ind-mark{color:#555}.row-actions{display:grid;gap:7px;justify-items:stretch}.photo-status{font-size:8px;font-weight:900;text-align:center}.photo-status.ready{color:#147344}.photo-status.missing{color:#a36b19}.delete{border:1px solid #d5deda;background:#fff;color:#a13d3d;border-radius:8px;padding:8px 9px;font-weight:900;cursor:pointer}.save-bar{display:flex;justify-content:space-between;align-items:center;gap:12px;border-top:1px solid #e5ece8;margin-top:14px;padding-top:14px}.save-bar div{display:grid;gap:3px}.save-bar b{font-size:11px;color:#24523d}.save-bar small{font-size:9px;color:#819087}.preview-card{min-width:0}.notice-poll{background:#fff;border:5px solid #7c1717;border-radius:4px;padding:7px;box-shadow:0 5px 16px rgba(80,20,20,.08)}.poll-head{text-align:center;background:#8d1818;color:#fff;padding:12px 7px;display:grid;gap:4px}.crest{font-size:24px}.poll-head strong{font-size:11px;letter-spacing:.4px}.poll-head b{font-size:14px}.poll-head span{font-size:10px;font-weight:900}.poll-rows{display:grid;gap:3px;padding:5px 0;background:#f6eee8}.poll-row{display:grid;grid-template-columns:26px 42px minmax(0,1fr) 42px 40px;align-items:center;min-height:45px;background:#fff;border:1px solid #8d1818;border-radius:3px;overflow:hidden}.poll-number{font-weight:900;text-align:center;color:#fff;background:#8d1818;height:100%;display:grid;place-items:center;font-size:11px}.poll-photo{height:41px;width:39px;overflow:hidden;display:grid;place-items:center;background:#eef1ee;color:#89938e;font-size:6px;font-weight:900}.poll-photo img{width:100%;height:100%;object-fit:cover}.poll-name{padding:4px;font-size:8px;font-weight:900;line-height:1.15}.poll-party{width:34px;height:34px;margin:auto;border:1px solid #d6ddd8;display:grid;place-items:center;overflow:hidden;font-size:6px;font-weight:900}.poll-party img{width:100%;height:100%;object-fit:contain}.poll-mark{height:100%;display:grid;place-items:center;background:#f3e5df;color:#8d1818;font-size:8px;font-weight:900}.poll-foot{text-align:center;padding:10px 4px;display:grid;gap:3px;color:#174e37}.poll-foot span{font-weight:900;font-size:9px}.poll-foot small{font-size:6px;font-weight:800}.preview-full{margin-top:12px}.preview-full .notice-poll{max-width:720px;margin:15px auto}.notice-poll.large{padding:10px}.notice-poll.large .poll-row{min-height:58px;grid-template-columns:38px 55px minmax(0,1fr) 55px 55px}.notice-poll.large .poll-photo{height:54px;width:52px}.notice-poll.large .poll-name{font-size:11px}.notice-poll.large .poll-head strong{font-size:14px}.notice-poll.large .poll-head b{font-size:17px}.notice-poll.large .poll-head span{font-size:12px}.parliamentary-list{display:grid;gap:8px;margin-top:14px}.parliamentary-row{display:grid;grid-template-columns:1.2fr 1fr 1.3fr auto;gap:8px}.empty{padding:30px;text-align:center;color:#74827b;margin-top:12px}
@media(max-width:1050px){.workspace{grid-template-columns:1fr}.preview-card{order:2}.candidate-row{grid-template-columns:42px 80px minmax(150px,1fr) minmax(160px,1fr)}.row-actions{grid-column:3/-1;display:flex;align-items:center}.row-actions .delete{margin-left:auto}.parliamentary-row{grid-template-columns:1fr 1fr}}
@media(max-width:680px){.page{padding:11px}.header{display:block}.refresh{margin-top:10px;width:100%}.selector{display:block}.summary{margin-top:10px}.participant-heading,.section-head{display:block}.participant-heading .primary,.section-head .primary{width:100%;margin-top:10px}.participant-list{grid-template-columns:1fr 1fr}.tabs{margin-left:0;margin-right:0}.candidate-row{grid-template-columns:38px 1fr;align-items:start}.order{grid-row:1/4}.photo-wrap{grid-column:2;justify-items:start}.candidate-details,.participant-field,.row-actions{grid-column:2}.row-actions{display:flex;align-items:center}.candidate-details input,.participant-field select{font-size:16px}.save-bar{display:block}.save-bar .primary{width:100%;margin-top:10px}.parliamentary-row{grid-template-columns:1fr}.notice-poll.large .poll-row{grid-template-columns:28px 44px minmax(0,1fr) 38px 38px}.notice-poll.large .poll-name{font-size:8px}.notice-poll.large .poll-head strong{font-size:11px}.notice-poll.large .poll-head b{font-size:13px}.notice-poll.large .poll-head span{font-size:9px}}
`;