"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import superAdminNavigation from "../../../components/dashboard/superAdminNavigation";

const DEFAULTS = {
  platformName: "PoliSync Africa",
  defaultCountry: "Ghana",
  defaultElectionStatus: "Draft",
  allowPublicRegistration: true,
  requirePhoneVerification: true,
  maintenanceMode: false,
  publicResultsEnabled: true,
  auditLoggingEnabled: true,
  emailNotificationsEnabled: true,
  smsNotificationsEnabled: true,
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const token = () => typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || localStorage.getItem("token") || sessionStorage.getItem("token") || localStorage.getItem("authToken") || sessionStorage.getItem("authToken") || localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || "";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    cache: "no-store",
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token()}`, ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success !== true) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}

function Toggle({ checked, onChange, label, description }) {
  return <label className="toggle-row">
    <span className="toggle-copy"><strong>{label}</strong><small>{description}</small></span>
    <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
    <span className="switch" aria-hidden="true"><span /></span>
  </label>;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const data = await apiRequest("/api/platform-settings");
      setSettings({ ...DEFAULTS, ...(data.settings || {}) });
    } catch (e) {
      setError(e.message || "Unable to load platform settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const update = (key, value) => setSettings((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setSaving(true); setMessage(""); setError("");
    try {
      const data = await apiRequest("/api/platform-settings", { method: "PATCH", body: JSON.stringify(settings) });
      setSettings({ ...DEFAULTS, ...(data.settings || {}) });
      setMessage(data.message || "Settings saved successfully.");
    } catch (e) {
      setError(e.message || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return <DashboardShell role="super_admin" navigation={superAdminNavigation} activeSection="settings" title="Settings & Configuration" subtitle="Platform configuration and controls">
    <main className="page">
      <section className="hero">
        <div>
          <div className="eyebrow">POLISYNC AFRICA • SUPER ADMIN</div>
          <div className="live-badge"><span /> LIVE PLATFORM CONFIGURATION</div>
          <h1>Settings &amp; Configuration</h1>
          <p>Manage real platform configuration from one secure administration center.</p>
        </div>
        <button className="refresh" onClick={load} disabled={loading}>↻ Refresh</button>
      </section>

      {message && <div className="notice success">✓ {message}</div>}
      {error && <div className="notice error">{error}</div>}
      {loading ? <div className="loading">Loading platform configuration…</div> : <>
        <section className="grid">
          <article className="card">
            <div className="card-head"><span className="icon">▣</span><div><h2>Platform</h2><p>Core identity and default election behavior.</p></div></div>
            <label>Platform name<input value={settings.platformName} onChange={(e) => update("platformName", e.target.value)} /></label>
            <label>Default country<input value={settings.defaultCountry} onChange={(e) => update("defaultCountry", e.target.value)} /></label>
            <label>New election default status<select value={settings.defaultElectionStatus} onChange={(e) => update("defaultElectionStatus", e.target.value)}><option>Draft</option><option>Active</option><option>Closed</option></select></label>
          </article>

          <article className="card">
            <div className="card-head"><span className="icon">⚙</span><div><h2>Access &amp; Security</h2><p>Global account and security controls.</p></div></div>
            <Toggle checked={settings.allowPublicRegistration} onChange={(v) => update("allowPublicRegistration", v)} label="Public registration" description="Allow new personal accounts to register." />
            <Toggle checked={settings.requirePhoneVerification} onChange={(v) => update("requirePhoneVerification", v)} label="Phone verification" description="Require SMS verification for account security." />
            <Toggle checked={settings.auditLoggingEnabled} onChange={(v) => update("auditLoggingEnabled", v)} label="Audit logging" description="Record privileged platform actions." />
          </article>

          <article className="card">
            <div className="card-head"><span className="icon">◉</span><div><h2>Election &amp; Results</h2><p>Control how public election information is exposed.</p></div></div>
            <Toggle checked={settings.publicResultsEnabled} onChange={(v) => update("publicResultsEnabled", v)} label="Public results" description="Allow published election results to be visible publicly." />
            <a className="action" href="/super-admin/elections"><span>▣</span><div><strong>Election Management</strong><small>Create and edit elections, status and polling-station totals.</small></div><b>›</b></a>
            <a className="action" href="/super-admin/polling-stations"><span>⌖</span><div><strong>Polling Stations</strong><small>Manage and inspect the official electoral geography.</small></div><b>›</b></a>
          </article>

          <article className="card">
            <div className="card-head"><span className="icon">♧</span><div><h2>Notifications</h2><p>Platform-wide communication channels.</p></div></div>
            <Toggle checked={settings.emailNotificationsEnabled} onChange={(v) => update("emailNotificationsEnabled", v)} label="Email notifications" description="Enable platform email notifications." />
            <Toggle checked={settings.smsNotificationsEnabled} onChange={(v) => update("smsNotificationsEnabled", v)} label="SMS notifications" description="Enable platform SMS notifications." />
          </article>

          <article className="card danger-card">
            <div className="card-head"><span className="icon danger">!</span><div><h2>System Mode</h2><p>Use maintenance mode only when platform access must be restricted.</p></div></div>
            <Toggle checked={settings.maintenanceMode} onChange={(v) => update("maintenanceMode", v)} label="Maintenance mode" description="Place the platform into controlled maintenance mode." />
          </article>
        </section>
        <div className="savebar"><div><strong>Platform configuration</strong><span>Changes are stored server-side and protected by Super Admin authorization.</span></div><button className="save" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button></div>
      </>}
    </main>
    <style jsx>{styles}</style>
  </DashboardShell>;
}

const styles = `
.page{min-height:100%;box-sizing:border-box;background:#f5f8f6;padding:clamp(18px,3vw,38px);color:#123c2b}.hero{max-width:1180px;margin:0 auto 22px;display:flex;justify-content:space-between;align-items:flex-end;gap:20px}.eyebrow{font-size:14px;font-weight:900;letter-spacing:4px;color:#c99d18;margin-bottom:10px}.live-badge{display:inline-flex;align-items:center;gap:8px;margin:0 0 12px;padding:7px 10px;border-radius:999px;background:#e8f6ed;color:#08703a;font-size:11px;font-weight:900;letter-spacing:1.2px}.live-badge span{width:7px;height:7px;border-radius:50%;background:#0a8a45;box-shadow:0 0 0 4px rgba(10,138,69,.12)}.hero h1{margin:0;color:#075d2e;font-size:clamp(34px,5vw,58px);line-height:1.05;letter-spacing:-1.5px}.hero p{margin:12px 0 0;color:#718078;font-size:clamp(16px,2vw,20px)}button{font:inherit;cursor:pointer}.refresh{border:0;border-radius:12px;padding:13px 18px;background:#076b35;color:white;font-weight:800;white-space:nowrap}.refresh:disabled,.save:disabled{opacity:.6;cursor:wait}.grid{width:min(100%,1180px);margin:auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.card{background:white;border:1px solid #e0e7e3;border-radius:20px;padding:24px;box-shadow:0 8px 24px rgba(15,63,42,.06)}.card-head{display:flex;gap:14px;align-items:flex-start;margin-bottom:20px}.icon{width:46px;height:46px;flex:0 0 46px;border-radius:14px;background:#e8f3ed;color:#086b36;display:grid;place-items:center;font-size:23px;font-weight:900}.icon.danger{background:#fff0ed;color:#b6402e}.card h2{margin:2px 0 4px;color:#075d2e;font-size:22px}.card-head p{margin:0;color:#7a8781;font-size:14px;line-height:1.4}.card label{display:block;margin-top:15px;color:#3d5148;font-size:13px;font-weight:800}.card input,.card select{display:block;width:100%;box-sizing:border-box;margin-top:7px;padding:13px 14px;border:1px solid #d6dfda;border-radius:11px;background:#fbfcfb;color:#193f30;outline:none;font-size:15px}.card input:focus,.card select:focus{border-color:#0b7a3d;box-shadow:0 0 0 3px rgba(11,122,61,.1)}.toggle-row{display:flex!important;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid #edf1ef}.toggle-row:last-child{border-bottom:0}.toggle-copy{flex:1}.toggle-copy strong{display:block;color:#28493b;font-size:15px}.toggle-copy small{display:block;color:#7b8882;font-size:12px;font-weight:500;margin-top:3px;line-height:1.4}.toggle-row input{position:absolute;opacity:0;pointer-events:none}.switch{width:48px;height:28px;flex:0 0 48px;background:#cdd8d2;border-radius:99px;padding:3px;box-sizing:border-box;transition:.2s}.switch span{display:block;width:22px;height:22px;background:#fff;border-radius:50%;box-shadow:0 2px 5px #0002;transition:.2s}.toggle-row input:checked+.switch{background:#08733a}.toggle-row input:checked+.switch span{transform:translateX(20px)}.action{display:flex;align-items:center;gap:12px;text-decoration:none;color:#214839;border:1px solid #e0e9e4;border-radius:13px;padding:13px;margin-top:12px}.action>span{font-size:20px;color:#b48b16}.action div{flex:1}.action strong{display:block;font-size:14px}.action small{display:block;color:#7c8882;font-size:12px;margin-top:3px}.action b{font-size:24px;color:#08733a}.notice{width:min(100%,1180px);margin:0 auto 16px;padding:13px 16px;border-radius:12px;font-weight:700}.success{background:#e8f6ed;color:#08703a}.error{background:#fff0ed;color:#a93829}.loading{width:min(100%,1180px);margin:40px auto;padding:40px;text-align:center;background:white;border:1px solid #e1e8e4;border-radius:18px;color:#74827b}.savebar{width:min(100%,1180px);margin:20px auto 0;padding:16px 18px;background:#fff;border:1px solid #dfe8e3;border-radius:16px;display:flex;justify-content:space-between;align-items:center;gap:20px;box-shadow:0 8px 20px rgba(15,63,42,.05)}.savebar strong{display:block;color:#25493a}.savebar span{display:block;color:#7a8781;font-size:12px;margin-top:3px}.save{border:0;border-radius:12px;background:#075f30;color:white;padding:13px 20px;font-weight:900;white-space:nowrap}.danger-card{border-color:#eadbd7}@media(max-width:760px){.hero{align-items:flex-start;flex-direction:column}.refresh{width:100%}.grid{grid-template-columns:1fr}.card{padding:19px}.savebar{align-items:stretch;flex-direction:column}.save{width:100%}.eyebrow{font-size:11px;letter-spacing:2.8px}}@media(max-width:430px){.page{padding:14px}.hero h1{font-size:34px}.hero p{font-size:15px}.grid{gap:14px}.live-badge{font-size:9px}}
`;