"use client";

import { useEffect, useMemo, useState } from "react";

const levels = [
  ["national", "National Admin"],
  ["regional", "Regional Admin"],
  ["constituency", "Constituency Admin"],
  ["polling_station", "Polling Station Agent"],
];
const token = () => typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || localStorage.getItem("token") || sessionStorage.getItem("token") || localStorage.getItem("authToken") || sessionStorage.getItem("authToken") || localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || "";
const api = (path) => path;

export default function PartyDeploymentsPage() {
  const [level, setLevel] = useState("regional");
  const [regions, setRegions] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [stations, setStations] = useState([]);
  const [regionId, setRegionId] = useState("");
  const [constituencyId, setConstituencyId] = useState("");
  const [pollingStationId, setPollingStationId] = useState("");
  const [days, setDays] = useState(7);
  const [maxUses, setMaxUses] = useState(1);
  const [invitations, setInvitations] = useState([]);
  const [created, setCreated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function request(path, options = {}) {
    const response = await fetch(api(path), { cache: "no-store", ...options, headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token()}`, ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed.");
    return data;
  }

  useEffect(() => { request("/api/electoral-geography/regions").then((d) => setRegions(d.regions || d.data || [])).catch(() => {}); request("/api/party-organizations/deployments/invitations").then((d) => setInvitations(d.invitations || [])).catch(() => {}); }, []);
  useEffect(() => { setConstituencyId(""); setPollingStationId(""); setStations([]); if (regionId && ["constituency", "polling_station"].includes(level)) request(`/api/electoral-geography/regions/${regionId}/constituencies`).then((d) => setConstituencies(d.constituencies || d.data || [])).catch(() => setConstituencies([])); }, [regionId, level]);
  useEffect(() => { setPollingStationId(""); if (constituencyId && level === "polling_station") request(`/api/electoral-geography/constituencies/${constituencyId}/polling-stations`).then((d) => setStations(d.pollingStations || d.stations || d.data || [])).catch(() => setStations([])); }, [constituencyId, level]);

  const selectedName = useMemo(() => {
    if (level === "national") return "National Party Organization";
    if (level === "regional") return regions.find((x) => String(x._id || x.id) === String(regionId))?.name || "Selected Region";
    if (level === "constituency") return constituencies.find((x) => String(x._id || x.id) === String(constituencyId))?.name || "Selected Constituency";
    return stations.find((x) => String(x._id || x.id) === String(pollingStationId))?.name || "Selected Polling Station";
  }, [level, regionId, constituencyId, pollingStationId, regions, constituencies, stations]);

  async function createInvitation() {
    setLoading(true); setMessage(""); setCreated(null);
    try {
      const data = await request("/api/party-organizations/deployments/invitations", { method: "POST", body: JSON.stringify({ level, regionId: regionId || undefined, constituencyId: constituencyId || undefined, pollingStationId: pollingStationId || undefined, expiresInDays: Number(days), maxUses: Number(maxUses) }) });
      setCreated(data.invitation); setInvitations((prev) => [data.invitation, ...prev]); setMessage("Deployment invitation created successfully.");
    } catch (e) { setMessage(e.message); } finally { setLoading(false); }
  }

  async function revoke(id) { try { await request(`/api/party-organizations/deployments/invitations/${id}`, { method: "DELETE" }); setInvitations((prev) => prev.map((x) => x._id === id || x.id === id ? { ...x, status: "revoked" } : x)); } catch (e) { setMessage(e.message); } }
  async function copy(value) { try { await navigator.clipboard.writeText(value); setMessage("Invitation link copied."); } catch { setMessage("Copy failed. Long-press the link to copy it."); } }

  return <main style={{ minHeight: "100vh", padding: "32px", background: "#f6f8fb", color: "#152033" }}>
    <div style={{ maxWidth: 1180, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}><a href="/party" style={{ textDecoration: "none" }}>← Party Command Center</a><div style={{ marginTop: 12, fontSize: 12, letterSpacing: 1.4, fontWeight: 800, opacity: .6 }}>PARTY ADMINISTRATION</div><h1 style={{ margin: "6px 0" }}>Deployment Center</h1><p style={{ margin: 0, opacity: .7 }}>Create secure invitation links and QR codes for your party's approved geographical hierarchy.</p></div>
      <section style={{ background: "white", borderRadius: 18, padding: 24, boxShadow: "0 8px 30px rgba(20,35,60,.07)", marginBottom: 24 }}>
        <h2 style={{ marginTop: 0 }}>Deploy an organizational level</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14 }}>
          <label>Level<select value={level} onChange={(e) => setLevel(e.target.value)} style={input}>{levels.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></label>
          {level !== "national" && <label>Region<select value={regionId} onChange={(e) => setRegionId(e.target.value)} style={input}><option value="">Select region</option>{regions.map((x) => <option key={x._id || x.id} value={x._id || x.id}>{x.name}</option>)}</select></label>}
          {["constituency", "polling_station"].includes(level) && <label>Constituency<select value={constituencyId} onChange={(e) => setConstituencyId(e.target.value)} style={input}><option value="">Select constituency</option>{constituencies.map((x) => <option key={x._id || x.id} value={x._id || x.id}>{x.name}</option>)}</select></label>}
          {level === "polling_station" && <label>Polling station<select value={pollingStationId} onChange={(e) => setPollingStationId(e.target.value)} style={input}><option value="">Select polling station</option>{stations.map((x) => <option key={x._id || x.id} value={x._id || x.id}>{x.name} {x.pollingStationCode ? `(${x.pollingStationCode})` : ""}</option>)}</select></label>}
          <label>Expires in (days)<input type="number" min="1" max="30" value={days} onChange={(e) => setDays(e.target.value)} style={input}/></label>
          <label>Maximum uses<input type="number" min="1" max="1000" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} style={input}/></label>
        </div>
        <div style={{ marginTop: 18, padding: 14, borderRadius: 12, background: "#f4f7fb" }}><b>Target:</b> {selectedName}</div>
        <button disabled={loading} onClick={createInvitation} style={button}>{loading ? "Creating…" : "Generate Invitation + QR Code"}</button>
        {message && <div style={{ marginTop: 12, fontSize: 14 }}>{message}</div>}
      </section>
      {created && <section style={{ background: "white", borderRadius: 18, padding: 24, boxShadow: "0 8px 30px rgba(20,35,60,.07)", marginBottom: 24 }}><h2 style={{ marginTop: 0 }}>Deployment package ready</h2><div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 220px", gap: 24, alignItems: "center" }}><div><p><b>{created.level.replaceAll("_", " ")}</b> · {selectedName}</p><div style={{ display: "flex", gap: 8 }}><input readOnly value={created.url} style={{ ...input, margin: 0 }} /><button onClick={() => copy(created.url)} style={button}>Copy link</button></div><p style={{ fontSize: 13, opacity: .65 }}>Share this link or QR code only with the people authorized for this geographical assignment.</p></div><div style={{ textAlign: "center" }}><img src={created.qrCode} alt="Secure PoliSync deployment QR code" style={{ width: 200, height: 200 }} /><a href={created.qrCode} download="polisync-deployment-qr.png" style={{ display: "block", marginTop: 8 }}>Download QR</a></div></div></section>}
      <section style={{ background: "white", borderRadius: 18, padding: 24, boxShadow: "0 8px 30px rgba(20,35,60,.07)" }}><h2 style={{ marginTop: 0 }}>Deployment invitations</h2>{invitations.length === 0 ? <p style={{ opacity: .6 }}>No invitations created yet.</p> : <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr>{["Level", "Scope", "Status", "Uses", "Expires", "Actions"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{invitations.map((x) => <tr key={x._id || x.id}><td style={td}>{String(x.level).replaceAll("_", " ")}</td><td style={td}>{x.pollingStationId || x.constituencyId || x.regionId || "National"}</td><td style={td}>{x.status}</td><td style={td}>{x.uses}/{x.maxUses}</td><td style={td}>{x.expiresAt ? new Date(x.expiresAt).toLocaleDateString() : "—"}</td><td style={td}>{x.status === "active" && <button onClick={() => revoke(x._id || x.id)} style={smallButton}>Revoke</button>}</td></tr>)}</tbody></table></div>}</section>
    </div>
  </main>;
}
const input = { width: "100%", boxSizing: "border-box", marginTop: 7, padding: "11px 12px", border: "1px solid #d9e0ea", borderRadius: 10, background: "white" };
const button = { marginTop: 18, border: 0, borderRadius: 10, padding: "12px 18px", fontWeight: 800, cursor: "pointer", background: "#152033", color: "white" };
const smallButton = { border: "1px solid #d9e0ea", borderRadius: 8, padding: "7px 10px", background: "white", cursor: "pointer" };
const th = { textAlign: "left", padding: 12, borderBottom: "1px solid #e6ebf1", fontSize: 12, textTransform: "uppercase", letterSpacing: .5 };
const td = { padding: 12, borderBottom: "1px solid #eef1f5", fontSize: 14 };
