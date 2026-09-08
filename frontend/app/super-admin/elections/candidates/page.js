"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../../../../components/dashboard/DashboardShell";
import superAdminNavigation from "../../../../components/dashboard/superAdminNavigation";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://polisync-platform-1.onrender.com").replace(/\/+$/, "");
const getToken = () => {
  if (typeof window === "undefined") return "";
  return ["polisync_token", "authToken", "accessToken", "token"].map((key) => localStorage.getItem(key) || sessionStorage.getItem(key)).find(Boolean) || "";
};
const request = async (path, options = {}) => {
  const token = getToken();
  const response = await fetch(`${API}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) throw new Error(body.message || `Request failed (${response.status})`);
  return body;
};

const blankCandidate = (party = null, position = "president") => ({
  name: "",
  partyId: party?.id || null,
  party: party?.name || "Independent",
  partyLogoUrl: party?.logoUrl || "",
  profilePictureUrl: "",
  constituencyId: null,
  position,
});

export default function ElectionCandidatesPage() {
  const [elections, setElections] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [parties, setParties] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [tab, setTab] = useState("presidential");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const election = useMemo(() => elections.find((item) => String(item._id) === String(selectedId)), [elections, selectedId]);
  const participatingParties = useMemo(() => (election?.parties || []).map((party) => ({ ...party, id: party.partyId || party.id, name: party.name, logoUrl: party.logoUrl || "" })), [election]);
  const presidential = useMemo(() => candidates.filter((candidate) => candidate.position !== "parliamentary" && candidate.position !== "local"), [candidates]);
  const parliamentary = useMemo(() => candidates.filter((candidate) => candidate.position === "parliamentary"), [candidates]);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [electionsResult, partiesResult, geographyResult] = await Promise.all([
        request("/api/elections"),
        request("/api/elections/parties"),
        request("/api/electoral-geography/constituencies"),
      ]);
      const list = electionsResult.elections || [];
      setElections(list);
      setParties(partiesResult.parties || []);
      setConstituencies(Array.isArray(geographyResult) ? geographyResult : geographyResult.constituencies || []);
      setSelectedId((current) => current || String(list[0]?._id || ""));
    } catch (err) { setError(err.message || "Unable to load election data."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const current = elections.find((item) => String(item._id) === String(selectedId));
    if (!current) { setCandidates([]); return; }
    const normalized = (current.candidates || []).map((candidate) => {
      const party = (current.parties || []).find((item) => String(item.partyId) === String(candidate.partyId)) || (current.parties || []).find((item) => item.name?.toLowerCase() === candidate.party?.toLowerCase());
      return {
        ...candidate,
        partyId: party?.partyId || candidate.partyId || null,
        party: party?.name || candidate.party || "Independent",
        partyLogoUrl: party?.logoUrl || candidate.partyLogoUrl || "",
        position: candidate.position || (candidate.constituencyId ? "parliamentary" : "president"),
      };
    });
    setCandidates(normalized);
    setTab("presidential");
  }, [selectedId, elections]);

  const addPresidentialCandidate = (partyId = null) => {
    const party = participatingParties.find((item) => String(item.id) === String(partyId));
    setCandidates((current) => [...current, blankCandidate(party, "president")]);
  };

  const addParliamentaryCandidate = () => setCandidates((current) => [...current, blankCandidate(null, "parliamentary")]);

  const updateCandidate = (index, key, value) => setCandidates((current) => current.map((candidate, itemIndex) => itemIndex === index ? { ...candidate, [key]: value } : candidate));

  const assignParty = (index, partyId) => {
    const party = participatingParties.find((item) => String(item.id) === String(partyId));
    setCandidates((current) => current.map((candidate, itemIndex) => itemIndex === index ? {
      ...candidate,
      partyId: party?.id || null,
      party: party?.name || "Independent",
      partyLogoUrl: party?.logoUrl || "",
    } : candidate));
  };

  const move = (index, direction, list) => {
    const visible = list;
    const target = index + direction;
    if (target < 0 || target >= visible.length) return;
    const fromCandidate = visible[index];
    const toCandidate = visible[target];
    setCandidates((current) => {
      const a = current.indexOf(fromCandidate);
      const b = current.indexOf(toCandidate);
      if (a < 0 || b < 0) return current;
      const next = [...current]; [next[a], next[b]] = [next[b], next[a]]; return next;
    });
  };

  const removeCandidate = (candidate) => setCandidates((current) => current.filter((item) => item !== candidate));

  const save = async () => {
    if (!election) return;
    setSaving(true); setError(""); setMessage("");
    try {
      if (tab === "presidential") {
        const partyCandidates = participatingParties.map((party) => presidential.find((candidate) => String(candidate.partyId) === String(party.id) && candidate.name?.trim()));
        const missing = participatingParties.filter((party, index) => !partyCandidates[index]);
        if (missing.length) throw new Error(`Add one presidential candidate for: ${missing.map((party) => party.name).join(", ")}.`);
        if (!presidential.some((candidate) => !candidate.partyId && candidate.name?.trim())) throw new Error("Add the Independent presidential candidate too.");
      }
      const payload = candidates.map((candidate) => ({
        name: candidate.name,
        partyId: candidate.partyId || null,
        party: candidate.party || "Independent",
        partyLogoUrl: candidate.partyLogoUrl || "",
        profilePictureUrl: candidate.profilePictureUrl || "",
        constituencyId: candidate.constituencyId || null,
      }));
      const result = await request(`/api/elections/${election._id}`, { method: "PATCH", body: JSON.stringify({ candidates: payload }) });
      setElections((current) => current.map((item) => item._id === result.election._id ? result.election : item));
      setMessage("Candidate list and party associations saved successfully.");
    } catch (err) { setError(err.message || "Unable to save candidates."); }
    finally { setSaving(false); }
  };

  const renderPartyLogo = (candidate) => candidate.partyLogoUrl ? <img src={candidate.partyLogoUrl} alt="" /> : <span>{candidate.partyId ? (candidate.party || "").slice(0, 2).toUpperCase() : "IND."}</span>;

  return <DashboardShell role="super_admin" navigation={superAdminNavigation} activeSection="presidential-candidates" title="Election Candidates" subtitle="Arrange presidential and parliamentary candidates with their participating political parties">
    <main className="page">
      <section className="topbar">
        <div><span className="eyebrow">POLISYNC AFRICA • ELECTION CONTROL</span><h1>{election?.name || "Election Candidates"}</h1><p>Candidate display follows the election configuration and the official ballot order entered by Super Admin.</p></div>
        <button className="refresh" onClick={load}>↻ Refresh</button>
      </section>

      {message && <div className="notice success">✓ {message}</div>}
      {error && <div className="notice error">{error}</div>}

      <section className="election-picker card">
        <label>Election<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}><option value="">Select election</option>{elections.map((item) => <option key={item._id} value={item._id}>{item.name} — {item.year} — {item.type}</option>)}</select></label>
        {election && <div className="stats"><div><small>Participating parties</small><b>{participatingParties.length}</b></div><div><small>Presidential candidates</small><b>{presidential.length}</b></div><div><small>Parliamentary candidates</small><b>{parliamentary.length}</b></div></div>}
      </section>

      {loading ? <section className="card empty">Loading election candidates…</section> : election ? <>
        <div className="tabs"><button className={tab === "presidential" ? "active" : ""} onClick={() => setTab("presidential")}>Presidential Candidates</button><button className={tab === "parliamentary" ? "active" : ""} onClick={() => setTab("parliamentary")}>Parliamentary Candidates</button><button className={tab === "ballot" ? "active" : ""} onClick={() => setTab("ballot")}>Ballot Preview</button></div>

        {tab === "presidential" && <section className="workspace">
          <div className="candidate-panel card">
            <div className="panel-head"><div><h2>Presidential Candidates</h2><p>Each participating political party gets one presidential candidate. Independent is listed separately.</p></div><button className="primary" onClick={() => addPresidentialCandidate(null)}>+ Add Candidate</button></div>
            <div className="table-head"><span>#</span><span>Photo</span><span>Name</span><span>Political Party</span><span>Actions</span></div>
            <div className="rows">
              {presidential.map((candidate, index) => {
                const realIndex = candidates.indexOf(candidate);
                return <article className="candidate-row" key={`${candidate.name}-${index}`}>
                  <div className="number"><button onClick={() => move(index, -1, presidential)} disabled={index === 0}>⌃</button><strong>{index + 1}</strong><button onClick={() => move(index, 1, presidential)} disabled={index === presidential.length - 1}>⌄</button></div>
                  <div className="photo">{candidate.profilePictureUrl ? <img src={candidate.profilePictureUrl} alt="" /> : <span>PHOTO</span>}</div>
                  <div className="name-field"><input value={candidate.name} onChange={(event) => updateCandidate(realIndex, "name", event.target.value)} placeholder="Candidate name" /><small>{candidate.party || "Independent"}</small></div>
                  <div className="party-field"><div className="party-logo">{renderPartyLogo(candidate)}</div><select value={candidate.partyId || ""} onChange={(event) => assignParty(realIndex, event.target.value)}><option value="">Independent</option>{participatingParties.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}</select></div>
                  <div className="actions"><input value={candidate.profilePictureUrl || ""} onChange={(event) => updateCandidate(realIndex, "profilePictureUrl", event.target.value)} placeholder="Photo URL" /><button className="delete" onClick={() => removeCandidate(candidate)}>Delete</button></div>
                </article>;
              })}
            </div>
            <button className="primary save" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Presidential Candidates"}</button>
          </div>

          <aside className="preview card"><div className="panel-head"><div><h2>Ballot Preview</h2><p>EC-style visual preview of the presidential candidate order.</p></div></div><BallotPreview candidates={presidential} election={election} renderPartyLogo={renderPartyLogo} /></aside>
        </section>}

        {tab === "parliamentary" && <section className="card">
          <div className="panel-head"><div><h2>Parliamentary Candidates</h2><p>Associate every parliamentary candidate with a participating political party and constituency.</p></div><button className="primary" onClick={addParliamentaryCandidate}>+ Add Parliamentary Candidate</button></div>
          <div className="parliamentary-list">
            {parliamentary.map((candidate, index) => { const realIndex = candidates.indexOf(candidate); return <article className="parliamentary-row" key={`${candidate.name}-${index}`}><div className="ordinal">{index + 1}</div><input value={candidate.name} onChange={(event) => updateCandidate(realIndex, "name", event.target.value)} placeholder="Candidate full name" /><select value={candidate.partyId || ""} onChange={(event) => assignParty(realIndex, event.target.value)}><option value="">Independent</option>{participatingParties.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}</select><select value={candidate.constituencyId || ""} onChange={(event) => updateCandidate(realIndex, "constituencyId", event.target.value)}><option value="">Select constituency</option>{constituencies.map((constituency) => <option key={constituency._id || constituency.id} value={constituency._id || constituency.id}>{constituency.name || constituency.constituencyName}</option>)}</select><input value={candidate.profilePictureUrl || ""} onChange={(event) => updateCandidate(realIndex, "profilePictureUrl", event.target.value)} placeholder="Photo URL" /><button className="delete" onClick={() => removeCandidate(candidate)}>Delete</button></article>; })}
            {!parliamentary.length && <div className="empty">No parliamentary candidates added yet.</div>}
          </div>
          <button className="primary save" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Parliamentary Candidates"}</button>
        </section>}

        {tab === "ballot" && <section className="card ballot-full"><div className="panel-head"><div><h2>Presidential Ballot Preview</h2><p>This preview uses the saved candidate order, candidate photo and political party logo.</p></div><button className="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Order"}</button></div><BallotPreview candidates={presidential} election={election} renderPartyLogo={renderPartyLogo} /></section>}

        <section className="important"><div className="info-icon">i</div><div><strong>Important</strong><p>Presidential candidates must be associated with the participating political parties for this election. The order shown here becomes the ballot display order. Independent candidates are supported separately.</p></div></section>
      </> : <section className="card empty">No election selected.</section>}
    </main>
    <style jsx>{styles}</style>
  </DashboardShell>;
}

function BallotPreview({ candidates, election, renderPartyLogo }) {
  return <div className="ballot-wrap"><div className="ballot"><div className="ec-mark"><span>EC</span></div><div className="ballot-title"><strong>{String(election?.year || "").toUpperCase()} ELECTION</strong><span>BALLOT ORDER</span></div><div className="ballot-list">{candidates.map((candidate, index) => <div className="ballot-line" key={`${candidate.name}-${index}`}><div className="ballot-person"><div className="ballot-photo">{candidate.profilePictureUrl ? <img src={candidate.profilePictureUrl} alt="" /> : <span>PHOTO</span>}</div><strong>{candidate.name || "Candidate name"}</strong></div><div className="ballot-party"><div className="ballot-logo">{renderPartyLogo(candidate)}</div><small>{candidate.partyId ? candidate.party : "IND."}</small></div><div className="ballot-number">{index + 1}</div></div>)}</div></div><small className="preview-note">PoliSync ballot preview — not an official Electoral Commission document.</small></div>;
}

const styles = `
.page{min-height:100%;padding:clamp(14px,3vw,34px);background:#f5f8f6;color:#17392b;box-sizing:border-box}.topbar,.election-picker,.workspace,.tabs,.important{max-width:1200px;margin-left:auto;margin-right:auto}.topbar{display:flex;justify-content:space-between;gap:20px;align-items:flex-end;margin-bottom:16px}.eyebrow{font-size:10px;font-weight:900;letter-spacing:1.8px;color:#bd941d}.topbar h1{margin:6px 0;color:#075d2e;font-size:clamp(28px,5vw,46px)}.topbar p{margin:0;color:#718078;line-height:1.5}.refresh,.primary{border:1px solid #075d2e;border-radius:9px;background:#075d2e;color:#fff;padding:10px 14px;font-weight:850;cursor:pointer}.refresh{white-space:nowrap}.refresh:disabled,.primary:disabled{opacity:.55}.card{background:#fff;border:1px solid #dce6e0;border-radius:18px;padding:18px;box-shadow:0 7px 24px rgba(20,60,42,.05)}.election-picker{display:flex;justify-content:space-between;gap:18px;align-items:end;margin-bottom:14px}.election-picker label{display:grid;gap:6px;font-size:11px;font-weight:850;color:#385746;flex:1}.election-picker select,.candidate-row input,.candidate-row select,.parliamentary-row input,.parliamentary-row select{width:100%;box-sizing:border-box;border:1px solid #d3dfd8;border-radius:9px;background:#fbfdfc;color:#17392b;padding:10px 11px;font-size:15px;outline:none}.stats{display:flex;gap:8px}.stats div{min-width:120px;padding:9px 11px;border:1px solid #dbe6df;border-radius:10px;background:#f6faf7;display:grid;gap:2px}.stats small{font-size:9px;color:#7b8a83}.stats b{color:#075d2e;font-size:15px}.notice{max-width:1200px;margin:0 auto 12px;padding:11px 13px;border-radius:10px;font-size:12px;font-weight:800}.success{background:#e8f7ee;color:#17623d}.error{background:#fff0f0;color:#9d3434}.tabs{display:flex;gap:7px;margin-bottom:12px;overflow:auto}.tabs button{border:1px solid #d5e0da;background:#fff;color:#52675c;padding:10px 13px;border-radius:9px;font-weight:850;white-space:nowrap;cursor:pointer}.tabs button.active{background:#075d2e;color:#fff;border-color:#075d2e}.workspace{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(320px,.8fr);gap:14px}.panel-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:14px}.panel-head h2{margin:0;color:#075d2e;font-size:20px}.panel-head p{margin:5px 0 0;color:#748078;font-size:12px;line-height:1.5}.table-head{display:grid;grid-template-columns:70px 62px 1.2fr 1fr 1.2fr;gap:10px;padding:0 10px 8px;color:#829088;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.6px}.rows{display:grid;gap:7px}.candidate-row{display:grid;grid-template-columns:70px 62px minmax(150px,1.2fr) minmax(150px,1fr) minmax(150px,1.2fr);gap:10px;align-items:center;border:1px solid #dbe6df;border-radius:11px;padding:9px;background:#fbfdfc}.number{display:flex;align-items:center;justify-content:center;gap:5px}.number strong{min-width:28px;height:28px;border-radius:8px;background:#f0f4f1;display:grid;place-items:center}.number button{border:0;background:transparent;color:#718078;cursor:pointer;font-weight:900}.number button:disabled{opacity:.25}.photo,.party-logo{width:52px;height:52px;border-radius:8px;background:#edf4ef;display:grid;place-items:center;overflow:hidden;color:#819087;font-size:8px;font-weight:900}.photo img,.party-logo img{width:100%;height:100%;object-fit:cover}.name-field{display:grid;gap:4px}.name-field small{font-size:10px;color:#718078}.party-field{display:flex;align-items:center;gap:7px;min-width:0}.party-field .party-logo{width:42px;height:42px;flex:0 0 42px;border-radius:50%}.actions{display:grid;grid-template-columns:1fr auto;gap:5px}.actions input{font-size:11px}.delete{border:1px solid #efcaca;background:#fff5f5;color:#a33b3b;border-radius:8px;padding:8px 9px;font-weight:800;cursor:pointer}.save{margin-top:14px}.preview{overflow:hidden}.ballot-wrap{background:#fafbfa;border-radius:12px;padding:10px}.ballot{background:#8e0808;border-radius:4px;padding:15px 9px 18px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}.ec-mark{width:38px;height:38px;border-radius:50%;background:#fff;display:grid;place-items:center;color:#075d2e;font-weight:900;margin-bottom:5px}.ballot-title{text-align:center;color:#fff;display:grid;gap:2px;margin-bottom:12px}.ballot-title strong{font-size:19px}.ballot-title span{font-size:10px;letter-spacing:1.4px}.ballot-list{display:grid;gap:3px}.ballot-line{display:grid;grid-template-columns:minmax(0,1.4fr) 70px 38px;min-height:53px;background:#fff;border:1px solid #d3d3d3;align-items:stretch}.ballot-person{display:flex;align-items:center;gap:7px;min-width:0;padding:4px}.ballot-person strong{font-size:9px;color:#252525;line-height:1.1}.ballot-photo{width:38px;height:43px;flex:0 0 38px;background:#eee;display:grid;place-items:center;overflow:hidden;color:#888;font-size:6px}.ballot-photo img{width:100%;height:100%;object-fit:cover}.ballot-party{border-left:1px solid #b8b8b8;border-right:1px solid #b8b8b8;display:grid;place-items:center;gap:1px;padding:3px}.ballot-logo{width:31px;height:25px;display:grid;place-items:center;overflow:hidden;font-size:7px;font-weight:900;color:#111}.ballot-logo img{width:100%;height:100%;object-fit:contain}.ballot-party small{font-size:5px;color:#444;text-align:center;line-height:1}.ballot-number{margin:auto;width:27px;height:30px;border-radius:5px;background:#7f0c0c;color:#fff;display:grid;place-items:center;font-weight:900;font-size:15px}.preview-note{display:block;text-align:center;color:#7b8780;font-size:8px;margin-top:7px}.parliamentary-list{display:grid;gap:8px}.parliamentary-row{display:grid;grid-template-columns:38px 1.4fr 1fr 1.2fr 1fr auto;gap:8px;align-items:center;padding:9px;border:1px solid #dbe6df;border-radius:10px;background:#fbfdfc}.ordinal{width:30px;height:30px;border-radius:8px;background:#edf4ef;display:grid;place-items:center;font-weight:900;color:#31614a}.important{margin-top:14px;padding:13px 15px;border:1px solid #cfe7d8;background:#effaf3;border-radius:12px;display:flex;gap:10px}.info-icon{width:22px;height:22px;border:2px solid #16804a;border-radius:50%;display:grid;place-items:center;color:#16804a;font-weight:900;flex:0 0 22px}.important strong{color:#17623d}.important p{margin:3px 0 0;color:#587267;font-size:11px;line-height:1.5}.empty{text-align:center;color:#718078;padding:30px}.ballot-full{max-width:900px;margin:0 auto}.ballot-full .ballot-wrap{max-width:620px;margin:auto}
@media(max-width:1050px){.workspace{grid-template-columns:1fr}.preview{max-width:650px}.candidate-row{grid-template-columns:58px 54px 1.2fr 1fr 1fr}.table-head{grid-template-columns:58px 54px 1.2fr 1fr 1fr}.parliamentary-row{grid-template-columns:35px 1.3fr 1fr 1fr 1fr auto}}
@media(max-width:720px){.page{padding:12px}.topbar{display:block}.refresh{width:100%;margin-top:10px}.election-picker{display:block}.stats{margin-top:10px;display:grid;grid-template-columns:repeat(3,1fr)}.stats div{min-width:0}.stats b{font-size:13px}.card{padding:13px;border-radius:14px}.panel-head{display:block}.panel-head .primary{width:100%;margin-top:10px}.table-head{display:none}.candidate-row{grid-template-columns:44px 48px 1fr;gap:8px}.number{flex-direction:column;gap:0}.photo{width:48px;height:48px}.party-field{grid-column:2/-1}.actions{grid-column:2/-1;grid-template-columns:1fr auto}.parliamentary-row{grid-template-columns:34px 1fr}.parliamentary-row select,.parliamentary-row input:not(:first-of-type),.parliamentary-row .delete{grid-column:2}.tabs{margin-left:-2px}.ballot-line{grid-template-columns:minmax(0,1fr) 58px 34px}.ballot-title strong{font-size:15px}.ballot-person strong{font-size:8px}.important{margin-bottom:10px}.stats small{font-size:8px}}
`;
