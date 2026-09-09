"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const TYPES = [
  ["political_party", "Political Party", "Party organization and national command structure."],
  ["observer_organization", "Observer Organization", "Independent election observation organization."],
  ["presidential_candidate", "Presidential Candidate", "Register your presidential candidacy and select your party."],
  ["parliamentary_candidate", "Parliamentary Candidate", "Register your candidacy, party, region and constituency."],
  ["research", "Research Organization", "Research institution or individual research workspace."],
];

const API = (process.env.NEXT_PUBLIC_API_URL || "https://polisync-platform-1.onrender.com").replace(/\/+$/, "");

function getToken() {
  if (typeof window === "undefined") return "";
  for (const key of ["polisync_token", "authToken", "accessToken", "token", "jwt"]) {
    const value = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (value) return value.replace(/^Bearer\s+/i, "").trim();
  }
  return "";
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
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Candidate photo could not be processed."));
    img.src = source;
  });
  const max = 1200;
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const scale = Math.min(1, max / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to prepare candidate photo.");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  let quality = 0.84;
  let result = canvas.toDataURL("image/jpeg", quality);
  while (result.length > 850 * 1024 * 1.37 && quality > 0.48) {
    quality -= 0.06;
    result = canvas.toDataURL("image/jpeg", quality);
  }
  return result;
}

