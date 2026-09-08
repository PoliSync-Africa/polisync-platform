"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../../../../components/dashboard/DashboardShell";
import superAdminNavigation from "../../../../components/dashboard/superAdminNavigation";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://polisync-platform-1.onrender.com").replace(/\/+$/, "");
const MAX_PHOTO_BYTES = 850 * 1024;

const getToken = () => {
  if (typeof window === "undefined") return "";
  return ["polisync_token", "authToken", "accessToken", "token"].map((key) => localStorage.getItem(key) || sessionStorage.getItem(key)).find(Boolean) || "";
};

const request = async (path, options = {}) => {
  const token = getToken();
  const response = await fetch(`${API}${path}`, {
    cache: "no-store",
    ...options,
    headers: { Accept: "application/json", "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) throw new Error(body.message || `Request failed (${response.status})`);
  return body;
};

const independentParty = { id: "independent", name: "Independent", logoUrl: "", isIndependent: true };
const blankCandidate = (party = independentParty, position = "president") => ({ name: "", partyId: party?.isIndependent ? null : party?.id || null, party: party?.name || "Independent", partyLogoUrl: party?.logoUrl || "", profilePictureUrl: "", constituencyId: null, position });

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read the selected photo."));
    reader.readAsDataURL(file);
  });
}

async function compressPhoto(file) {
  if (!file || !file.type.startsWith("image/")) throw new Error("Please select an image file.");
  const source = await fileToDataUrl(file);
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("The selected photo could not be processed."));
    img.src = source;
  });
  const maxDimension = 1000;
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
  canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare the candidate photo.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  let quality = 0.82;
  let result = canvas.toDataURL("image/jpeg", quality);
  while (result.length > MAX_PHOTO_BYTES * 1.37 && quality > 0.5) { quality -= 0.08; result = canvas.toDataURL("image/jpeg", quality); }
  return result;
}

