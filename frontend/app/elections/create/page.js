"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import ElectionAccessGate from "../../../components/dashboard/ElectionAccessGate";

const API_BASE = String(process.env.NEXT_PUBLIC_API_URL || "https://polisync-platform-1.onrender.com").replace(/\/+$/, "");
const ELECTION_TYPE_STORAGE_KEY = "polisync_election_type_preference";
const ELECTION_TYPES = ["Presidential", "Parliamentary", "Local"];
const PERMANENT_PARTIES = ["NPP", "NDC", "CPP", "LPG", "GUM", "PNC", "PPP", "The Base Party", "UP (Movement for Change)", "The New Force"];

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || localStorage.getItem("authToken") || sessionStorage.getItem("authToken") || localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || localStorage.getItem("token") || sessionStorage.getItem("token") || "";
}

function getSavedElectionType() {
  if (typeof window === "undefined") return "Presidential";
  const saved = localStorage.getItem(ELECTION_TYPE_STORAGE_KEY);
  return ELECTION_TYPES.includes(saved) ? saved : "Presidential";
}

function mergeParties(loaded) {
  const map = new Map();
  (Array.isArray(loaded) ? loaded : []).forEach((party) => {
    const name = String(party?.name || "").trim();
    if (name) map.set(name.toLowerCase(), { ...party, name });
  });
  PERMANENT_PARTIES.forEach((name) => {
    const key = name.toLowerCase();
    if (!map.has(key)) map.set(key, { id: `system-${key.replace(/[^a-z0-9]+/g, "-")}`, name, logoUrl: "", registeredInSystem: true, systemParty: true });
  });
  return Array.from(map.values());
}

