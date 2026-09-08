"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../../../../components/dashboard/DashboardShell";
import superAdminNavigation from "../../../../components/dashboard/superAdminNavigation";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://polisync-platform-1.onrender.com").replace(/\/+$/, "");
const MAX_PHOTO_BYTES = 850 * 1024;
const independent = { id: "independent", name: "Independent", logoUrl: "", isIndependent: true };

function token() {
  if (typeof window === "undefined") return "";
  return ["polisync_token", "authToken", "accessToken", "token"]
    .map((key) => localStorage.getItem(key) || sessionStorage.getItem(key))
    .find(Boolean) || "";
}

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...(options.headers || {}),
    },
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

function participantFromElection(party) {
  return {
    ...party,
    id: party.partyId || party.id,
    name: party.name,
    logoUrl: party.logoUrl || "",
    isIndependent: false,
  };
}

function makeCandidate(party = independent, position = "parliamentary") {
  return {
    name: "",
    partyId: party.isIndependent ? null : party.id,
    party: party.name,
    partyLogoUrl: party.logoUrl || "",
    profilePictureUrl: "",
    constituencyId: null,
    position,
    ballotNumber: null,
  };
}

function candidateBelongsToParty(candidate, party) {
  if (party.isIndependent) return !candidate.partyId || String(candidate.party || "").trim().toLowerCase() === "independent";
  return String(candidate.partyId || "") === String(party.id || "") || String(candidate.party || "").trim().toLowerCase() === String(party.name || "").trim().toLowerCase();
}

function normalizeCandidates(election) {
  const isPresidential = String(election?.type || "").toLowerCase() === "presidential";
  return (election?.candidates || []).map((candidate) => {
    const party = (election.parties || []).find((item) => String(item.partyId) === String(candidate.partyId)) ||
      (election.parties || []).find((item) => String(item.name || "").trim().toLowerCase() === String(candidate.party || "").trim().toLowerCase());
    const isIndependent = !candidate.partyId || String(candidate.party || "").trim().toLowerCase() === "independent";
    const position = isPresidential ? "president" : (candidate.position || (candidate.constituencyId ? "parliamentary" : "president"));
    return {
      ...candidate,
      partyId: isIndependent ? null : party?.partyId || candidate.partyId || null,
      party: isIndependent ? "Independent" : party?.name || candidate.party || "",
      partyLogoUrl: isIndependent ? "" : party?.logoUrl || candidate.partyLogoUrl || "",
      position,
      constituencyId: isPresidential ? null : candidate.constituencyId || null,
      ballotNumber: candidate.ballotNumber || null,
    };
  });
}

