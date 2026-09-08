"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import superAdminNavigation from "../../../components/dashboard/superAdminNavigation";
import { getPartyLogo } from "../../../components/party/PartyLogo";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://polisync-platform-1.onrender.com").replace(/\/+$/, "");

function getToken() {
  if (typeof window === "undefined") return "";
  return ["polisync_token", "authToken", "accessToken", "token"].map((key) => localStorage.getItem(key) || sessionStorage.getItem(key)).find(Boolean) || "";
}

export default function PoliticalPartiesPage() {
  const [parties, setParties] = useState([]);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/api/elections/parties`, { cache: "no-store", headers: { Accept: "application/json", Authorization: `Bearer ${getToken()}` } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success !== true) throw new Error(data.message || `Unable to load political parties (${response.status}).`);
      setParties(Array.isArray(data.parties) ? data.parties : []);
    } catch (e) { setError(e.message || "Unable to load political parties."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addParty = async (event) => {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch(`${API_URL}/api/elections/parties`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ name: name.trim(), logoUrl: logoUrl.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success !== true) throw new Error(data.message || "Unable to add political party.");
      setNotice(`${data.party.name} was added to the PoliSync political-party registry and is now available for future elections.`);
      setName(""); setLogoUrl("");
      await load();
    } catch (e) { setError(e.message || "Unable to add political party."); }
    finally { setSaving(false); }
  };

  return (
    <DashboardShell role="super_admin" navigation={superAdminNavigation} activeSection="political-parties" title="Political Parties" subtitle="Permanent registry, Independent participation and future party onboarding">
      <main className="page">
        <header className="hero">
          <div><span>SUPER ADMIN • PARTY REGISTRY</span><h1>Political Parties</h1><p>Permanent system parties are protected in the registry. New political parties can only be added by the Super Admin.</p></div>
          <button type="button" className="refresh" onClick={load} disabled={loading}>{loading ? "Loading…" : "↻ Refresh"}</button>
        </header>

        {notice && <div className="notice success">✓ {notice}</div>}
        {error && <div className="notice error">{error}</div>}

        <section className="add-card">
          <div><span className="eyebrow">FUTURE PARTY ONBOARDING</span><h2>Add Political Party</h2><p>Adding a party here immediately makes it an approved system political party. It will automatically appear in election creation and party candidate assignment.</p></div>
          <form onSubmit={addParty} className="form">
            <label>Political party name<input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New Political Movement" /></label>
            <label>Party logo URL <span>(optional)</span><input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…" /></label>
            <button className="primary" disabled={saving || !name.trim()}>{saving ? "Adding…" : "Add Party to Registry"}</button>
          </form>
        </section>

        <section className="registry">
          <div className="registry-head"><div><span className="eyebrow">SYSTEM REGISTRY</span><h2>Registered Political Parties</h2></div><strong>{parties.length}</strong></div>
          {loading ? <div className="state">Loading registered political parties…</div> : parties.length === 0 ? <div className="state">No approved political parties are currently registered.</div> : <div className="grid">{parties.map((party) => {
            const fallbackLogo = getPartyLogo(party.name);
            const logo = party.logoUrl || fallbackLogo;
            return <article className="party" key={party.id}>
              <div className="logo">{logo ? <img src={logo} alt={`${party.name} logo`} /> : <span>{String(party.name || "P").slice(0, 1)}</span>}</div>
              <div className="info"><h3>{party.name}</h3><p>{String(party.name).toLowerCase() === "independent" ? "Independent election participant" : "Approved system political party"}</p></div>
              <span className="status">APPROVED</span>
            </article>;
          })}</div>}
        </section>
      </main>
      <style jsx>{styles}</style>
    </DashboardShell>
  );
}

const styles = `
.page{min-height:100%;box-sizing:border-box;padding:clamp(14px,2.5vw,32px);background:#f5f8f6;color:#26332b}.hero{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:16px}.hero span,.eyebrow{color:#c9a227;font-size:9px;font-weight:900;letter-spacing:1.4px}.hero h1{margin:6px 0;color:#075f2b;font-size:30px}.hero p{margin:0;color:#6f7c74;font-size:12px}.refresh{border:1px solid #d5e2d9;border-radius:9px;background:#075f2b;color:#fff;padding:10px 13px;font-size:10px;font-weight:800;cursor:pointer}.refresh:disabled{opacity:.55}.notice{margin:12px 0;padding:12px 14px;border-radius:10px;font-size:10px}.success{border:1px solid #c7e4d0;background:#eef9f2;color:#08713a}.error{border:1px solid #efd0d0;background:#fff5f5;color:#a00000}.add-card,.registry{padding:20px;border:1px solid #dce6df;border-radius:15px;background:#fff;margin-bottom:14px}.add-card h2,.registry h2{margin:5px 0;color:#075f2b;font-size:20px}.add-card p{margin:0 0 17px;color:#758078;font-size:10px;line-height:1.55}.form{display:grid;grid-template-columns:1fr 1fr auto;align-items:end;gap:10px}.form label{display:flex;flex-direction:column;gap:6px;color:#53635a;font-size:9px;font-weight:800}.form label span{font-weight:500;color:#929c96}.form input{min-height:42px;box-sizing:border-box;padding:0 11px;border:1px solid #dce6df;border-radius:9px;background:#fbfcfb;color:#26332b;font-size:11px;outline:none}.primary{min-height:42px;padding:0 14px;border:0;border-radius:9px;background:#075f2b;color:#fff;font-size:10px;font-weight:900;cursor:pointer}.primary:disabled{opacity:.55;cursor:not-allowed}.registry-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:13px}.registry-head strong{display:grid;place-items:center;min-width:34px;height:34px;border-radius:50%;background:#eaf6ee;color:#075f2b;font-size:13px}.state{padding:18px;border-radius:10px;background:#f7faf8;color:#718078;text-align:center;font-size:10px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:9px}.party{display:flex;align-items:center;gap:10px;padding:11px;border:1px solid #e1e9e4;border-radius:11px;background:#fbfdfc}.logo{width:42px;height:42px;flex:0 0 42px;display:grid;place-items:center;border-radius:9px;background:#eaf3ed;overflow:hidden}.logo img{width:100%;height:100%;object-fit:contain}.logo span{color:#075f2b;font-size:15px;font-weight:900}.info{min-width:0;flex:1}.info h3{margin:0;color:#2f4036;font-size:12px}.info p{margin:3px 0 0;color:#8a958e;font-size:8px}.status{padding:5px 7px;border-radius:999px;background:#eaf6ee;color:#08713a;font-size:7px;font-weight:900;letter-spacing:.6px}@media(max-width:800px){.hero{display:block}.refresh{margin-top:11px}.form{grid-template-columns:1fr}.primary{width:100%}}
`;