export default function CreateElectionPage() {
  const [form, setForm] = useState(() => ({ name: "", country: "Ghana", type: getSavedElectionType(), date: "", status: "Draft" }));
  const [parties, setParties] = useState([]);
  const [selectedPartyIds, setSelectedPartyIds] = useState([]);
  const [loadingParties, setLoadingParties] = useState(true);
  const [partyError, setPartyError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const saved = getSavedElectionType();
    setForm((current) => ({ ...current, type: saved }));
  }, []);

  useEffect(() => {
    let active = true;
    const loadParties = async () => {
      setLoadingParties(true);
      setPartyError("");
      try {
        const token = getToken();
        const response = await fetch(`${API_BASE}/api/elections/parties`, {
          cache: "no-store",
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success !== true) throw new Error(data.message || `Unable to load political parties (${response.status}).`);
        const loaded = mergeParties(data.parties);
        if (!active) return;
        setParties(loaded);
        setSelectedPartyIds(loaded.map((party) => String(party.id)));
      } catch (e) {
        if (!active) return;
        const fallback = mergeParties([]);
        setParties(fallback);
        setSelectedPartyIds(fallback.map((party) => String(party.id)));
        setPartyError(`Live party registry could not be reached. The system's permanent political parties have been loaded instead. ${e.message || ""}`.trim());
      } finally {
        if (active) setLoadingParties(false);
      }
    };
    loadParties();
    return () => { active = false; };
  }, []);

  const selectedParties = useMemo(() => parties.filter((party) => selectedPartyIds.includes(String(party.id))), [parties, selectedPartyIds]);
  const update = (field, value) => {
    if (field === "type") {
      const nextType = ELECTION_TYPES.includes(value) ? value : "Presidential";
      setForm((current) => ({ ...current, type: nextType }));
      if (typeof window !== "undefined") localStorage.setItem(ELECTION_TYPE_STORAGE_KEY, nextType);
      return;
    }
    setForm((current) => ({ ...current, [field]: value }));
  };
  const toggleParty = (id) => {
    const key = String(id);
    setSelectedPartyIds((current) => current.includes(key) ? current.filter((value) => value !== key) : [...current, key]);
  };
  const selectAll = () => setSelectedPartyIds(parties.map((party) => String(party.id)));
  const clearAll = () => setSelectedPartyIds([]);

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setSuccess("");
    const electionType = ELECTION_TYPES.includes(form.type) ? form.type : "Presidential";
    if (electionType !== form.type) {
      setForm((current) => ({ ...current, type: electionType }));
      if (typeof window !== "undefined") localStorage.setItem(ELECTION_TYPE_STORAGE_KEY, electionType);
    }
    if (!form.name.trim()) return setError("Election name is required.");
    if (!form.date) return setError("Election date is required.");
    if (!selectedParties.length) return setError("At least one political party must participate in the election.");
    const year = Number(form.date.slice(0, 4));
    const startDateTime = `${form.date}T00:00:00`;
    const endDateTime = `${form.date}T23:59:59`;
    setSubmitting(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/elections/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name.trim(), country: form.country.trim() || "Ghana", type: electionType, electionType, year, startDateTime, endDateTime, status: form.status,
          parties: selectedParties.map((party) => ({ partyId: party.systemParty ? null : party.id, name: party.name, logoUrl: party.logoUrl || "" })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success !== true) throw new Error(data.message || "Election could not be created.");
      const savedType = String(data.election?.type || "").trim();
      if (savedType !== electionType) throw new Error(`Election was not saved with the selected type. Selected: ${electionType}; saved: ${savedType || "unknown"}.`);
      if (typeof window !== "undefined") localStorage.setItem(ELECTION_TYPE_STORAGE_KEY, electionType);
      setSuccess(`Election created successfully as a ${electionType} election with ${selectedParties.length} participating political ${selectedParties.length === 1 ? "party" : "parties"}.`);
      setForm({ name: "", country: "Ghana", type: electionType, date: "", status: "Draft" });
    } catch (e) {
      setError(e.message || "Election could not be created.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ElectionAccessGate>
      <DashboardShell role="user" activeSection="elections" title="Create Election" subtitle="Registered political parties and official electoral geography">
        <main style={styles.page}>
          <form onSubmit={submit} style={styles.card}>
            <div style={styles.eyebrow}>POLISYNC AFRICA • ELECTION SETUP</div>
            <h2 style={styles.heading}>Create New Election</h2>
            <p style={styles.subheading}>Political parties load automatically from the PoliSync party registry. The election type is saved as your preference and is sent explicitly with every election creation request.</p>
            {error && <div style={styles.error}>{error}</div>}
            {success && <div style={styles.success}>{success}</div>}
            {partyError && <div style={styles.notice}>{partyError}</div>}

            <div style={styles.grid}>
              <label style={styles.field}><span>Election Name</span><input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Ghana 2028 General Election" style={styles.input} /></label>
              <label style={styles.field}><span>Country</span><input value={form.country} onChange={(e) => update("country", e.target.value)} style={styles.input} /></label>
              <label style={styles.field}><span>Election Type</span><select value={form.type} onChange={(e) => update("type", e.target.value)} style={styles.input}><option value="Presidential">Presidential</option><option value="Parliamentary">Parliamentary</option><option value="Local">Local</option></select></label>
              <label style={styles.field}><span>Election Date</span><input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} style={styles.input} /></label>
              <label style={styles.field}><span>Status</span><select value={form.status} onChange={(e) => update("status", e.target.value)} style={styles.input}><option value="Draft">Draft</option><option value="Active">Active</option><option value="Closed">Closed</option></select></label>
            </div>

            <section style={styles.partySection}>
              <div style={styles.partyHeader}>
                <div><div style={styles.partyLabel}>PARTICIPATING POLITICAL PARTIES</div><h3 style={styles.partyTitle}>{loadingParties ? "Loading registered parties…" : `${selectedParties.length} of ${parties.length} selected`}</h3></div>
                <div style={styles.actions}><button type="button" onClick={selectAll} disabled={loadingParties || !parties.length} style={styles.linkButton}>Select all</button><button type="button" onClick={clearAll} disabled={loadingParties || !parties.length} style={styles.linkButton}>Clear</button></div>
              </div>
              {loadingParties ? <div style={styles.loading}>Loading approved political parties automatically…</div> : <div style={styles.partyList}>{parties.map((party) => { const checked = selectedPartyIds.includes(String(party.id)); return <label key={party.id} style={{ ...styles.party, ...(checked ? styles.partySelected : {}) }}><input type="checkbox" checked={checked} onChange={() => toggleParty(party.id)} />{party.logoUrl ? <img src={party.logoUrl} alt="" style={styles.logo} /> : <span style={styles.logoPlaceholder}>{party.name?.slice(0, 1) || "P"}</span>}<span style={styles.partyName}>{party.name}</span><span style={styles.registered}>{party.systemParty ? "SYSTEM PARTY" : "REGISTERED"}</span></label>; })}</div>}
            </section>

            <div style={styles.footer}><span style={styles.note}>Your selected election type is remembered for the next election you create. The saved server response is also checked before the UI reports success.</span><button type="submit" disabled={submitting || loadingParties || !selectedParties.length} style={styles.submit}>{submitting ? "Creating…" : "Create Election"}</button></div>
          </form>
        </main>
      </DashboardShell>
    </ElectionAccessGate>
  );
}