function BallotPreview({ election, candidates, large = false }) {
  return (
    <div className={`notice-poll ${large ? "large" : ""}`}>
      <div className="poll-head">
        <div className="crest">★</div>
        <strong>ELECTORAL COMMISSION OF GHANA</strong>
        <b>{election?.name || "GENERAL ELECTION"}</b>
        <span>PRESIDENTIAL BALLOT PAPER</span>
      </div>
      <div className="poll-rows">
        {candidates.map((candidate, index) => (
          <div className="poll-row" key={`${candidate.partyId || "independent"}-${index}`}>
            <div className="poll-number">{index + 1}</div>
            <div className="poll-photo">{candidate.profilePictureUrl ? <img src={candidate.profilePictureUrl} alt="" /> : <span>PHOTO</span>}</div>
            <div className="poll-name">{candidate.name || "Candidate name"}</div>
            <div className="poll-party">
              {candidate.partyLogoUrl ? <img src={candidate.partyLogoUrl} alt="" /> : <span>{candidate.partyId ? String(candidate.party || "").slice(0, 3).toUpperCase() : "IND."}</span>}
            </div>
            <div className="poll-mark">{candidate.partyId ? String(candidate.party || "").slice(0, 3).toUpperCase() : "IND."}</div>
          </div>
        ))}
      </div>
      <div className="poll-foot"><span>YOUR VOTE, YOUR FUTURE</span><small>TRANSPARENCY • INTEGRITY • A STRONGER GHANA</small></div>
    </div>
  );
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
  const parties = useMemo(() => (election?.parties || [])
    .filter((party) => String(party.name || "").trim().toLowerCase() !== "independent")
    .map(participantFromElection), [election]);
  const participants = useMemo(() => [...parties, independent], [parties]);
  const presidential = useMemo(() => candidates.filter((candidate) => candidate.position === "president"), [candidates]);
  const nonPresidential = useMemo(() => candidates.filter((candidate) => candidate.position !== "president"), [candidates]);
  const electionIsPresidential = String(election?.type || "").toLowerCase() === "presidential";
  const nonPresidentialPosition = String(election?.type || "").toLowerCase() === "local" ? "local" : "parliamentary";

  async function load() {
    setLoading(true);
    setError("");
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
      setError(err.message || "Unable to load elections and candidates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!election) {
      setCandidates([]);
      return;
    }
    setCandidates(normalizeCandidates(election));
    setTab(String(election.type || "").toLowerCase() === "presidential" ? "presidential" : "candidates");
    setMessage("");
    setError("");
  }, [election]);

  function presidentialSlots() {
    const slots = participants.map((party) => {
      const existing = presidential.find((candidate) => candidateBelongsToParty(candidate, party));
      return existing || makeCandidate(party, "president");
    });
    return slots;
  }

  function setPresidentialSlot(party, key, value) {
    setCandidates((current) => {
      const withoutParty = current.filter((candidate) => !candidateBelongsToParty(candidate, party) || candidate.position !== "president");
      const existing = current.find((candidate) => candidateBelongsToParty(candidate, party) && candidate.position === "president");
      const base = existing || makeCandidate(party, "president");
      return [...withoutParty, { ...base, [key]: value }];
    });
  }

  async function uploadPresidentialPhoto(party, file) {
    if (!file) return;
    const key = `president-${party.id}`;
    setUploading(key);
    setError("");
    try {
      const photo = await compressPhoto(file);
      setPresidentialSlot(party, "profilePictureUrl", photo);
      setMessage(`${party.name} candidate photo added. Save the presidential ballot to keep it permanently.`);
    } catch (err) {
      setError(err.message || "Unable to prepare candidate photo.");
    } finally {
      setUploading(null);
    }
  }

  function addCandidateForParty(party) {
    setCandidates((current) => [...current, makeCandidate(party, nonPresidentialPosition)]);
    setTab("candidates");
    setMessage(`New ${nonPresidentialPosition} candidate slot created for ${party.name}.`);
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
    setUploading(`candidate-${index}`);
    setError("");
    try {
      const photo = await compressPhoto(file);
      updateCandidate(index, "profilePictureUrl", photo);
      setMessage("Candidate photo added. Save the election candidate list to keep it permanently.");
    } catch (err) {
      setError(err.message || "Unable to prepare candidate photo.");
    } finally {
      setUploading(null);
    }
  }

  function removeCandidate(candidate) {
    setCandidates((current) => current.filter((item) => item !== candidate));
  }

  async function save() {
    if (!election) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (electionIsPresidential) {
        const slots = presidentialSlots();
        const missingName = slots.filter((candidate) => !candidate.name?.trim());
        const missingPhoto = slots.filter((candidate) => !candidate.profilePictureUrl);
        if (missingName.length) throw new Error(`Add a candidate name for: ${missingName.map((candidate) => candidate.party || "Independent").join(", ")}.`);
        if (missingPhoto.length) throw new Error(`Upload a profile picture for: ${missingPhoto.map((candidate) => candidate.party || "Independent").join(", ")}.`);
      } else if (nonPresidential.some((candidate) => !candidate.name?.trim() || !candidate.constituencyId)) {
        throw new Error(`Every ${election.type.toLowerCase()} candidate needs a name and constituency before saving.`);
      }

      const source = electionIsPresidential ? presidentialSlots() : candidates;
      const payload = source.map((candidate, index) => ({
        name: String(candidate.name || "").trim(),
        partyId: candidate.partyId || null,
        party: candidate.party || "Independent",
        partyLogoUrl: candidate.partyLogoUrl || "",
        profilePictureUrl: candidate.profilePictureUrl || "",
        constituencyId: electionIsPresidential ? null : (candidate.constituencyId || null),
        position: electionIsPresidential ? "president" : (candidate.position || nonPresidentialPosition),
        ballotNumber: electionIsPresidential ? index + 1 : null,
      })).filter((candidate) => candidate.name);

      const result = await request(`/api/elections/${election._id}/candidates`, {
        method: "PATCH",
        body: JSON.stringify({ candidates: payload }),
      });
      setElections((current) => current.map((item) => item._id === result.election._id ? result.election : item));
      setMessage(`All ${election.type.toLowerCase()} candidate names, party assignments and profile pictures have been permanently saved.`);
    } catch (err) {
      setError(err.message || "Unable to save candidates.");
    } finally {
      setSaving(false);
    }
  }

  function partyLogo(candidate) {
    if (candidate.partyLogoUrl) return <img src={candidate.partyLogoUrl} alt="" />;
    return <span>{candidate.partyId ? String(candidate.party || "").slice(0, 3).toUpperCase() : "IND"}</span>;
  }

  const slots = electionIsPresidential ? presidentialSlots() : [];

  return (
    <DashboardShell role="super_admin" navigation={superAdminNavigation} activeSection="presidential-candidates" title="Election Candidates" subtitle="Super Admin candidate management for every participating party and every election">
      <main className="page">
        <header className="header">
          <div>
            <span className="eyebrow">POLISYNC AFRICA • ELECTION CONTROL</span>
            <h1>Election Candidates</h1>
            <p>{election ? `${election.name} • ${election.year} • ${election.type}` : "Select an election to manage its candidates."}</p>
          </div>
          <button className="refresh" onClick={load}>↻ Refresh</button>
        </header>

        {message && <div className="notice success">✓ {message}</div>}
        {error && <div className="notice error">{error}</div>}

        <section className="card selector">
          <label>Election
            <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
              <option value="">Select election</option>
              {elections.map((item) => <option key={item._id} value={item._id}>{item.name} — {item.year} — {item.type}</option>)}
            </select>
          </label>
          {election && <div className="summary">
            <span><b>{parties.length}</b> participating parties</span>
            <span><b>1</b> Independent participant</span>
            <span><b>{election.candidates?.length || 0}</b> saved candidates</span>
          </div>}
        </section>

        {loading ? <section className="card empty">Loading elections, parties and electoral geography…</section> : !election ? <section className="card empty">Select an election to continue.</section> : (
          <>
            <section className="card participants">
              <div className="participant-heading">
                <div>
                  <h2>Participating Parties</h2>
                  <p>Every party in this election is available to the Super Admin for candidate entry. Independent remains a separate participant.</p>
                </div>
              </div>
              <div className="participant-list">
                {participants.map((participant) => (
                  <div className="participant" key={participant.id}>
                    <div className="participant-logo">{participant.logoUrl ? <img src={participant.logoUrl} alt="" /> : participant.isIndependent ? "IND." : participant.name.slice(0, 3).toUpperCase()}</div>
                    <strong>{participant.name}</strong>
                    <small>{participant.isIndependent ? "Independent participant" : "Participating political party"}</small>
                  </div>
                ))}
              </div>
            </section>

            {electionIsPresidential ? (
              <section className="workspace">
                <div className="card candidate-card">
                  <div className="section-head">
                    <div>
                      <h2>Presidential Candidates — One Slot Per Party</h2>
                      <p>The Super Admin can enter or replace the candidate name and profile picture for every participating party and Independent. Party assignment is fixed to each slot.</p>
                    </div>
                  </div>

                  <div className="candidate-list">
                    {slots.map((candidate, index) => {
                      const party = participants[index];
                      const uploadKey = `president-${party.id}`;
                      return (
                        <article className={`party-candidate-row ${party.isIndependent ? "independent" : ""}`} key={party.id}>
                          <div className="party-identity">
                            <div className="party-logo">{party.logoUrl ? <img src={party.logoUrl} alt="" /> : party.isIndependent ? "IND." : party.name.slice(0, 3).toUpperCase()}</div>
                            <div><strong>{party.name}</strong><small>{party.isIndependent ? "Independent presidential candidate" : "Party presidential candidate"}</small></div>
                          </div>
                          <div className="candidate-photo-block">
                            <div className="photo">{candidate.profilePictureUrl ? <img src={candidate.profilePictureUrl} alt="Candidate" /> : <span>PHOTO</span>}</div>
                            <label className="upload">
                              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadPresidentialPhoto(party, event.target.files?.[0])} />
                              {uploading === uploadKey ? "Preparing…" : candidate.profilePictureUrl ? "Change photo" : "Upload photo"}
                            </label>
                          </div>
                          <label className="name-field">Candidate full name
                            <input value={candidate.name || ""} onChange={(event) => setPresidentialSlot(party, "name", event.target.value)} placeholder={`Enter ${party.name} candidate name`} />
                          </label>
                          <div className="status-block">
                            <span className={candidate.name?.trim() && candidate.profilePictureUrl ? "ready" : "missing"}>{candidate.name?.trim() && candidate.profilePictureUrl ? "Ready to save" : "Name + photo required"}</span>
                            <b>Ballot position {index + 1}</b>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  <div className="save-bar">
                    <div><b>Permanent presidential ballot</b><small>One presidential candidate is stored for every participating party plus Independent.</small></div>
                    <button className="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save All Presidential Candidates"}</button>
                  </div>
                </div>
                <aside className="card preview-card">
                  <div className="section-head"><div><h2>Notice of Poll Preview</h2><p>System preview of the configured presidential candidates.</p></div></div>
                  <BallotPreview election={election} candidates={slots} />
                </aside>
              </section>
            ) : (
              <section className="card candidate-card non-presidential">
                <div className="section-head">
                  <div>
                    <h2>{election.type} Candidates</h2>
                    <p>Add candidates for any participating party or Independent. Each candidate receives a name, profile picture, party assignment and constituency.</p>
                  </div>
                </div>

                <div className="quick-party-grid">
                  {participants.map((party) => (
                    <button key={party.id} className="party-add" onClick={() => addCandidateForParty(party)}>
                      <span>{party.logoUrl ? <img src={party.logoUrl} alt="" /> : party.isIndependent ? "IND." : party.name.slice(0, 3).toUpperCase()}</span>
                      <b>+ Add for {party.name}</b>
                    </button>
                  ))}
                </div>

                <div className="candidate-list">
                  {nonPresidential.length === 0 && <div className="empty">No {election.type.toLowerCase()} candidates added yet. Choose a party above to create the first candidate.</div>}
                  {nonPresidential.map((candidate) => {
                    const realIndex = candidates.indexOf(candidate);
                    return (
                      <article className="candidate-row" key={`${realIndex}-${candidate.name}`}>
                        <div className="photo-wrap">
                          <div className="photo">{candidate.profilePictureUrl ? <img src={candidate.profilePictureUrl} alt="Candidate" /> : <span>PHOTO</span>}</div>
                          <label className="upload"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadPhoto(realIndex, event.target.files?.[0])} />{uploading === `candidate-${realIndex}` ? "Preparing…" : candidate.profilePictureUrl ? "Change photo" : "Upload photo"}</label>
                        </div>
                        <label className="name-field">Candidate full name<input value={candidate.name || ""} onChange={(event) => updateCandidate(realIndex, "name", event.target.value)} placeholder="Candidate full name" /></label>
                        <label className="name-field">Political party / participant<select value={candidate.partyId || "independent"} onChange={(event) => assignParty(realIndex, event.target.value)}>{participants.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}</select></label>
                        <label className="name-field">Constituency<select value={candidate.constituencyId || ""} onChange={(event) => updateCandidate(realIndex, "constituencyId", event.target.value)}><option value="">Select constituency</option>{constituencies.map((item) => <option key={item._id || item.id} value={item._id || item.id}>{item.name || item.constituencyName || item.title}</option>)}</select></label>
                        <div className="row-actions"><span className={candidate.name?.trim() && candidate.profilePictureUrl ? "ready" : "missing"}>{candidate.name?.trim() && candidate.profilePictureUrl ? "Photo ready" : "Photo required"}</span><button className="delete" onClick={() => removeCandidate(candidate)}>Delete</button></div>
                      </article>
                    );
                  })}
                </div>

                <div className="save-bar">
                  <div><b>Permanent {election.type.toLowerCase()} candidate list</b><small>Candidate names, photos, party affiliations and constituencies are saved to this election until edited.</small></div>
                  <button className="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : `Save ${election.type} Candidates`}</button>
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <style jsx>{styles}</style>
    </DashboardShell>
  );
}

const styles = `
.page{min-height:100%;padding:clamp(14px,3vw,36px);background:#f4f7f5;color:#173b2c;box-sizing:border-box}.header,.card,.workspace,.notice{max-width:1240px;margin-left:auto;margin-right:auto}.header{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;margin-bottom:18px}.eyebrow{font-size:10px;font-weight:900;letter-spacing:1.6px;color:#b48a19}.header h1{margin:6px 0;color:#075f31;font-size:clamp(28px,5vw,44px)}.header p{margin:0;color:#72827a}.refresh,.primary{border:0;border-radius:9px;background:#075f31;color:#fff;padding:11px 16px;font-weight:900;cursor:pointer}.refresh{white-space:nowrap}.refresh:disabled,.primary:disabled{opacity:.55;cursor:not-allowed}.card{background:#fff;border:1px solid #dce6e0;border-radius:15px;box-shadow:0 6px 20px rgba(20,60,42,.05);padding:18px;box-sizing:border-box}.notice{padding:11px 14px;border-radius:10px;margin-bottom:12px;font-size:12px;font-weight:800}.notice.success{background:#e8f6ed;color:#17633e}.notice.error{background:#fff0f0;color:#a03939}.selector{display:flex;align-items:flex-end;justify-content:space-between;gap:18px}.selector label{display:grid;gap:6px;max-width:620px;width:100%;font-size:11px;font-weight:900;color:#365746}.selector select,.name-field input,.name-field select{width:100%;box-sizing:border-box;border:1px solid #d3e0d8;border-radius:9px;background:#fbfdfc;color:#183d2d;padding:11px 12px;font-size:16px;outline:none}.summary{display:flex;gap:12px;flex-wrap:wrap}.summary span{padding:9px 11px;background:#f0f7f3;border-radius:8px;font-size:10px;color:#587066}.summary b{color:#075f31;margin-right:4px}.participants{margin-top:14px}.participant-heading h2,.section-head h2{margin:0;color:#075f31;font-size:19px}.participant-heading p,.section-head p{margin:4px 0 0;color:#77857e;font-size:11px;line-height:1.5}.participant-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-top:14px}.participant{display:grid;grid-template-columns:38px 1fr;grid-template-rows:auto auto;align-items:center;column-gap:9px;padding:9px;border:1px solid #dfe8e2;border-radius:10px;background:#fbfdfc}.participant-logo{grid-row:1/3;width:38px;height:38px;border-radius:7px;background:#eef4f0;display:grid;place-items:center;overflow:hidden;font-size:9px;font-weight:900;color:#286047}.participant-logo img{width:100%;height:100%;object-fit:contain}.participant strong{font-size:11px}.participant small{font-size:8px;color:#829088}.workspace{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(300px,.85fr);gap:14px;margin-top:12px}.candidate-card{min-width:0}.candidate-list{margin-top:14px;display:grid;gap:8px}.party-candidate-row{display:grid;grid-template-columns:1.05fr 100px minmax(180px,1.3fr) 145px;gap:12px;align-items:center;padding:12px;border:1px solid #dce7e0;border-radius:11px;background:#fff}.party-candidate-row.independent{border-color:#bfd8c8;background:#fbfefc}.party-identity{display:flex;align-items:center;gap:10px}.party-identity>div:last-child{display:grid;gap:3px}.party-identity strong{font-size:12px;color:#194b36}.party-identity small{font-size:9px;color:#7b8982}.party-logo{width:44px;height:44px;border-radius:8px;background:#eef4f0;display:grid;place-items:center;overflow:hidden;font-size:9px;font-weight:900;color:#286047}.party-logo img{width:100%;height:100%;object-fit:contain}.candidate-photo-block{display:grid;justify-items:center;gap:6px}.photo{width:72px;height:82px;border-radius:7px;background:#eef4f0;border:1px solid #d9e4dd;overflow:hidden;display:grid;place-items:center;color:#809088;font-size:9px;font-weight:900}.photo img{width:100%;height:100%;object-fit:cover}.upload{position:relative;border:1px solid #c8d9ce;background:#fff;border-radius:7px;color:#17623e;padding:5px 7px;font-size:8px;font-weight:900;cursor:pointer;text-align:center}.upload input{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer}.name-field{display:grid;gap:6px;font-size:9px;font-weight:900;color:#536b5e}.status-block{display:grid;gap:8px;justify-items:end;font-size:9px}.status-block b{font-size:9px;color:#61766b}.ready{color:#147344;font-weight:900}.missing{color:#a36b19;font-weight:900}.save-bar{display:flex;justify-content:space-between;align-items:center;gap:12px;border-top:1px solid #e5ece8;margin-top:14px;padding-top:14px}.save-bar div{display:grid;gap:3px}.save-bar b{font-size:11px;color:#24523d}.save-bar small{font-size:9px;color:#819087}.preview-card{min-width:0}.notice-poll{background:#fff;border:5px solid #7c1717;border-radius:4px;padding:7px;box-shadow:0 5px 16px rgba(80,20,20,.08)}.poll-head{text-align:center;background:#8d1818;color:#fff;padding:12px 7px;display:grid;gap:4px}.crest{font-size:24px}.poll-head strong{font-size:11px;letter-spacing:.4px}.poll-head b{font-size:14px}.poll-head span{font-size:10px;font-weight:900}.poll-rows{display:grid;gap:3px;padding:5px 0;background:#f6eee8}.poll-row{display:grid;grid-template-columns:26px 42px minmax(0,1fr) 42px 40px;align-items:center;min-height:45px;background:#fff;border:1px solid #8d1818;border-radius:3px;overflow:hidden}.poll-number{font-weight:900;text-align:center;color:#fff;background:#8d1818;height:100%;display:grid;place-items:center;font-size:11px}.poll-photo{height:41px;width:39px;overflow:hidden;display:grid;place-items:center;background:#eef1ee;color:#89938e;font-size:6px;font-weight:900}.poll-photo img{width:100%;height:100%;object-fit:cover}.poll-name{padding:4px;font-size:8px;font-weight:900;line-height:1.15}.poll-party{width:34px;height:34px;margin:auto;border:1px solid #d6ddd8;display:grid;place-items:center;overflow:hidden;font-size:6px;font-weight:900}.poll-party img{width:100%;height:100%;object-fit:contain}.poll-mark{height:100%;display:grid;place-items:center;background:#f3e5df;color:#8d1818;font-size:8px;font-weight:900}.poll-foot{text-align:center;padding:10px 4px;display:grid;gap:3px;color:#174e37}.poll-foot span{font-weight:900;font-size:9px}.poll-foot small{font-size:6px;font-weight:800}.non-presidential{margin-top:12px}.quick-party-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-top:14px}.party-add{border:1px solid #d5e1da;background:#fbfdfc;border-radius:10px;padding:10px;display:flex;align-items:center;gap:8px;text-align:left;color:#194b36;cursor:pointer}.party-add span{width:34px;height:34px;border-radius:7px;background:#eef4f0;display:grid;place-items:center;overflow:hidden;font-size:7px;font-weight:900}.party-add img{width:100%;height:100%;object-fit:contain}.party-add b{font-size:9px}.candidate-row{display:grid;grid-template-columns:90px minmax(160px,1.1fr) minmax(160px,1fr) minmax(170px,1fr) 90px;gap:9px;align-items:center;padding:10px;border:1px solid #dce7e0;border-radius:11px;background:#fff}.photo-wrap{display:grid;justify-items:center;gap:5px}.row-actions{display:grid;gap:7px;justify-items:stretch}.delete{border:1px solid #d5deda;background:#fff;color:#a13d3d;border-radius:8px;padding:8px 9px;font-weight:900;cursor:pointer}.empty{padding:30px;text-align:center;color:#74827b;margin-top:12px}
@media(max-width:1050px){.workspace{grid-template-columns:1fr}.preview-card{order:2}.party-candidate-row{grid-template-columns:1fr 100px 1.2fr}.status-block{grid-column:1/-1;display:flex;justify-content:space-between}.candidate-row{grid-template-columns:90px 1fr 1fr}.candidate-row .name-field:nth-child(4){grid-column:2/-1}.candidate-row .row-actions{grid-column:2/-1;display:flex;align-items:center}.row-actions .delete{margin-left:auto}}
@media(max-width:680px){.page{padding:11px}.header{display:block}.refresh{margin-top:10px;width:100%}.selector{display:block}.summary{margin-top:10px}.party-candidate-row{grid-template-columns:1fr}.candidate-photo-block{justify-items:start}.status-block{grid-column:auto;display:grid;justify-items:start}.candidate-row{grid-template-columns:1fr}.candidate-row .name-field:nth-child(4),.candidate-row .row-actions{grid-column:auto}.candidate-row input,.candidate-row select{font-size:16px}.save-bar{display:block}.save-bar .primary{width:100%;margin-top:10px}.participant-list{grid-template-columns:1fr 1fr}.quick-party-grid{grid-template-columns:1fr 1fr}.notice-poll .poll-row{grid-template-columns:26px 42px minmax(0,1fr) 36px 34px}}
`;
