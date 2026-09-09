"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../../../../components/dashboard/DashboardShell";
import superAdminNavigation from "../../../../components/dashboard/superAdminNavigation";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://polisync-platform-1.onrender.com").replace(/\/+$/, "");

function getToken() {
  if (typeof window === "undefined") return "";
  return ["polisync_token", "authToken", "accessToken", "token", "jwt"].map((key) => localStorage.getItem(key) || sessionStorage.getItem(key)).find(Boolean) || "";
}

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    cache: "no-store",
    ...options,
    headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), Authorization: `Bearer ${getToken()}`, ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) throw new Error(data.message || `Request failed (${response.status}).`);
  return data;
}

function resizeImage(file, maxSide, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read the image."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("The selected file is not a valid image."));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function emptyCandidate(party) {
  return { partyId: party.id || null, party: party.name || "", partyLogoUrl: party.logoUrl || "", name: "", profilePictureUrl: "", logoDirty: false };
}

export default function OfficialPresidentialCandidatesPage() {
  const [elections, setElections] = useState([]);
  const [electionId, setElectionId] = useState("");
  const [election, setElection] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingElection, setLoadingElection] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadElections = async () => {
    setLoading(true); setError("");
    try {
      const data = await request("/api/elections");
      const list = (data.elections || []).filter((item) => item.type === "Presidential");
      setElections(list);
      if (!electionId && list[0]?._id) setElectionId(String(list[0]._id));
    } catch (e) { setError(e.message || "Unable to load presidential elections."); }
    finally { setLoading(false); }
  };

  const loadElection = async (id) => {
    if (!id) return;
    setLoadingElection(true); setError(""); setNotice("");
    try {
      const data = await request(`/api/elections/${id}`);
      const item = data.election || data;
      setElection(item);
      const participants = Array.isArray(item.parties) ? item.parties : [];
      const existing = Array.isArray(item.candidates) ? item.candidates.filter((candidate) => candidate.position === "president") : [];
      const nextRows = participants.map((party) => {
        const match = existing.find((candidate) => String(candidate.partyId || "") === String(party.partyId || "") || (String(candidate.party || "").toLowerCase() === String(party.name || "").toLowerCase()));
        return { partyId: party.partyId || null, party: party.name || "", partyLogoUrl: party.logoUrl || match?.partyLogoUrl || "", name: match?.name || "", profilePictureUrl: match?.profilePictureUrl || "", logoDirty: false };
      });
      setRows(nextRows);
    } catch (e) { setError(e.message || "Unable to load the election candidate list."); }
    finally { setLoadingElection(false); }
  };

  useEffect(() => { loadElections(); }, []);
  useEffect(() => { if (electionId) loadElection(electionId); }, [electionId]);

  const updateRow = (index, patch) => setRows((current) => current.map((row, i) => i === index ? { ...row, ...patch } : row));
  const uploadCandidatePhoto = async (index, file) => { if (!file) return; try { const image = await resizeImage(file, 900, 0.78); updateRow(index, { profilePictureUrl: image }); } catch (e) { setError(e.message); } };
  const uploadPartyLogo = async (index, file) => { if (!file) return; try { const image = await resizeImage(file, 512, 0.82); updateRow(index, { partyLogoUrl: image, logoDirty: true }); } catch (e) { setError(e.message); } };

  const missing = useMemo(() => rows.filter((row) => !row.name.trim()), [rows]);
  const isClosed = election?.status === "Closed";

  const save = async () => {
    if (isClosed) return;
    setSaving(true); setError(""); setNotice("");
    try {
      if (!rows.length) throw new Error("This election has no participating parties. Add the participating parties first.");
      if (missing.length) throw new Error(`Every participating election participant needs a presidential candidate. Missing: ${missing.map((row) => row.party).join(", ")}.`);
      for (const row of rows.filter((item) => item.logoDirty && item.partyId)) {
        await request(`/api/elections/parties/${row.partyId}/logo`, { method: "PATCH", body: JSON.stringify({ logoUrl: row.partyLogoUrl }) });
      }
      await request(`/api/elections/${electionId}/candidates`, {
        method: "PATCH",
        body: JSON.stringify({ candidates: rows.map((row) => ({ partyId: row.partyId, party: row.party, name: row.name.trim(), partyLogoUrl: row.partyLogoUrl || "", profilePictureUrl: row.profilePictureUrl || "" })) }),
      });
      setNotice("Official presidential candidate list saved. Every political party and Independent participant is managed uniformly.");
      await loadElection(electionId);
    } catch (e) { setError(e.message || "Unable to save presidential candidates."); }
    finally { setSaving(false); }
  };

  return (
    <DashboardShell role="super_admin" navigation={superAdminNavigation} activeSection="candidates" title="Official Presidential Candidates" subtitle="Super Admin election control for every participating party and Independent participant">
      <main className="page">
        <header className="hero">
          <div><span>SUPER ADMIN • OFFICIAL ELECTION LIST</span><h1>Presidential Candidates</h1><p>Use this official election manager when parties have not yet registered on PoliSync. Registered parties may still maintain their own party information and candidate profile from their party dashboard.</p></div>
          <button className="refresh" onClick={loadElections} disabled={loading}>↻ Refresh</button>
        </header>
        {notice && <div className="notice success">✓ {notice}</div>}
        {error && <div className="notice error">{error}</div>}
        <section className="toolbar">
          <label>Presidential election<select value={electionId} onChange={(e) => setElectionId(e.target.value)} disabled={loadingElection}>{elections.length === 0 && <option value="">No presidential elections</option>}{elections.map((item) => <option key={item._id} value={item._id}>{item.name} • {item.year} • {item.status}</option>)}</select></label>
          <div className="summary"><b>{rows.length}</b><span>participants</span><b>{rows.length - missing.length}</b><span>candidate profiles</span></div>
        </section>
        {loading || loadingElection ? <div className="state">Loading official election data…</div> : !election ? <div className="state">Select a presidential election to manage its official candidate list.</div> : <>
          <section className="info"><div><b>{election.name}</b><span>{election.year} • {election.status} • {rows.length} participating election participants</span></div>{isClosed && <strong>READ ONLY</strong>}</section>
          <section className="grid">
            {rows.map((row, index) => <article className="candidate" key={`${row.partyId || row.party}-${index}`}>
              <div className="partyHead"><div className="partyLogo">{row.partyLogoUrl ? <img src={row.partyLogoUrl} alt=""/> : <span>{row.party.slice(0,1)}</span>}</div><div><span>PARTICIPANT</span><h2>{row.party}</h2><small>{row.party.toLowerCase() === "independent" ? "Independent participant" : "Political party participant"}</small></div></div>
              <label>Presidential candidate name<input value={row.name} disabled={isClosed} onChange={(e) => updateRow(index, { name: e.target.value })} placeholder={`Enter ${row.party} candidate name`} /></label>
              <div className="uploadLine"><div className="photo">{row.profilePictureUrl ? <img src={row.profilePictureUrl} alt="Candidate"/> : <span>PHOTO</span>}</div><label className="file">Candidate profile photo<input type="file" accept="image/*" disabled={isClosed} onChange={(e) => uploadCandidatePhoto(index, e.target.files?.[0])}/></label></div>
              <div className="uploadLine logoLine"><div className="miniLogo">{row.partyLogoUrl ? <img src={row.partyLogoUrl} alt="Party logo"/> : <span>LOGO</span>}</div><label className="file">Party / participant logo<input type="file" accept="image/*" disabled={isClosed} onChange={(e) => uploadPartyLogo(index, e.target.files?.[0])}/></label></div>
            </article>)}
          </section>
          <footer className="actions"><p>{isClosed ? "Closed elections remain visible for verification and are read-only." : "Saving updates the official election candidate list. This does not prevent a registered party from maintaining its own organization information."}</p><button onClick={save} disabled={saving || isClosed || !rows.length}>{saving ? "Saving…" : "Save Official Candidate List"}</button></footer>
        </>}
      </main>
      <style jsx>{styles}</style>
    </DashboardShell>
  );
}