export default function OrganizationRegistrationPage() {
  const [type, setType] = useState("");
  const [name, setName] = useState("");
  const [party, setParty] = useState("");
  const [parties, setParties] = useState([]);
  const [elections, setElections] = useState([]);
  const [electionId, setElectionId] = useState("");
  const [regions, setRegions] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [region, setRegion] = useState("");
  const [constituency, setConstituency] = useState("");
  const [researchType, setResearchType] = useState("research_institution");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const candidate = type === "presidential_candidate" || type === "parliamentary_candidate";
  const parliamentary = type === "parliamentary_candidate";
  const presidential = type === "presidential_candidate";

  const selectedParty = useMemo(
    () => parties.find((item) => String(item.name).trim().toLowerCase() === String(party).trim().toLowerCase()),
    [parties, party]
  );

  const availableElections = useMemo(
    () => elections.filter((item) => item.status === "Active" && String(item.type || "").toLowerCase() === (presidential ? "presidential" : parliamentary ? "parliamentary" : "")),
    [elections, presidential, parliamentary]
  );

  const selectedElection = availableElections.find((item) => String(item._id || item.id) === String(electionId));

  useEffect(() => {
    if (!candidate) return;
    let dead = false;

    (async () => {
      setLoadingData(true);
      setError("");
      try {
        const token = getToken();
        const headers = { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
        const [optionsResponse, regionsResponse] = await Promise.all([
          fetch(`${API}/api/organizations/candidate-registration/options`, { cache: "no-store", headers }),
          fetch(`${API}/api/electoral-geography/regions`, { cache: "no-store" }),
        ]);
        const options = await optionsResponse.json().catch(() => ({}));
        const regionsData = await regionsResponse.json().catch(() => ({}));
        if (!optionsResponse.ok || options.success !== true) throw new Error(options.message || "Unable to load political parties and active elections.");
        if (!regionsResponse.ok || regionsData.success !== true) throw new Error(regionsData.message || "Unable to load electoral regions.");
        if (!dead) {
          setParties(Array.isArray(options.parties) ? options.parties : []);
          setElections(Array.isArray(options.elections) ? options.elections : []);
          setRegions(Array.isArray(regionsData.data) ? regionsData.data : []);
        }
      } catch (loadError) {
        if (!dead) setError(loadError.message || "Unable to load candidate registration data.");
      } finally {
        if (!dead) setLoadingData(false);
      }
    })();

    return () => { dead = true; };
  }, [candidate]);

  useEffect(() => {
    if (!parliamentary || !region) {
      setConstituencies([]);
      setConstituency("");
      return;
    }
    let dead = false;
    (async () => {
      try {
        const response = await fetch(`${API}/api/electoral-geography/regions/${encodeURIComponent(region)}/constituencies`, { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success !== true) throw new Error(data.message || "Unable to load constituencies.");
        if (!dead) setConstituencies(Array.isArray(data.data) ? data.data : []);
      } catch (loadError) {
        if (!dead) setError(loadError.message || "Unable to load constituencies.");
      }
    })();
    return () => { dead = true; };
  }, [parliamentary, region]);

  const chooseType = (value) => {
    setType(value);
    setError("");
    setSuccess("");
    setParty("");
    setElectionId("");
    setRegion("");
    setConstituency("");
    setConstituencies([]);
    setName("");
    setProfilePhoto("");
  };

  const choosePhoto = async (file) => {
    if (!file) return;
    setError("");
    try {
      setProfilePhoto(await compressPhoto(file));
    } catch (photoError) {
      setError(photoError.message || "Unable to prepare candidate photo.");
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    const token = getToken();
    if (!token) return setError("Please sign in to your personal PoliSync account first.");
    if (!type || !name.trim()) return setError("Account type and name are required.");
    if (candidate && !electionId) return setError("Select the election you are registering for.");
    if (candidate && !party) return setError("Select a political party from the synchronized PoliSync system registry.");
    if (candidate && !profilePhoto) return setError("Upload a profile photo for the candidate.");
    if (parliamentary && (!region || !constituency)) return setError("Parliamentary candidates must select a region and constituency.");

    setBusy(true);
    try {
      const response = await fetch(`${API}/api/organizations`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          organizationType: type,
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          description: description.trim(),
          ...(type === "political_party" ? { name: party } : {}),
          ...(type === "research" ? { researchType } : {}),
          ...(candidate ? {
            candidateParty: party,
            candidateIsIndependent: party.toLowerCase() === "independent",
            electionId,
            profilePhoto,
            region: parliamentary ? (regions.find((item) => String(item._id) === String(region))?.name || region) : null,
            constituency: parliamentary ? (constituencies.find((item) => String(item._id) === String(constituency))?.name || constituency) : null,
          } : {}),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || "Registration failed.");
      setSuccess(data.message || "Registration submitted. Your photo and candidate details are awaiting approval.");
      setName("");
      setProfilePhoto("");
    } catch (submitError) {
      setError(submitError.message || "Registration failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main style={page}>
      <section style={card}>
        <div style={eyebrow}>POLISYNC AFRICA • REGISTRATION</div>
        <h1 style={title}>Create an Organizational Account</h1>
        <p style={subtitle}>Candidate registration uses active elections, the synchronized PoliSync party registry and official electoral geography.</p>
        <div style={notice}>✓ Active elections load automatically. ✓ Party names and logos come directly from the approved system registry. ✓ Candidate photos are uploaded and stored with the registration.</div>

        <div style={typeGrid}>
          {TYPES.map(([value, labelText, text]) => (
            <button key={value} type="button" onClick={() => chooseType(value)} style={{ ...typeButton, ...(type === value ? selectedType : {}) }}>
              <strong>{labelText}</strong><span>{text}</span>
            </button>
          ))}
        </div>

        {type && (
          <form onSubmit={submit} style={form}>
            {candidate && (
              <section style={candidatePanel}>
                <div style={sectionLabel}>{parliamentary ? "PARLIAMENTARY CANDIDATE" : "PRESIDENTIAL CANDIDATE"}</div>
                <h2 style={sectionTitle}>{parliamentary ? "Election, party and electoral area" : "Election and political party"}</h2>

                {loadingData ? <div style={loadingBox}>Synchronizing active elections, political parties and logos…</div> : (
                  <>
                    <label style={label}>
                      Associated Election
                      <select value={electionId} onChange={(event) => setElectionId(event.target.value)} style={input} required>
                        <option value="">Select {presidential ? "Presidential" : "Parliamentary"} Election</option>
                        {availableElections.map((item) => <option key={item._id || item.id} value={item._id || item.id}>{item.name}{item.year ? ` • ${item.year}` : ""}</option>)}
                      </select>
                    </label>

                    {!availableElections.length && <div style={emptyBox}>No active {presidential ? "Presidential" : "Parliamentary"} election is currently available. The Super Admin must activate an election before candidates can register.</div>}

                    {selectedElection && <div style={electionSummary}><strong>{selectedElection.name}</strong><span>{selectedElection.type} • {selectedElection.year} • Active</span></div>}

                    <p style={sectionText}>Political parties and their current official logos are synchronized from the PoliSync system registry.</p>
                    <div style={partyGrid}>
                      {parties.map((item) => {
                        const electionParty = (selectedElection?.parties || []).find((entry) => String(entry.partyId || "") === String(item.id || item._id || "") || String(entry.name || "").trim().toLowerCase() === String(item.name || "").trim().toLowerCase());
                        const participating = !selectedElection || !(selectedElection.parties || []).length || Boolean(electionParty);
                        return (
                          <button key={item.id || item._id || item.name} type="button" disabled={Boolean(selectedElection) && !participating} onClick={() => setParty(item.name)} style={{ ...partyCard, ...(party === item.name ? selectedPartyCard : {}), ...(selectedElection && !participating ? disabledPartyCard : {}) }}>
                            <span style={partyLogo}>{item.logoUrl ? <img src={item.logoUrl} alt={`${item.name} logo`} /> : <b>{String(item.name).slice(0, 1)}</b>}</span>
                            <span style={partyName}>{item.name}</span>
                            {party === item.name && <span style={check}>✓</span>}
                          </button>
                        );
                      })}
                    </div>

                    {selectedElection && selectedElection.parties?.length > 0 && <div style={syncNote}>✓ Showing only parties participating in the selected election. Logos are synchronized from the canonical party registry.</div>}

                    {parliamentary && (
                      <div style={twoCol}>
                        <label style={label}>Region<select value={region} onChange={(event) => setRegion(event.target.value)} style={input} required><option value="">Select Region</option>{regions.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>
                        <label style={label}>Constituency<select value={constituency} onChange={(event) => setConstituency(event.target.value)} style={input} required disabled={!region}><option value="">{region ? "Select Constituency" : "Select a region first"}</option>{constituencies.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>
                      </div>
                    )}

                    {selectedParty && <div style={selectedSummary}><span style={summaryLogo}>{selectedParty.logoUrl ? <img src={selectedParty.logoUrl} alt={`${selectedParty.name} logo`} /> : <b>{selectedParty.name.slice(0, 1)}</b>}</span><div><strong>{selectedParty.name}</strong><small>{presidential ? "Presidential candidate party" : "Parliamentary candidate party"}</small></div></div>}

                    <div style={photoPanel}>
                      <div style={photoPreview}>{profilePhoto ? <img src={profilePhoto} alt="Candidate preview" /> : <span>PHOTO</span>}</div>
                      <div><strong>Candidate profile photo</strong><p>Upload a clear face photo. JPG, PNG or WebP. PoliSync compresses it automatically before submission.</p><label style={photoButton}>{profilePhoto ? "Change photo" : "Upload candidate photo"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => choosePhoto(event.target.files?.[0])} /></label></div>
                    </div>
                  </>
                )}
              </section>
            )}

            {type === "political_party" && <select value={party} onChange={(event) => { setParty(event.target.value); setName(event.target.value); }} style={input} required><option value="">Select Political Party</option>{parties.map((item) => <option key={item.id || item._id} value={item.name}>{item.name}</option>)}</select>}
            {type !== "political_party" && type !== "research" && <input value={name} onChange={(event) => setName(event.target.value)} placeholder={candidate ? "Candidate full name" : "Organization name"} style={input} required />}
            {type === "research" && <><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Research organization name" style={input} required /><select value={researchType} onChange={(event) => setResearchType(event.target.value)} style={input}><option value="research_institution">Research Institution</option><option value="individual_researcher">Individual Researcher</option></select></>}
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email (optional)" style={input} />
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone (+233...) (optional)" style={input} />
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder={candidate ? "Candidate biography / campaign description (optional)" : "Description (optional)"} rows={4} style={{ ...input, resize: "vertical" }} />
            {error && <div style={errorBox}>{error}</div>}
            {success && <div style={successBox}>{success}</div>}
            <button type="submit" disabled={busy || loadingData || (candidate && !availableElections.length)} style={primary}>{busy ? "Submitting Registration…" : candidate ? "Submit Candidate Registration" : "Submit Organization Request"}</button>
          </form>
        )}

        <p style={footer}>Already have an account? <Link href="/login" style={link}>Sign in</Link></p>
      </section>
      <style jsx>{styles}</style>
    </main>
  );
}

const page={minHeight:"100vh",padding:"28px 16px",background:"linear-gradient(135deg,#f8faf8,#eef7f0)",display:"flex",justifyContent:"center",alignItems:"center",fontFamily:"Arial,sans-serif",boxSizing:"border-box"};
const card={width:"100%",maxWidth:900,background:"#fff",borderRadius:24,padding:28,boxShadow:"0 20px 60px rgba(0,0,0,.08)",border:"1px solid #dce6df",boxSizing:"border-box"};
const eyebrow={color:"#c9a227",fontSize:10,fontWeight:900,letterSpacing:1.3,textAlign:"center"};
const title={textAlign:"center",color:"#075f2b",fontSize:28,margin:"8px 0"};
const subtitle={textAlign:"center",color:"#6e7871",fontSize:13,lineHeight:1.6,margin:"0 auto 16px",maxWidth:720};
const notice={padding:12,borderRadius:12,background:"#ecfdf3",border:"1px solid #b7dfc5",color:"#08733a",fontSize:12,lineHeight:1.5,marginBottom:16};
const typeGrid={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:10};
const typeButton={textAlign:"left",padding:15,borderRadius:13,border:"1px solid #dce6df",background:"#fff",cursor:"pointer",color:"#25332b"};
const selectedType={border:"2px solid #075f2b",background:"#f1f9f3"};
const form={display:"grid",gap:11,marginTop:16};
const input={width:"100%",boxSizing:"border-box",padding:"13px 14px",border:"1px solid #d5e0d8",borderRadius:10,background:"#fbfdfb",fontSize:14,fontFamily:"inherit"};
const primary={width:"100%",padding:14,border:0,borderRadius:11,background:"#075f2b",color:"#fff",fontWeight:800,fontSize:15,cursor:"pointer"};
const errorBox={padding:12,borderRadius:10,background:"#fff2f2",border:"1px solid #efcaca",color:"#a00000",fontSize:12};
const successBox={padding:12,borderRadius:10,background:"#ecfdf3",border:"1px solid #b7dfc5",color:"#08733a",fontSize:12,lineHeight:1.5};
const emptyBox={padding:12,borderRadius:10,background:"#fffaf0",border:"1px solid #ead59a",color:"#806718",fontSize:11,lineHeight:1.5};
const syncNote={marginTop:9,padding:9,borderRadius:9,background:"#f1f9f3",color:"#08733a",fontSize:10,lineHeight:1.4};
const footer={textAlign:"center",color:"#6e7871",fontSize:12,marginTop:20};
const link={color:"#075f2b",fontWeight:800};
const candidatePanel={padding:18,borderRadius:16,background:"#f8fbf9",border:"1px solid #dce9e0"};
const sectionLabel={color:"#c9a227",fontSize:9,fontWeight:900,letterSpacing:1.2};
const sectionTitle={margin:"5px 0",color:"#075f2b",fontSize:20};
const sectionText={margin:"10px 0",color:"#718078",fontSize:11,lineHeight:1.5};
const partyGrid={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:8,marginTop:12};
const partyCard={position:"relative",display:"flex",alignItems:"center",gap:9,padding:10,borderRadius:11,border:"1px solid #dce6df",background:"#fff",cursor:"pointer",textAlign:"left"};
const selectedPartyCard={border:"2px solid #075f2b",background:"#eef9f1"};
const disabledPartyCard={opacity:.42,cursor:"not-allowed"};
const partyLogo={width:38,height:38,borderRadius:8,display:"grid",placeItems:"center",overflow:"hidden",background:"#edf5ef",color:"#075f2b",fontWeight:900,flex:"0 0 38px"};
const partyName={fontSize:11,fontWeight:800,color:"#2f4036"};
const check={marginLeft:"auto",color:"#08713a",fontWeight:900};
const loadingBox={padding:14,borderRadius:10,background:"#fff",color:"#718078",fontSize:11};
const twoCol={display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:12};
const label={display:"block",color:"#3d4b43",fontSize:11,fontWeight:800};
const selectedSummary={display:"flex",alignItems:"center",gap:10,marginTop:12,padding:10,borderRadius:10,background:"#fff",border:"1px solid #dce6df"};
const electionSummary={display:"flex",flexDirection:"column",gap:3,marginTop:10,padding:10,borderRadius:10,background:"#fff",border:"1px solid #dce6df",color:"#075f2b",fontSize:12};
const summaryLogo={width:42,height:42,borderRadius:8,display:"grid",placeItems:"center",overflow:"hidden",background:"#edf5ef",color:"#075f2b",fontWeight:900};
const photoPanel={display:"grid",gridTemplateColumns:"92px 1fr",gap:13,alignItems:"center",marginTop:13,padding:12,borderRadius:12,border:"1px dashed #b9cfc0",background:"#fff"};
const photoPreview={width:90,height:108,borderRadius:9,overflow:"hidden",background:"#edf4ef",display:"grid",placeItems:"center",color:"#7d8b83",fontSize:9,fontWeight:900};
const photoButton={position:"relative",display:"inline-block",padding:"10px 13px",borderRadius:9,background:"#075f2b",color:"#fff",fontSize:10,fontWeight:800,cursor:"pointer",overflow:"hidden"};
const styles=`@media(max-width:700px){.twoCol{grid-template-columns:1fr}.photoPanel{grid-template-columns:80px 1fr}.photoPreview{width:78px;height:96px}}.partyLogo img,.summaryLogo img,.photoPreview img{width:100%;height:100%;object-fit:contain;padding:3px;box-sizing:border-box}.photoPanel p{margin:4px 0 9px;color:#718078;font-size:10px;line-height:1.45}.photoButton input{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer}.partyCard:not(:disabled):hover{transform:translateY(-1px)}label select{margin-top:6px}.selectedSummary small{display:block;color:#718078;margin-top:3px}`;
