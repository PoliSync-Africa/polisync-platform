"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import superAdminNavigation from "../../../components/dashboard/superAdminNavigation";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://polisync-platform-1.onrender.com").replace(/\/+$/, "");

function getToken() {
  if (typeof window === "undefined") return "";
  return ["polisync_token", "authToken", "accessToken", "token"]
    .map((key) => localStorage.getItem(key) || sessionStorage.getItem(key))
    .find(Boolean) || "";
}

async function request(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
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
  if (!response.ok || body.success === false) {
    throw new Error(body.message || `Request failed (${response.status})`);
  }
  return body;
}

function partyId(value) {
  return String(value?.partyId || value?.id || "");
}

function candidateForParty(candidates, party) {
  return candidates.find(
    (candidate) =>
      !candidate.constituencyId &&
      String(candidate.partyId || "") === String(party.partyId || "")
  );
}

function formatDate(value) {
  if (!value) return "Date not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not set";
  return new Intl.DateTimeFormat("en-GH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Africa/Accra",
  }).format(date);
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Accra",
  }).format(date);
}

function toDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Africa/Accra",
  }).format(date);
}

function toTimeInput(value, fallback) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("en-GH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Accra",
  }).format(date);
}

function imageData(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    if (!file.type.startsWith("image/")) return reject(new Error("Please select an image file."));
    if (file.size > 2 * 1024 * 1024) return reject(new Error("Image must be 2 MB or smaller."));
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read the image."));
    reader.readAsDataURL(file);
  });
}

const emptyForm = () => ({
  name: "",
  electionDate: new Date().toISOString().slice(0, 10),
  startTime: "08:00",
  endTime: "17:00",
  type: "Presidential",
  country: "Ghana",
  status: "Draft",
  totalPollingStations: 0,
  parties: [],
  candidates: [],
});

function formFromElection(election) {
  return {
    ...emptyForm(),
    name: election.name || "",
    electionDate: toDateInput(election.startDateTime) || `${election.year || new Date().getFullYear()}-01-01`,
    startTime: toTimeInput(election.startDateTime, "08:00"),
    endTime: toTimeInput(election.endDateTime, "17:00"),
    type: election.type || "Presidential",
    country: election.country || "Ghana",
    status: election.status || "Draft",
    totalPollingStations: election.totalPollingStations || 0,
    parties: Array.isArray(election.parties) ? election.parties : [],
    candidates: Array.isArray(election.candidates) ? election.candidates : [],
  };
}