const styles = `
.page{min-height:100%;box-sizing:border-box;padding:clamp(14px,2.5vw,32px);background:#f5f8f6;color:#26332b}.hero{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:15px}.hero span{color:#c9a227;font-size:9px;font-weight:900;letter-spacing:1.4px}.hero h1{margin:6px 0;color:#075f2b;font-size:30px}.hero p{margin:0;max-width:900px;color:#6f7c74;font-size:12px;line-height:1.55}.refresh{border:0;border-radius:9px;background:#075f2b;color:#fff;padding:10px 13px;font-size:10px;font-weight:900}.notice{padding:11px 14px;border-radius:10px;margin-bottom:12px;font-size:10px;font-weight:800}.success{background:#eaf7ee;color:#08713a}.error{background:#fff1f1;color:#a00000}.toolbar{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:end;padding:14px;border:1px solid #dce6df;border-radius:13px;background:#fff;margin-bottom:12px}.toolbar label{display:flex;flex-direction:column;gap:6px;color:#53635a;font-size:9px;font-weight:900}.toolbar select{height:42px;border:1px solid #dce6df;border-radius:9px;padding:0 10px;background:#fbfcfb;color:#26332b;font-size:11px}.summary{display:flex;align-items:center;gap:6px;white-space:nowrap}.summary b{font-size:20px;color:#075f2b;margin-left:8px}.summary span{font-size:8px;color:#7c8981}.info{display:flex;justify-content:space-between;align-items:center;padding:13px 15px;border:1px solid #dce6df;border-radius:12px;background:#fff;margin-bottom:12px}.info b{display:block;color:#075f2b;font-size:14px}.info span{display:block;margin-top:3px;color:#7b8780;font-size:9px}.info strong{padding:6px 8px;border-radius:999px;background:#fff3d9;color:#98750d;font-size:8px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:11px}.candidate{padding:15px;border:1px solid #dce6df;border-radius:14px;background:#fff}.partyHead{display:flex;gap:10px;align-items:center;margin-bottom:13px}.partyLogo,.miniLogo{display:grid;place-items:center;overflow:hidden;background:#edf5ef;border-radius:9px}.partyLogo{width:48px;height:48px;flex:0 0 48px}.partyLogo img,.miniLogo img{width:100%;height:100%;object-fit:contain}.partyLogo span,.miniLogo span{color:#075f2b;font-weight:900}.partyHead span{color:#c9a227;font-size:7px;font-weight:900;letter-spacing:1px}.partyHead h2{margin:2px 0;color:#2f4036;font-size:15px}.partyHead small{color:#8a958e;font-size:8px}.candidate>label{display:flex;flex-direction:column;gap:6px;color:#53635a;font-size:9px;font-weight:900}.candidate>label input{height:42px;box-sizing:border-box;padding:0 10px;border:1px solid #dce6df;border-radius:9px;background:#fbfcfb;color:#26332b;font-size:11px}.uploadLine{display:grid;grid-template-columns:52px 1fr;gap:10px;align-items:center;margin-top:11px}.photo{width:52px;height:52px;border-radius:9px;overflow:hidden;background:#edf4ef;display:grid;place-items:center;color:#7b8981;font-size:7px;font-weight:900}.photo img{width:100%;height:100%;object-fit:cover}.miniLogo{width:52px;height:52px}.file{display:flex;flex-direction:column;gap:5px;color:#53635a;font-size:9px;font-weight:900}.file input{font-size:9px}.actions{display:flex;justify-content:space-between;gap:15px;align-items:center;padding:15px;margin-top:12px;border:1px solid #dce6df;border-radius:13px;background:#fff}.actions p{margin:0;color:#7a8780;font-size:9px;line-height:1.5}.actions button{border:0;border-radius:9px;background:#075f2b;color:#fff;padding:11px 14px;font-size:10px;font-weight:900;white-space:nowrap}.actions button:disabled{opacity:.5}.state{padding:28px;text-align:center;border:1px solid #dce6df;border-radius:13px;background:#fff;color:#718078;font-size:10px}@media(max-width:800px){.hero{display:block}.refresh{margin-top:10px}.toolbar{grid-template-columns:1fr}.summary{justify-content:flex-start}.actions{display:block}.actions button{width:100%;margin-top:10px}}
`;