export default function ElectionCandidatesPage() {
  const [elections, setElections] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [tab, setTab] = useState("presidential");
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const election = useMemo(() => elections.find((item) => String(item._id) === String(selectedId)), [elections, selectedId]);
  const participatingParties = useMemo(() => (election?.parties || []).filter((party) => party.name?.trim().toLowerCase() !== "independent").map((party) => ({ ...party, id: party.partyId || party.id, name: party.name, logoUrl: party.logoUrl || "", isIndependent: false })), [election]);
  const ballotParticipants = useMemo(() => [...participatingParties, independentParty], [participatingParties]);
  const presidential = useMemo(() => candidates.filter((candidate) => candidate.position !== "parliamentary" && candidate.position !== "local"), [candidates]);
  const parliamentary = useMemo(() => candidates.filter((candidate) => candidate.position === "parliamentary"), [candidates]);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [electionsResult, geographyResult] = await Promise.all([request("/api/elections"), request("/api/electoral-geography/constituencies")]);
      const list = electionsResult.elections || [];
      setElections(list); setConstituencies(Array.isArray(geographyResult) ? geographyResult : geographyResult.constituencies || []);
      setSelectedId((current) => current || String(list[0]?._id || ""));
    } catch (err) { setError(err.message || "Unable to load election data."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const current = elections.find((item) => String(item._id) === String(selectedId));
    if (!current) { setCandidates([]); return; }
    setCandidates((current.candidates || []).map((candidate) => {
      const party = (current.parties || []).find((item) => String(item.partyId) === String(candidate.partyId)) || (current.parties || []).find((item) => item.name?.toLowerCase() === candidate.party?.toLowerCase());
      const isIndependent = !candidate.partyId || candidate.party?.trim().toLowerCase() === "independent";
      return { ...candidate, partyId: isIndependent ? null : party?.partyId || candidate.partyId || null, party: isIndependent ? "Independent" : party?.name || candidate.party || "", partyLogoUrl: isIndependent ? "" : party?.logoUrl || candidate.partyLogoUrl || "", position: candidate.position || (candidate.constituencyId ? "parliamentary" : "president") };
    }));
    setTab("presidential");
  }, [selectedId, elections]);

  const addPresidentialCandidate = (party = independentParty) => setCandidates((current) => [...current, blankCandidate(party, "president")]);
  const addParliamentaryCandidate = () => setCandidates((current) => [...current, blankCandidate(independentParty, "parliamentary")]);
  const updateCandidate = (index, key, value) => setCandidates((current) => current.map((candidate, itemIndex) => itemIndex === index ? { ...candidate, [key]: value } : candidate));
  const assignParty = (index, partyId) => {
    const party = partyId === "independent" ? independentParty : participatingParties.find((item) => String(item.id) === String(partyId));
    setCandidates((current) => current.map((candidate, itemIndex) => itemIndex === index ? { ...candidate, partyId: party?.isIndependent ? null : party?.id || null, party: party?.name || "Independent", partyLogoUrl: party?.isIndependent ? "" : party?.logoUrl || "" } : candidate));
  };

  const handlePhotoUpload = async (index, file) => {
    if (!file) return;
    setUploadingIndex(index); setError(""); setMessage("");
    try {
      const dataUrl = await compressPhoto(file);
      setCandidates((current) => current.map((candidate, itemIndex) => itemIndex === index ? { ...candidate, profilePictureUrl: dataUrl } : candidate));
      setMessage("Candidate photo added. Save the candidate list to keep it.");
    } catch (err) { setError(err.message || "Unable to add candidate photo."); }
    finally { setUploadingIndex(null); }
  };

  const move = (index, direction, list) => {
    const target = index + direction; if (target < 0 || target >= list.length) return;
    const fromCandidate = list[index], toCandidate = list[target];
    setCandidates((current) => { const a = current.indexOf(fromCandidate), b = current.indexOf(toCandidate); if (a < 0 || b < 0) return current; const next = [...current]; [next[a], next[b]] = [next[b], next[a]]; return next; });
  };
  const removeCandidate = (candidate) => setCandidates((current) => current.filter((item) => item !== candidate));

  const save = async () => {
    if (!election) return;
    setSaving(true); setError(""); setMessage("");
    try {
      if (tab === "presidential") {
        const missing = participatingParties.filter((party) => !presidential.some((candidate) => String(candidate.partyId) === String(party.id) && candidate.name?.trim()));
        if (missing.length) throw new Error(`Add one presidential candidate for: ${missing.map((party) => party.name).join(", ")}.`);
        const independentCandidates = presidential.filter((candidate) => !candidate.partyId && candidate.name?.trim());
        if (independentCandidates.length !== 1) throw new Error(independentCandidates.length ? "Only one Independent presidential candidate is allowed." : "Add the Independent presidential candidate too.");
      }
      if (tab === "parliamentary" && parliamentary.some((candidate) => !candidate.name?.trim() || !candidate.constituencyId)) throw new Error("Every parliamentary candidate needs a name and constituency before saving.");
      const payload = candidates.map((candidate) => ({ name: candidate.name, partyId: candidate.partyId || null, party: candidate.party || "Independent", partyLogoUrl: candidate.partyLogoUrl || "", profilePictureUrl: candidate.profilePictureUrl || "", constituencyId: candidate.constituencyId || null }));
      const result = await request(`/api/elections/${election._id}`, { method: "PATCH", body: JSON.stringify({ candidates: payload }) });
      setElections((current) => current.map((item) => item._id === result.election._id ? result.election : item));
      setMessage("Candidate list, Independent status, photos and party associations saved successfully.");
    } catch (err) { setError(err.message || "Unable to save candidates."); }
    finally { setSaving(false); }
  };

  const renderPartyLogo = (candidate) => candidate.partyLogoUrl ? <img src={candidate.partyLogoUrl} alt="" /> : <span className={candidate.partyId ? "party-initials" : "independent-mark"}>{candidate.partyId ? (candidate.party || "").slice(0, 2).toUpperCase() : "IND"}</span>;
  const renderPhoto = (candidate, realIndex, compact = false) => <div className={compact ? "photo compact-photo" : "photo"}>{candidate.profilePictureUrl ? <img src={candidate.profilePictureUrl} alt="" /> : <span>PHOTO</span>}{!compact && <label className="photo-upload"><input type="file" accept="image/*" onChange={(event) => handlePhotoUpload(realIndex, event.target.files?.[0])} />{uploadingIndex === realIndex ? "Preparing…" : "Upload photo"}</label>}</div>;

  return <DashboardShell role="super_admin" navigation={superAdminNavigation} activeSection="presidential-candidates" title="Election Candidates" subtitle="Manage every presidential candidate equally, including Independent candidates, with participating political parties">
    <main className="page">
      <section className="topbar"><div><span className="eyebrow">POLISYNC AFRICA • ELECTION CONTROL</span><h1>{election?.name || "Election Candidates"}</h1><p>Every participating party and the Independent option receive the same candidate-management treatment.</p></div><button className="refresh" onClick={load}>↻ Refresh</button></section>
      {message && <div className="notice success">✓ {message}</div>}{error && <div className="notice error">{error}</div>}
      <section className="election-picker card"><label>Election<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}><option value="">Select election</option>{elections.map((item) => <option key={item._id} value={item._id}>{item.name} — {item.year} — {item.type}</option>)}</select></label>{election && <div className="stats"><div><small>Parties</small><b>{participatingParties.length}</b></div><div><small>Independent</small><b>1</b></div><div><small>Presidential candidates</small><b>{presidential.length}</b></div></div>}</section>
      {loading ? <section className="card empty">Loading election candidates…</section> : election ? <>
        <div className="participant-strip card"><div><strong>Ballot participants</strong><small>Political parties and Independent are displayed as equal candidate participants.</small></div><div className="participant-buttons">{ballotParticipants.map((party) => <button key={party.id} onClick={() => addPresidentialCandidate(party)}><span className="mini-logo">{party.logoUrl ? <img src={party.logoUrl} alt="" /> : party.isIndependent ? "IND" : party.name.slice(0, 2).toUpperCase()}</span>{party.name}</button>)}</div></div>
        <div className="tabs"><button className={tab === "presidential" ? "active" : ""} onClick={() => setTab("presidential")}>Presidential Candidates</button><button className={tab === "parliamentary" ? "active" : ""} onClick={() => setTab("parliamentary")}>Parliamentary Candidates</button><button className={tab === "ballot" ? "active" : ""} onClick={() => setTab("ballot")}>Ballot Preview</button></div>
        {tab === "presidential" && <section className="workspace"><div className="candidate-panel card"><div className="panel-head"><div><h2>Presidential Candidates</h2><p>Each participating political party has one slot, and Independent has one equal slot.</p></div><button className="primary" onClick={() => addPresidentialCandidate(independentParty)}>+ Add Candidate</button></div><div className="table-head"><span>#</span><span>Photo</span><span>Name</span><span>Participant</span><span>Actions</span></div><div className="rows">{presidential.map((candidate, index) => { const realIndex = candidates.indexOf(candidate); return <article className={`candidate-row ${!candidate.partyId ? "independent-row" : ""}`} key={`${candidate.name}-${index}`}><div className="number"><button onClick={() => move(index, -1, presidential)} disabled={index === 0}>⌃</button><strong>{index + 1}</strong><button onClick={() => move(index, 1, presidential)} disabled={index === presidential.length - 1}>⌄</button></div>{renderPhoto(candidate, realIndex)}<div className="name-field"><input value={candidate.name} onChange={(event) => updateCandidate(realIndex, "name", event.target.value)} placeholder="Candidate full name" /><small>{candidate.party || "Independent"}</small></div><div className="party-field"><div className="party-logo">{renderPartyLogo(candidate)}</div><select value={candidate.partyId || "independent"} onChange={(event) => assignParty(realIndex, event.target.value)}>{ballotParticipants.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}</select></div><div className="actions"><span className="photo-status">{candidate.profilePictureUrl ? "Photo ready" : "No photo"}</span><button className="delete" onClick={() => removeCandidate(candidate)}>Delete</button></div></article>; })}</div><button className="primary save" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Presidential Candidates"}</button></div><aside className="preview card"><div className="panel-head"><div><h2>Ballot Preview</h2><p>Independent is shown in the same ballot participant format as every political party.</p></div></div><BallotPreview candidates={presidential} election={election} renderPartyLogo={renderPartyLogo} /></aside></section>}
        {tab === "parliamentary" && <section className="card"><div className="panel-head"><div><h2>Parliamentary Candidates</h2><p>Associate every candidate with a party or Independent and a constituency.</p></div><button className="primary" onClick={addParliamentaryCandidate}>+ Add Parliamentary Candidate</button></div><div className="parliamentary-list">{parliamentary.map((candidate, index) => { const realIndex = candidates.indexOf(candidate); return <article className="parliamentary-row" key={`${candidate.name}-${index}`}><div className="ordinal">{index + 1}</div>{renderPhoto(candidate, realIndex, true)}<input value={candidate.name} onChange={(event) => updateCandidate(realIndex, "name", event.target.value)} placeholder="Candidate full name" /><select value={candidate.partyId || "independent"} onChange={(event) => assignParty(realIndex, event.target.value)}>{ballotParticipants.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}</select><select value={candidate.constituencyId || ""} onChange={(event) => updateCandidate(realIndex, "constituencyId", event.target.value)}><option value="">Select constituency</option>{constituencies.map((constituency) => <option key={constituency._id || constituency.id} value={constituency._id || constituency.id}>{constituency.name || constituency.constituencyName}</option>)}</select><label className="inline-upload"><input type="file" accept="image/*" onChange={(event) => handlePhotoUpload(realIndex, event.target.files?.[0])} />{uploadingIndex === realIndex ? "Preparing…" : "Upload photo"}</label><button className="delete" onClick={() => removeCandidate(candidate)}>Delete</button></article>; })}{!parliamentary.length && <div className="empty">No parliamentary candidates added yet.</div>}</div><button className="primary save" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Parliamentary Candidates"}</button></section>}
        {tab === "ballot" && <section className="card ballot-full"><div className="panel-head"><div><h2>Presidential Ballot Preview</h2><p>Candidate photos are uploaded directly from your device and displayed here.</p></div><button className="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Order"}</button></div><BallotPreview candidates={presidential} election={election} renderPartyLogo={renderPartyLogo} /></section>}
        <section className="important"><div className="info-icon">i</div><div><strong>Candidate participation rule</strong><p>Every participating political party must have exactly one presidential candidate, and Independent must also have exactly one presidential candidate. Independent candidates are not treated as a lesser or secondary category.</p></div></section>
      </> : <section className="card empty">No election selected.</section>}
    </main><style jsx>{styles}</style>
  </DashboardShell>;
}