export default function ElectionsPage() {
  const [elections, setElections] = useState([]);
  const [systemParties, setSystemParties] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState("all");
  const [geo, setGeo] = useState({ regions: 0, constituencies: 0, pollingStations: 0, ready: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [electionsResponse, partiesResponse, geoResponse] = await Promise.all([
        request("/api/elections"),
        request("/api/elections/parties"),
        request("/api/electoral-geography/summary"),
      ]);
      setElections(Array.isArray(electionsResponse.elections) ? electionsResponse.elections : []);
      setSystemParties(Array.isArray(partiesResponse.parties) ? partiesResponse.parties : []);
      setGeo(geoResponse.data || { regions: 0, constituencies: 0, pollingStations: 0, ready: false });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visibleElections = useMemo(() => {
    if (view === "live") return elections.filter((election) => election.status === "Active");
    if (view === "history") return elections.filter((election) => election.status === "Closed");
    return elections;
  }, [elections, view]);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const selectedPartyIds = new Set(form.parties.map((party) => partyId(party)));

  const addSystemParty = (event) => {
    const id = event.target.value;
    event.target.value = "";
    const party = systemParties.find((item) => String(item.id) === String(id));
    if (!party || selectedPartyIds.has(String(party.id))) return;
    setForm((current) => ({
      ...current,
      parties: [
        ...current.parties,
        { partyId: party.id, name: party.name, logoUrl: party.logoUrl || "" },
      ],
    }));
  };

  const removeParty = (id) => {
    setForm((current) => ({
      ...current,
      parties: current.parties.filter((party) => String(party.partyId) !== String(id)),
      candidates: current.candidates.filter((candidate) => String(candidate.partyId || "") !== String(id)),
    }));
  };

  const addCandidateForParty = (party) => {
    const exists = candidateForParty(form.candidates, party);
    if (exists) {
      setError(`${party.name} already has a presidential candidate.`);
      return;
    }
    setError("");
    setForm((current) => ({
      ...current,
      candidates: [
        ...current.candidates,
        {
          name: "",
          partyId: party.partyId,
          party: party.name,
          partyLogoUrl: party.logoUrl || "",
          profilePictureUrl: "",
          constituencyId: null,
        },
      ],
    }));
  };

  const updateCandidate = (candidate, field, value) => {
    setForm((current) => ({
      ...current,
      candidates: current.candidates.map((item) =>
        item === candidate ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeCandidate = (candidate) => {
    setForm((current) => ({
      ...current,
      candidates: current.candidates.filter((item) => item !== candidate),
    }));
  };

  const uploadCandidatePhoto = async (candidate, file) => {
    if (!file) return;
    try {
      const photo = await imageData(file);
      updateCandidate(candidate, "profilePictureUrl", photo);
      setNotice("Candidate photo added. Save the election to keep it.");
    } catch (err) {
      setError(err.message);
    }
  };

  const updatePartyLogo = async (party, file) => {
    if (!file) return;
    try {
      const logoUrl = await imageData(file);
      const result = await request(`/api/elections/parties/${party.partyId}/logo`, {
        method: "PATCH",
        body: JSON.stringify({ logoUrl }),
      });
      const savedLogo = result.party?.logoUrl || logoUrl;
      setForm((current) => ({
        ...current,
        parties: current.parties.map((item) =>
          String(item.partyId) === String(party.partyId) ? { ...item, logoUrl: savedLogo } : item
        ),
        candidates: current.candidates.map((candidate) =>
          String(candidate.partyId) === String(party.partyId)
            ? { ...candidate, partyLogoUrl: savedLogo }
            : candidate
        ),
      }));
      setSystemParties((current) =>
        current.map((item) => String(item.id) === String(party.partyId) ? { ...item, logoUrl: savedLogo } : item)
      );
      setNotice("Party logo updated and synchronized with its candidate.");
    } catch (err) {
      setError(err.message);
    }
  };

  const saveElection = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (!form.name.trim()) throw new Error("Election name is required.");
      if (!form.electionDate || !form.startTime || !form.endTime) throw new Error("Select the election date and voting times.");
      const startDateTime = `${form.electionDate}T${form.startTime}:00+00:00`;
      const endDateTime = `${form.electionDate}T${form.endTime}:00+00:00`;
      if (new Date(endDateTime) <= new Date(startDateTime)) throw new Error("End time must be after start time.");

      if (form.type === "Presidential") {
        const participantIds = new Set(form.parties.map((party) => String(party.partyId)));
        const presidentialCandidates = form.candidates.filter((candidate) => !candidate.constituencyId);
        if (presidentialCandidates.length !== form.parties.length) {
          throw new Error("Add exactly one presidential candidate using the + Add Candidate button on every participating party.");
        }
        const seen = new Set();
        for (const candidate of presidentialCandidates) {
          const id = String(candidate.partyId || "");
          if (!participantIds.has(id)) throw new Error(`${candidate.name || "Candidate"} must belong to a participating party.`);
          if (seen.has(id)) throw new Error("Each participating party can have only one presidential candidate.");
          seen.add(id);
          if (!String(candidate.name || "").trim()) throw new Error("Every presidential candidate must have a name.");
        }
        if (seen.size !== form.parties.length) throw new Error("Every participating party must have exactly one presidential candidate.");
      }

      const payload = {
        ...form,
        year: Number(form.electionDate.slice(0, 4)),
        startDateTime,
        endDateTime,
        totalPollingStations: Number(form.totalPollingStations || geo.pollingStations || 0),
        parties: form.parties.map((party) => ({
          partyId: party.partyId,
          name: party.name,
          logoUrl: party.logoUrl || "",
        })),
        candidates: form.candidates.map((candidate) => ({
          name: candidate.name,
          partyId: candidate.partyId,
          party: candidate.party,
          partyLogoUrl: candidate.partyLogoUrl || "",
          profilePictureUrl: candidate.profilePictureUrl || "",
          constituencyId: candidate.constituencyId || null,
        })),
      };
      delete payload.electionDate;
      delete payload.startTime;
      delete payload.endTime;

      const result = await request(
        editing ? `/api/elections/${editing._id}` : "/api/elections/create",
        { method: editing ? "PATCH" : "POST", body: JSON.stringify(payload) }
      );

      setNotice(editing ? "Election updated successfully." : "Election created successfully.");
      setEditing(null);
      setForm(emptyForm());
      if (result.election) {
        setElections((current) => editing
          ? current.map((item) => item._id === result.election._id ? result.election : item)
          : [result.election, ...current]
        );
      }
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const editElection = (election) => {
    setEditing(election);
    setForm(formFromElection(election));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteElection = async (election) => {
    if (!window.confirm(`Delete “${election.name}”? This cannot be undone.`)) return;
    try {
      await request(`/api/elections/${election._id}`, { method: "DELETE" });
      setNotice("Election deleted successfully.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <DashboardShell
      role="super_admin"
      navigation={superAdminNavigation}
      activeSection="elections"
      title="Election Management"
      subtitle="Create and control elections using synchronized PoliSync electoral data"
    >
      <main className="page">
        <section className="hero">
          <div>
            <span>POLISYNC AFRICA • ELECTION CONTROL</span>
            <h1>Election Management</h1>
            <p>Political parties are synchronized from the system registry. Each participating party receives its own presidential candidate slot.</p>
          </div>
          <button type="button" className="refresh" onClick={load}>↻ Refresh &amp; Sync</button>
        </section>

        {notice && <div className="notice success">✓ {notice}</div>}
        {error && <div className="notice error">{error}</div>}

        <section className="geo">
          <div><small>GEOGRAPHY REGISTRY</small><strong>{geo.ready ? "Synchronized" : "Preparing"}</strong></div>
          <div><span>Regions</span><b>{Number(geo.regions || 0).toLocaleString()}</b></div>
          <div><span>Constituencies</span><b>{Number(geo.constituencies || 0).toLocaleString()}</b></div>
          <div><span>Polling stations</span><b>{Number(geo.pollingStations || 0).toLocaleString()}</b></div>
        </section>

        <section className="composer">
          <div className="section-title">
            <div>
              <h2>{editing ? "Edit Election" : "Create Election"}</h2>
              <p>Election date and time are saved in Ghana time.</p>
            </div>
            {editing && <button type="button" className="cancel" onClick={() => { setEditing(null); setForm(emptyForm()); }}>Cancel</button>}
          </div>

          <form onSubmit={saveElection} className="form-grid">
            <label className="wide">Election name<input required value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Ghana General Election" /></label>
            <label>Election date<input required type="date" value={form.electionDate} onChange={(e) => setField("electionDate", e.target.value)} /></label>
            <label>Start time<input required type="time" value={form.startTime} onChange={(e) => setField("startTime", e.target.value)} /></label>
            <label>End time<input required type="time" value={form.endTime} onChange={(e) => setField("endTime", e.target.value)} /></label>
            <label>Election type<select value={form.type} onChange={(e) => setField("type", e.target.value)}><option>Presidential</option><option>Parliamentary</option><option>Local</option></select></label>
            <label>Country<input value={form.country} onChange={(e) => setField("country", e.target.value)} /></label>
            <label>Status<select value={form.status} onChange={(e) => setField("status", e.target.value)}><option>Draft</option><option>Active</option><option>Closed</option></select></label>
            <div className="sync-field"><span>Election geography</span><strong>{Number(geo.regions || 0).toLocaleString()} regions · {Number(geo.constituencies || 0).toLocaleString()} constituencies · {Number(geo.pollingStations || 0).toLocaleString()} polling stations</strong><small>Automatically synchronized from the electoral registry.</small></div>
            <div className="submit"><button className="primary" disabled={saving}>{saving ? "Saving…" : editing ? "Save Election Changes" : "Create Election"}</button></div>
          </form>

          <section className="party-section">
            <div className="section-title">
              <div><h3>Participating Political Parties</h3><p>Every participating party, including Independent when selected, uses the exact same candidate workflow.</p></div>
              <select className="party-picker" defaultValue="" onChange={addSystemParty}>
                <option value="">+ Add system political party</option>
                {systemParties.filter((party) => !selectedPartyIds.has(String(party.id))).map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}
              </select>
            </div>

            <div className="party-grid">
              {form.parties.map((party) => {
                const candidate = candidateForParty(form.candidates, party);
                return (
                  <article className="party-card" key={party.partyId}>
                    <div className="party-top">
                      <div className="party-logo">{party.logoUrl ? <img src={party.logoUrl} alt="" /> : "LOGO"}</div>
                      <div className="party-info"><strong>{party.name}</strong><small>Participating election party</small><label className="upload">Upload party logo<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(e) => updatePartyLogo(party, e.target.files?.[0])} /></label></div>
                      <button type="button" className="remove" onClick={() => removeParty(party.partyId)}>Remove</button>
                    </div>
                    <div className="party-candidate">
                      <div className="candidate-heading"><strong>{candidate ? "Presidential Candidate" : "No Candidate Added"}</strong><span>{candidate ? "Affiliation synchronized to this party" : "Add the candidate for this party"}</span></div>
                      {!candidate ? (
                        <button type="button" className="add" onClick={() => addCandidateForParty(party)}>+ Add Candidate</button>
                      ) : (
                        <div className="candidate-inline">
                          <div className="candidate-photo">{candidate.profilePictureUrl ? <img src={candidate.profilePictureUrl} alt="" /> : "PHOTO"}</div>
                          <input value={candidate.name || ""} onChange={(e) => updateCandidate(candidate, "name", e.target.value)} placeholder={`Enter ${party.name} presidential candidate`} />
                          <label className="upload">{candidate.profilePictureUrl ? "Change photo" : "Add photo"}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => uploadCandidatePhoto(candidate, e.target.files?.[0])} /></label>
                          <button type="button" className="remove" onClick={() => removeCandidate(candidate)}>Remove candidate</button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </section>

        <section className="elections">
          <div className="tabs">
            <button type="button" className={view === "all" ? "active" : ""} onClick={() => setView("all")}>All Elections <b>{elections.length}</b></button>
            <button type="button" className={view === "live" ? "active" : ""} onClick={() => setView("live")}>Active <b>{elections.filter((e) => e.status === "Active").length}</b></button>
            <button type="button" className={view === "history" ? "active" : ""} onClick={() => setView("history")}>Closed <b>{elections.filter((e) => e.status === "Closed").length}</b></button>
          </div>
          {loading ? <div className="empty">Loading elections…</div> : visibleElections.length === 0 ? <div className="empty">No elections found.</div> : (
            <div className="election-list">
              {visibleElections.map((election) => (
                <article className="election-card" key={election._id}>
                  <div><span className="status">{election.type} · {election.status}</span><h3>{election.name}</h3><p>{formatDate(election.startDateTime)} · {formatTime(election.startDateTime)}–{formatTime(election.endDateTime)}</p><small>{(election.parties || []).length} participating parties · {(election.candidates || []).length} candidates</small></div>
                  <div className="actions"><button type="button" onClick={() => editElection(election)} disabled={election.status === "Closed"}>Edit</button><button type="button" className="delete" onClick={() => deleteElection(election)} disabled={election.status !== "Draft"}>Delete</button></div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <style jsx>{`
        .page{padding:clamp(14px,3vw,36px);background:#f5f8f6;color:#183d2e;min-height:100%;box-sizing:border-box}.hero,.composer,.geo,.elections,.notice{max-width:1200px;margin-left:auto;margin-right:auto}.hero{display:flex;justify-content:space-between;gap:20px;align-items:flex-end;margin-bottom:14px}.hero span{font-size:10px;font-weight:900;letter-spacing:1.8px;color:#bd941d}.hero h1{margin:7px 0;color:#075d2e;font-size:clamp(30px,5vw,50px)}.hero p{margin:0;color:#708078;max-width:820px;line-height:1.55}.refresh,.primary,.add{border:0;border-radius:10px;background:#075d2e;color:#fff;padding:11px 15px;font-weight:850;cursor:pointer}.geo{display:grid;grid-template-columns:1.3fr repeat(3,1fr);gap:10px;margin-bottom:14px}.geo>div{background:#fff;border:1px solid #dce6e0;border-radius:12px;padding:13px;display:grid;gap:4px}.geo small{font-size:9px;letter-spacing:1px;color:#8a9a91;font-weight:900}.geo strong{color:#08713a}.geo span{font-size:10px;color:#78877f}.geo b{font-size:20px;color:#174e35}.composer,.elections{background:#fff;border:1px solid #dce6e0;border-radius:18px;padding:22px;box-shadow:0 8px 25px rgba(20,60,42,.06)}.section-title{display:flex;justify-content:space-between;align-items:center;gap:16px}.section-title h2,.section-title h3{margin:0;color:#075d2e}.section-title p{margin:4px 0 0;color:#77857e;font-size:12px;line-height:1.5}.cancel,.remove,.party-picker,.actions button{border:1px solid #cedbd3;background:#fff;color:#234c39;border-radius:9px;padding:9px 12px;font-weight:800;cursor:pointer}.remove{color:#9d3434}.form-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px;margin-top:20px}.form-grid label{display:grid;gap:6px;font-size:11px;font-weight:850;color:#385746}.wide{grid-column:1/-1}.form-grid input,.form-grid select,.candidate-inline input{width:100%;box-sizing:border-box;border:1px solid #d6e1db;border-radius:9px;background:#fbfdfc;color:#17392b;padding:11px 12px;font:inherit;font-size:16px}.sync-field{grid-column:1/4;border:1px solid #dbe7df;border-radius:11px;padding:11px 13px;background:#f4f9f6;display:grid;gap:3px}.sync-field span{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#075d2e;font-weight:900}.sync-field strong{font-size:12px;color:#2e5d48}.sync-field small{font-size:10px;color:#789085}.submit{grid-column:4;display:flex;align-items:end;justify-content:flex-end}.party-section{margin-top:24px;padding-top:20px;border-top:1px solid #e5ece8}.party-picker{min-width:230px}.party-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:13px}.party-card{border:1px solid #dbe6df;border-radius:12px;padding:11px;background:#fbfdfc}.party-top{display:flex;align-items:flex-start;gap:12px}.party-logo,.candidate-photo{width:58px;height:58px;flex:0 0 58px;border-radius:10px;background:#eef4f0;display:grid;place-items:center;overflow:hidden;color:#7a8b82;font-size:9px;font-weight:900}.party-logo img,.candidate-photo img{width:100%;height:100%;object-fit:contain}.party-info{min-width:0;display:grid;gap:3px;flex:1}.party-info strong{font-size:14px;overflow-wrap:anywhere}.party-info small{font-size:9px;color:#789085}.upload{position:relative;width:max-content;padding:6px 8px;border:1px solid #cbd9d1;border-radius:7px;background:#fff;color:#17613c;font-size:9px;font-weight:900;cursor:pointer}.upload input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer}.party-candidate{margin-top:12px;padding-top:12px;border-top:1px solid #e5ece8}.candidate-heading{display:flex;justify-content:space-between;gap:10px;margin-bottom:9px}.candidate-heading span{font-size:10px;color:#789085}.candidate-inline{display:grid;grid-template-columns:58px 1fr auto auto;gap:8px;align-items:center}.candidate-photo{position:relative}.tabs{display:flex;gap:7px;margin-bottom:14px;overflow:auto}.tabs button{border:1px solid #d5e0da;background:#fff;color:#52675c;padding:9px 12px;border-radius:9px;font-weight:800;white-space:nowrap;cursor:pointer}.tabs button.active{background:#075d2e;color:#fff;border-color:#075d2e}.tabs b{margin-left:5px}.election-list{display:grid;gap:10px}.election-card{display:flex;justify-content:space-between;gap:20px;align-items:center;border:1px solid #dce6e0;border-radius:14px;padding:15px}.status{font-size:10px;font-weight:900;color:#08713a}.election-card h3{margin:6px 0 3px;color:#174e35}.election-card p,.election-card small{margin:0;color:#748078;font-size:11px}.actions{display:flex;gap:6px}.actions button:disabled{opacity:.45;cursor:not-allowed}.actions .delete{color:#a33b3b}.notice{padding:11px 13px;border-radius:10px;margin-bottom:12px;font-size:12px;font-weight:800}.notice.success{background:#e9f7ee;color:#17623d}.notice.error{background:#fff0f0;color:#9d3434}.empty{padding:28px;text-align:center;color:#718078;border:1px dashed #ccd9d2;border-radius:12px}
        @media(max-width:900px){.geo{grid-template-columns:repeat(2,1fr)}.form-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.wide,.sync-field,.submit{grid-column:1/-1}.submit{justify-content:stretch}.submit .primary{width:100%}.party-grid{grid-template-columns:1fr}.election-card{display:grid}.actions{justify-content:flex-start}}
        @media(max-width:620px){.page{padding:12px}.hero{display:block}.refresh{margin-top:12px;width:100%}.geo{grid-template-columns:1fr 1fr}.geo>div:first-child{grid-column:1/-1}.composer,.elections{padding:14px;border-radius:14px}.section-title{display:block}.party-picker,.cancel{margin-top:10px;width:100%;box-sizing:border-box}.form-grid{grid-template-columns:1fr}.wide,.sync-field,.submit{grid-column:1}.party-card{padding:10px}.party-top{display:grid;grid-template-columns:58px 1fr auto}.candidate-heading{display:grid}.candidate-inline{grid-template-columns:58px 1fr}.candidate-inline .upload,.candidate-inline .remove{grid-column:2}.candidate-inline .remove{width:100%}.tabs{padding-bottom:2px}}
      `}</style>
    </DashboardShell>
  );
}
