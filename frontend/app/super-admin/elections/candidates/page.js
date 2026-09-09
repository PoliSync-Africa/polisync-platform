"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../../../components/dashboard/DashboardShell";
import superAdminNavigation from "../../../../components/dashboard/superAdminNavigation";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://polisync-platform-1.onrender.com").replace(/\/+$/, "");

function token() {
  if (typeof window === "undefined") return "";
  for (const key of ["polisync_token", "authToken", "accessToken", "token", "jwt"]) {
    const value = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (value) return value.replace(/^Bearer\s+/i, "").trim();
  }
  return "";
}

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token()}`,
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Please select a valid image."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read image."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Invalid image."));
      image.onload = () => {
        const max = 900;
        const scale = Math.min(1, max / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
        canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

export default function OfficialPresidentialCandidatesPage() {
  const [elections, setElections] = useState([]);
  const [electionId, setElectionId] = useState("");
  const [election, setElection] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadElections = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await request("/api/elections");
      const list = (data.elections || []).filter((item) => item.type === "Presidential");
      setElections(list);
      if (!electionId && list[0]?._id) setElectionId(String(list[0]._id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadElection = async (id) => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const data = await request(`/api/elections/${id}`);
      const item = data.election || data;
      const participants = item.parties || [];
      const existing = (item.candidates || []).filter((candidate) => candidate.position === "president");

      setElection(item);
      setRows(
        participants.map((party) => {
          const candidate = existing.find(
            (itemCandidate) =>
              String(itemCandidate.partyId || "") === String(party.partyId || "") ||
              String(itemCandidate.party || "").toLowerCase() === String(party.name || "").toLowerCase()
          );
          return {
            partyId: party.partyId || null,
            party: party.name || "",
            partyLogoUrl: party.logoUrl || candidate?.partyLogoUrl || "",
            firstName: candidate?.firstName || "",
            surname: candidate?.surname || "",
            profilePictureUrl: candidate?.profilePictureUrl || "",
            logoDirty: false,
          };
        })
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadElections();
  }, []);

  useEffect(() => {
    if (electionId) loadElection(electionId);
  }, [electionId]);

  const updateRow = (index, values) => {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...values } : row)));
  };

  const closed = election?.status === "Closed";
  const missing = rows.filter((row) => !row.firstName.trim() || !row.surname.trim());

  const save = async () => {
    if (closed) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (!rows.length) throw new Error("This election has no participating participants.");
      if (missing.length) {
        throw new Error(`Every participating party/participant needs a first name and surname. Missing: ${missing.map((row) => row.party).join(", ")}`);
      }

      for (const row of rows.filter((item) => item.logoDirty && item.partyId)) {
        await request(`/api/elections/parties/${row.partyId}/logo`, {
          method: "PATCH",
          body: JSON.stringify({ logoUrl: row.partyLogoUrl }),
        });
      }

      await request(`/api/elections/${electionId}/candidates`, {
        method: "PATCH",
        body: JSON.stringify({
          candidates: rows.map((row) => ({
            partyId: row.partyId,
            party: row.party,
            firstName: row.firstName.trim(),
            surname: row.surname.trim(),
            name: `${row.firstName.trim()} ${row.surname.trim()}`,
            partyLogoUrl: row.partyLogoUrl || "",
            profilePictureUrl: row.profilePictureUrl || "",
          })),
        }),
      });

      setNotice("Official presidential candidates saved successfully.");
      await loadElection(electionId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell
      role="super_admin"
      navigation={superAdminNavigation}
      activeSection="candidates"
      title="Official Presidential Candidates"
      subtitle="Manage every participating party and Independent candidate uniformly"
    >
      <main className="page">
        <header className="hero">
          <div>
            <span>SUPER ADMIN • OFFICIAL ELECTION LIST</span>
            <h1>Presidential Candidates</h1>
            <p>Independent is treated as an election participant on the same basis as every political party. It appears only when included in the election.</p>
          </div>
          <button onClick={loadElections}>↻ Refresh</button>
        </header>

        {notice && <div className="notice success">✓ {notice}</div>}
        {error && <div className="notice error">{error}</div>}

        <section className="toolbar">
          <label>
            Presidential election
            <select value={electionId} onChange={(event) => setElectionId(event.target.value)}>
              <option value="">Select election</option>
              {elections.map((item) => (
                <option key={item._id} value={item._id}>{item.name} • {item.year} • {item.status}</option>
              ))}
            </select>
          </label>
          <div><b>{rows.length}</b> participants</div>
        </section>

        {loading ? (
          <div className="state">Loading…</div>
        ) : !election ? (
          <div className="state">Select a presidential election.</div>
        ) : (
          <>
            <section className="info">
              <b>{election.name}</b>
              <span>{election.year} • {election.status} • {rows.length} participants</span>
            </section>

            <section className="grid">
              {rows.map((row, index) => (
                <article className="candidate" key={`${row.partyId || row.party}-${index}`}>
                  <div className="partyHead">
                    <div className="partyLogo">
                      {row.partyLogoUrl ? <img src={row.partyLogoUrl} alt="" /> : row.party.slice(0, 1)}
                    </div>
                    <div>
                      <span>PARTICIPANT</span>
                      <h2>{row.party}</h2>
                      <small>{row.party.toLowerCase() === "independent" ? "Independent participant" : "Political party participant"}</small>
                    </div>
                  </div>

                  <div className="two">
                    <label>
                      First name
                      <input disabled={closed} value={row.firstName} onChange={(event) => updateRow(index, { firstName: event.target.value })} placeholder="First name" />
                    </label>
                    <label>
                      Surname
                      <input disabled={closed} value={row.surname} onChange={(event) => updateRow(index, { surname: event.target.value })} placeholder="Surname" />
                    </label>
                  </div>

                  <div className="upload">
                    <div className="photo">{row.profilePictureUrl ? <img src={row.profilePictureUrl} alt="" /> : "PHOTO"}</div>
                    <label>
                      Candidate profile photo
                      <input
                        type="file"
                        accept="image/*"
                        disabled={closed}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) resizeImage(file).then((value) => updateRow(index, { profilePictureUrl: value })).catch((err) => setError(err.message));
                        }}
                      />
                    </label>
                  </div>

                  <div className="upload">
                    <div className="mini">{row.partyLogoUrl ? <img src={row.partyLogoUrl} alt="" /> : "LOGO"}</div>
                    <label>
                      Participant logo
                      <input
                        type="file"
                        accept="image/*"
                        disabled={closed}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) resizeImage(file).then((value) => updateRow(index, { partyLogoUrl: value, logoDirty: true })).catch((err) => setError(err.message));
                        }}
                      />
                    </label>
                  </div>
                </article>
              ))}
            </section>

            <footer>
              <span>{closed ? "Closed elections are read-only." : "One candidate is required for each participant included in this election."}</span>
              <button disabled={saving || closed} onClick={save}>{saving ? "Saving…" : "Save Official Candidate List"}</button>
            </footer>
          </>
        )}
      </main>

      <style jsx>{`
        .page{min-height:100%;padding:clamp(14px,2.5vw,32px);background:#f5f8f6;color:#26332b}
        .hero{display:flex;justify-content:space-between;gap:16px;margin-bottom:15px}
        .hero span{color:#c9a227;font-size:9px;font-weight:900;letter-spacing:1.4px}
        .hero h1{margin:6px 0;color:#075f2b;font-size:30px}
        .hero p{max-width:800px;color:#6f7c74;font-size:12px;line-height:1.55}
        .hero button,footer button{border:0;border-radius:9px;background:#075f2b;color:#fff;padding:10px 13px;font-size:10px;font-weight:900}
        .notice{padding:11px 14px;border-radius:10px;margin-bottom:12px;font-size:10px;font-weight:800}
        .success{background:#eaf7ee;color:#08713a}.error{background:#fff1f1;color:#a00000}
        .toolbar,.info,footer{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:14px;border:1px solid #dce6df;border-radius:13px;background:#fff;margin-bottom:12px}
        .toolbar label{display:grid;gap:6px;color:#53635a;font-size:9px;font-weight:900;flex:1}
        .toolbar select{height:42px;border:1px solid #dce6df;border-radius:9px;padding:0 10px;background:#fbfcfb;color:#26332b}
        .toolbar b{font-size:20px;color:#075f2b}.info b{color:#075f2b}.info span{color:#7b8780;font-size:9px}
        .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:11px}
        .candidate{padding:15px;border:1px solid #dce6df;border-radius:14px;background:#fff}
        .partyHead{display:flex;gap:10px;align-items:center;margin-bottom:13px}.partyLogo,.mini{display:grid;place-items:center;overflow:hidden;background:#edf5ef;border-radius:9px}
        .partyLogo{width:48px;height:48px;flex:0 0 48px}.partyLogo img,.mini img,.photo img{width:100%;height:100%;object-fit:contain}
        .partyHead span{color:#c9a227;font-size:7px;font-weight:900}.partyHead h2{margin:2px 0;color:#2f4036;font-size:15px}.partyHead small{color:#8a958e;font-size:8px}
        .two{display:grid;grid-template-columns:1fr 1fr;gap:9px}.candidate label{display:grid;gap:6px;color:#53635a;font-size:9px;font-weight:900}
        .candidate input{min-width:0;height:42px;box-sizing:border-box;padding:0 10px;border:1px solid #dce6df;border-radius:9px;background:#fbfcfb;color:#26332b}
        .upload{display:grid;grid-template-columns:52px 1fr;gap:10px;align-items:center;margin-top:11px}.photo,.mini{width:52px;height:52px;border-radius:9px;background:#edf4ef;display:grid;place-items:center;overflow:hidden;color:#7b8981;font-size:7px;font-weight:900}.photo img{object-fit:cover}
        .state{text-align:center;padding:28px;background:#fff;border:1px solid #dce6df;border-radius:13px;color:#718078}footer{margin-top:12px}footer span{font-size:9px;color:#7a8780}footer button:disabled{opacity:.5}
        @media(max-width:700px){.hero{display:block}.hero button{width:100%}.two{grid-template-columns:1fr}.toolbar,footer{display:block}.toolbar select{width:100%}footer button{width:100%;margin-top:10px}}
      `}</style>
    </DashboardShell>
  );
}