const styles = {
  page: { minHeight: "100%", padding: "clamp(12px,2.5vw,30px)", background: "#f4f7f5", boxSizing: "border-box" },
  card: { maxWidth: 980, margin: "0 auto", background: "#fff", border: "1px solid #dce6df", borderRadius: 20, padding: "clamp(18px,3vw,32px)", boxShadow: "0 12px 35px rgba(14,54,32,.06)" },
  eyebrow: { color: "#b28b19", fontSize: 9, fontWeight: 900, letterSpacing: 1.5 },
  heading: { margin: "7px 0 5px", color: "#075f2b", fontSize: "clamp(24px,4vw,32px)" },
  subheading: { margin: "0 0 22px", color: "#6f7c74", fontSize: 12, lineHeight: 1.6 },
  grid: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 14 },
  field: { display: "flex", flexDirection: "column", gap: 6, color: "#53635a", fontSize: 10, fontWeight: 800 },
  input: { width: "100%", boxSizing: "border-box", padding: "12px 13px", border: "1px solid #d6e0da", borderRadius: 10, background: "#fbfcfb", color: "#26372e", fontSize: 12, outline: "none" },
  partySection: { marginTop: 22, padding: 17, border: "1px solid #e0e8e3", borderRadius: 15, background: "#fbfdfc" },
  partyHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  partyLabel: { color: "#b28b19", fontSize: 9, fontWeight: 900, letterSpacing: 1.2 },
  partyTitle: { margin: "5px 0 0", color: "#263a30", fontSize: 16 },
  actions: { display: "flex", gap: 8 },
  linkButton: { border: 0, background: "transparent", color: "#075f2b", fontSize: 10, fontWeight: 900, cursor: "pointer" },
  partyList: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 9, marginTop: 14 },
  party: { display: "flex", alignItems: "center", gap: 9, minHeight: 58, padding: "9px 10px", border: "1px solid #e0e8e3", borderRadius: 11, background: "#fff", cursor: "pointer", boxSizing: "border-box" },
  partySelected: { borderColor: "#9bc5aa", background: "#f3faf5" },
  logo: { width: 30, height: 30, objectFit: "contain", borderRadius: 7, background: "#f2f5f3" },
  logoPlaceholder: { width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: 7, background: "#e8f3eb", color: "#075f2b", fontWeight: 900, fontSize: 12 },
  partyName: { flex: 1, color: "#2d4036", fontSize: 11, fontWeight: 800 },
  registered: { color: "#08713a", fontSize: 7, fontWeight: 900, letterSpacing: .8 },
  loading: { marginTop: 12, padding: 16, borderRadius: 10, background: "#f1f6f3", color: "#64736a", fontSize: 11 },
  error: { marginBottom: 14, padding: "11px 13px", borderRadius: 10, border: "1px solid #efc9c4", background: "#fff3f1", color: "#87362e", fontSize: 11 },
  success: { marginBottom: 14, padding: "11px 13px", borderRadius: 10, border: "1px solid #c7e4d0", background: "#eef9f2", color: "#08713a", fontSize: 11 },
  notice: { marginBottom: 14, padding: "11px 13px", borderRadius: 10, border: "1px solid #ead9a6", background: "#fffaf0", color: "#765916", fontSize: 11 },
  footer: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginTop: 22, paddingTop: 18, borderTop: "1px solid #edf1ee", flexWrap: "wrap" },
  note: { flex: 1, color: "#7a8780", fontSize: 9, lineHeight: 1.5 },
  submit: { border: 0, borderRadius: 10, padding: "12px 18px", background: "#075f2b", color: "#fff", fontWeight: 900, fontSize: 11, cursor: "pointer" },
};