function BallotPreview({ candidates, election, renderPartyLogo }) { return <div className="ballot-wrap"><div className="ballot"><div className="ec-mark"><span>EC</span></div><div className="ballot-title"><strong>{String(election?.year || "").toUpperCase()} ELECTION</strong><span>BALLOT ORDER</span></div><div className="ballot-list">{candidates.map((candidate, index) => <div className="ballot-line" key={`${candidate.name}-${index}`}><div className="ballot-person"><div className="ballot-photo">{candidate.profilePictureUrl ? <img src={candidate.profilePictureUrl} alt="" /> : <span>PHOTO</span>}</div><strong>{candidate.name || "Candidate name"}</strong></div><div className="ballot-party"><div className="ballot-logo">{renderPartyLogo(candidate)}</div><small>{candidate.partyId ? candidate.party : "Independent"}</small></div><div className="ballot-number">{index + 1}</div></div>)}</div></div><small className="preview-note">PoliSync ballot preview — not an official Electoral Commission document.</small></div>; }

const styles = `
.page{min-height:100%;padding:clamp(14px,3vw,34px);background:#f5f8f6;color:#17392b;box-sizing:border-box}.topbar,.election-picker,.participant-strip,.workspace,.tabs,.important{max-width:1200px;margin-left:auto;margin-right:auto}.topbar{display:flex;justify-content:space-between;gap:20px;align-items:flex-end;margin-bottom:16px}.eyebrow{font-size:10px;font-weight:900;letter-spacing:1.8px;color:#bd941d}.topbar h1{margin:6px 0;color:#075d2e;font-size:clamp(28px,5vw,46px)}.topbar p{margin:0;color:#718078;line-height:1.5}.refresh,.primary{border:1px solid #075d2e;border-radius:9px;background:#075d2e;color:#fff;padding:10px 14px;font-weight:850;cursor:pointer}.refresh{white-space:nowrap}.refresh:disabled,.primary:disabled{opacity:.55}.card{background:#fff;border:1px solid #dce6e0;border-radius:18px;padding:18px;box-shadow:0 7px 24px rgba(20,60,42,.05)}.election-picker{display:flex;justify-content:space-between;gap:18px;align-items:end;margin-bottom:12px}.election-picker label{display:grid;gap:6px;font-size:11px;font-weight:850;color:#385746;flex:1}.election-picker select,.candidate-row input,.candidate-row select,.parliamentary-row input,.parliamentary-row select{width:100%;box-sizing:border-box;border:1px solid #d3dfd8;border-radius:9px;background:#fbfdfc;color:#17392b;padding:10px 11px;font-size:15px;outline:none}.stats{display:flex;gap:8px}.stats div{min-width:120px;padding:9px 11px;border:1px solid #dbe6df;border-radius:10px;background:#f6faf7;display:grid;gap:2px}.stats small{font-size:9px;color:#7b8a83}.stats b{color:#075d2e;font-size:15px}.notice{max-width:1200px;margin:0 auto 12px;padding:11px 13px;border-radius:10px;font-size:12px;font-weight:800}.success{background:#e8f7ee;color:#17623d}.error{background:#fff0f0;color:#9d3434}.participant-strip{display:flex;justify-content:space-between;gap:15px;align-items:center;margin-bottom:12px}.participant-strip>div:first-child{display:grid;gap:3px;min-width:170px}.participant-strip strong{color:#075d2e}.participant-strip small{font-size:10px;color:#748078}.participant-buttons{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.participant-buttons button{display:flex;align-items:center;gap:6px;border:1px solid #d6e1da;background:#f9fcfa;color:#365847;border-radius:9px;padding:7px 9px;font-size:11px;font-weight:800;cursor:pointer}.mini-logo{width:25px;height:25px;border-radius:50%;background:#edf4ef;display:grid;place-items:center;overflow:hidden;font-size:7px;font-weight:900}.mini-logo img{width:100%;height:100%;object-fit:contain}.tabs{display:flex;gap:7px;margin-bottom:12px;overflow:auto}.tabs button{border:1px solid #d5e0da;background:#fff;color:#52675c;padding:10px 13px;border-radius:9px;font-weight:850;white-space:nowrap;cursor:pointer}.tabs button.active{background:#075d2e;color:#fff;border-color:#075d2e}.workspace{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(320px,.8fr);gap:14px}.panel-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:14px}.panel-head h2{margin:0;color:#075d2e;font-size:20px}.panel-head p{margin:5px 0 0;color:#748078;font-size:12px;line-height:1.5}.table-head{display:grid;grid-template-columns:70px 110px 1.2fr 1fr 1fr;gap:10px;padding:0 10px 8px;color:#829088;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.6px}.rows{display:grid;gap:7px}.candidate-row{display:grid;grid-template-columns:70px 110px minmax(150px,1.2fr) minmax(150px,1fr) minmax(130px,1fr);gap:10px;align-items:center;border:1px solid #dbe6df;border-radius:11px;padding:9px;background:#fbfdfc}.independent-row{border-left:4px solid #bd941d}.number{display:flex;align-items:center;justify-content:center;gap:5px}.number strong{min-width:28px;height:28px;border-radius:8px;background:#f0f4f1;display:grid;place-items:center}.number button{border:0;background:transparent;color:#718078;cursor:pointer;font-weight:900}.number button:disabled{opacity:.25}.photo{width:82px;min-height:82px;border-radius:9px;background:#edf4ef;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;color:#819087;font-size:8px;font-weight:900;gap:5px}.photo img{width:100%;height:100%;min-height:82px;object-fit:cover}.photo-upload{font-size:9px;font-weight:850;color:#075d2e;background:#fff;border:1px solid #d7e4dc;border-radius:7px;padding:5px 6px;cursor:pointer}.photo-upload input,.inline-upload input{display:none}.compact-photo{width:48px;min-height:48px}.compact-photo img{min-height:48px}.name-field{display:grid;gap:4px}.name-field small{font-size:10px;color:#718078}.party-field{display:flex;align-items:center;gap:7px;min-width:0}.party-logo{width:42px;height:42px;flex:0 0 42px;border-radius:50%;background:#edf4ef;display:grid;place-items:center;overflow:hidden;color:#819087;font-size:8px;font-weight:900}.party-logo img{width:100%;height:100%;object-fit:contain}.independent-mark{color:#8b6b08;font-size:8px;font-weight:900}.actions{display:flex;align-items:center;justify-content:flex-end;gap:6px}.photo-status{font-size:9px;color:#668074;font-weight:800}.delete{border:1px solid #efcaca;background:#fff5f5;color:#a33b3b;border-radius:8px;padding:8px 9px;font-weight:800;cursor:pointer}.save{margin-top:14px}.preview{overflow:hidden}.ballot-wrap{background:#fafbfa;border-radius:12px;padding:10px}.ballot{background:#8e0808;border-radius:4px;padding:15px 9px 18px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}.ec-mark{width:38px;height:38px;border-radius:50%;background:#fff;display:grid;place-items:center;color:#075d2e;font-weight:900;margin-bottom:5px}.ballot-title{text-align:center;color:#fff;display:grid;gap:2px;margin-bottom:12px}.ballot-title strong{font-size:19px}.ballot-title span{font-size:10px;letter-spacing:1.4px}.ballot-list{display:grid;gap:3px}.ballot-line{display:grid;grid-template-columns:minmax(0,1.4fr) 90px 38px;min-height:53px;background:#fff;border:1px solid #d3d3d3;align-items:stretch}.ballot-person{display:flex;align-items:center;gap:7px;min-width:0;padding:4px}.ballot-person strong{font-size:9px;color:#252525;line-height:1.1}.ballot-photo{width:38px;height:43px;flex:0 0 38px;background:#eee;display:grid;place-items:center;overflow:hidden;color:#888;font-size:6px}.ballot-photo img{width:100%;height:100%;object-fit:cover}.ballot-party{border-left:1px solid #b8b8b8;border-right:1px solid #b8b8b8;display:grid;place-items:center;gap:1px;padding:3px}.ballot-logo{width:31px;height:25px;display:grid;place-items:center;overflow:hidden;font-size:7px;font-weight:900;color:#111}.ballot-logo img{width:100%;height:100%;object-fit:contain}.ballot-party small{font-size:6px;color:#444;text-align:center;line-height:1}.ballot-number{margin:auto;width:27px;height:30px;border-radius:5px;background:#7f0c0c;color:#fff;display:grid;place-items:center;font-weight:900;font-size:15px}.preview-note{display:block;text-align:center;color:#7b8780;font-size:8px;margin-top:7px}.parliamentary-list{display:grid;gap:8px}.parliamentary-row{display:grid;grid-template-columns:38px 48px 1.3fr 1fr 1.2fr 1fr auto;gap:8px;align-items:center;padding:9px;border:1px solid #dbe6df;border-radius:10px;background:#fbfdfc}.ordinal{width:30px;height:30px;border-radius:8px;background:#edf4ef;display:grid;place-items:center;font-weight:900;color:#31614a}.inline-upload{border:1px solid #d7e4dc;background:#fff;color:#075d2e;border-radius:8px;padding:8px 9px;font-size:9px;font-weight:850;text-align:center;cursor:pointer}.important{margin-top:14px;padding:13px 15px;border:1px solid #cfe7d8;background:#effaf3;border-radius:12px;display:flex;gap:10px}.info-icon{width:22px;height:22px;border:2px solid #16804a;border-radius:50%;display:grid;place-items:center;color:#16804a;font-weight:900;flex:0 0 22px}.important strong{color:#17623d}.important p{margin:3px 0 0;color:#587267;font-size:11px;line-height:1.5}.empty{text-align:center;color:#718078;padding:30px}.ballot-full{max-width:900px;margin:0 auto}.ballot-full .ballot-wrap{max-width:620px;margin:auto}
@media(max-width:1050px){.workspace{grid-template-columns:1fr}.preview{max-width:650px}.candidate-row{grid-template-columns:58px 90px 1.2fr 1fr 1fr}.table-head{grid-template-columns:58px 90px 1.2fr 1fr 1fr}.parliamentary-row{grid-template-columns:35px 48px 1.3fr 1fr 1fr 1fr auto}.participant-strip{align-items:flex-start;flex-direction:column}.participant-buttons{justify-content:flex-start}}
@media(max-width:720px){.page{padding:12px}.topbar{display:block}.refresh{width:100%;margin-top:10px}.election-picker{display:block}.stats{margin-top:10px;display:grid;grid-template-columns:repeat(3,1fr)}.stats div{min-width:0}.stats b{font-size:13px}.card{padding:13px;border-radius:14px}.panel-head{display:block}.panel-head .primary{width:100%;margin-top:10px}.table-head{display:none}.candidate-row{grid-template-columns:44px 82px 1fr;gap:8px}.number{flex-direction:column;gap:0}.photo{width:82px;min-height:82px}.party-field{grid-column:2/-1}.actions{grid-column:2/-1;justify-content:space-between}.tabs{margin-left:-2px}.ballot-line{grid-template-columns:minmax(0,1fr) 70px 34px}.ballot-title strong{font-size:15px}.ballot-person strong{font-size:8px}.important{margin-bottom:10px}.stats small{font-size:8px}.parliamentary-row{grid-template-columns:34px 48px 1fr}.parliamentary-row input,.parliamentary-row select,.parliamentary-row .inline-upload,.parliamentary-row .delete{grid-column:3}.participant-buttons{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:100%}.participant-buttons button{justify-content:flex-start}.photo-upload{font-size:8px}}
`;
