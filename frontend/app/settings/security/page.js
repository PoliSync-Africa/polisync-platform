"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

function getToken() {
  if (typeof window === "undefined") return "";
  return ["polisync_token", "authToken", "accessToken", "token"].map((key) => localStorage.getItem(key) || sessionStorage.getItem(key)).find(Boolean) || "";
}

export default function SecuritySettingsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const navigation = useMemo(() => [{ section: "ACCOUNT", items: [
    { key: "home", label: "Home", href: "/dashboard", icon: "⌂" },
    { key: "dashboard", label: "Dashboard", href: "/personal", icon: "▦" },
    { key: "profile", label: "Profile", href: "/profile", icon: "♙" },
    { key: "security", label: "Privacy & Security", href: "/settings/security", icon: "◆" },
  ] }], []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const token = getToken();
      if (!token) { setError("Your session could not be found. Please sign in again."); setLoading(false); return; }
      try {
        const response = await fetch(`${API_URL}/api/profile/me`, { cache: "no-store", headers: { Accept: "application/json", Authorization: `Bearer ${token}` } });
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body?.success) throw new Error(body?.message || `Unable to load security settings (${response.status}).`);
        if (active) setUser(body.user || null);
      } catch (err) { if (active) setError(err.message || "Unable to load security settings."); }
      finally { if (active) setLoading(false); }
    };
    load();
    return () => { active = false; };
  }, []);

  const phoneVerified = Boolean(user?.phoneVerified);

  return <DashboardShell role="user" navigation={navigation} activeSection="security" title="Privacy & Security" subtitle="Protect your personal PoliSync account">
    <main className="security-page"><div className="security-container">
      {error && <div className="error">{error}</div>}
      {saved && <div className="success">Your security preferences are saved for this session.</div>}
      <section className="hero"><div><span>PERSONAL ACCOUNT</span><h1>Privacy & Security</h1><p>Review account verification, privacy boundaries and the security actions available to you.</p></div><div className="shield">◆</div></section>

      <section className="grid">
        <article className="card"><div className="icon">✓</div><div><h2>Phone verification</h2><p>{loading ? "Checking verification status…" : phoneVerified ? "Your registered phone number is verified." : "Your registered phone number is not verified yet."}</p></div><b className={phoneVerified ? "status ok" : "status pending"}>{phoneVerified ? "Verified" : "Pending"}</b></article>
        <article className="card"><div className="icon">✉</div><div><h2>Account identity</h2><p>{user?.email ? `Signed in as ${user.email}.` : "Your account identity is protected by your authenticated session."}</p></div><b className="status ok">Protected</b></article>
      </section>

      <section className="panel"><div className="heading"><span>PRIVACY</span><h2>Your data boundary</h2></div><p>Personal accounts can access public civic, electoral, research and news information. Private organization records remain protected by organization permissions and are not automatically exposed through a personal workspace.</p><div className="rows"><Row label="Public civic information" value="Available"/><Row label="Private organization records" value="Restricted"/><Row label="Location-aware features" value="Permission based"/><Row label="Account profile" value="Private to your account"/></div></section>

      <section className="panel"><div className="heading"><span>SECURITY</span><h2>Security actions</h2></div><div className="actions"><a href="/forgot-password">Reset password →</a><a href="/profile">Review profile →</a><a href="/policies#security">Read PoliSync security policy →</a></div><p className="hint">Never share your password, OTP, recovery code or active session with another person.</p></section>

      <section className="panel preference"><div><div className="heading"><span>ACCOUNT PRIVACY</span><h2>Personal privacy acknowledgement</h2></div><p>Keep your personal information accurate and use location sharing only when you want location-aware services. You can review the public privacy and security policies at any time.</p></div><button type="button" onClick={() => { setSaved(true); window.setTimeout(() => setSaved(false), 2500); }}>Acknowledge</button></section>
    </div></main>
    <style jsx>{` .security-page{min-height:100%;background:#f4f7f5;padding:clamp(12px,3vw,32px);box-sizing:border-box}.security-container{width:min(100%,1180px);margin:0 auto}.error,.success{padding:13px 15px;border-radius:12px;margin-bottom:12px;font-size:12px}.error{background:#fff4f4;border:1px solid #e3bcbc;color:#972b2b}.success{background:#eef9f1;border:1px solid #b9ddc2;color:#176332}.hero{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:clamp(22px,4vw,36px);border:1px solid #c9a227;border-radius:20px;background:linear-gradient(135deg,#04351a,#075f2b);color:#fff}.hero span,.heading span{color:#d9bc50;font-size:10px;font-weight:900;letter-spacing:1.5px}.hero h1{margin:7px 0;color:#fff;font-size:clamp(28px,4vw,40px)}.hero p{margin:0;max-width:720px;color:rgba(255,255,255,.78);line-height:1.6;font-size:13px}.shield{width:74px;height:74px;display:grid;place-items:center;border:2px solid #e9cf6a;border-radius:50%;color:#e9cf6a;font-size:26px;flex:0 0 auto}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:12px 0}.card{display:flex;align-items:center;gap:13px;padding:17px;border:1px solid #dce6df;border-radius:15px;background:#fff}.icon{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;background:#eaf5ee;color:#075f2b;font-weight:900;flex:0 0 auto}.card h2{margin:0 0 4px;color:#183326;font-size:15px}.card p{margin:0;color:#77847c;font-size:11px;line-height:1.5}.status{margin-left:auto;padding:6px 8px;border-radius:8px;font-size:9px;white-space:nowrap}.status.ok{background:#eaf5ee;color:#075f2b}.status.pending{background:#fff8df;color:#856b08}.panel{margin-top:12px;padding:19px;border:1px solid #dce6df;border-radius:15px;background:#fff}.heading h2{margin:5px 0 8px;color:#183326;font-size:19px}.panel>p{color:#5d6b63;line-height:1.7;font-size:12px}.rows{margin-top:10px}.rows>div{display:flex;justify-content:space-between;gap:15px;padding:11px 0;border-bottom:1px solid #edf1ee}.rows>div:last-child{border-bottom:0}.rows span{color:#7d8982;font-size:11px}.rows strong{color:#26382e;font-size:11px}.actions{display:flex;flex-wrap:wrap;gap:9px}.actions a{padding:10px 12px;border:1px solid #c9a227;border-radius:9px;background:#fbfaf4;color:#075f2b;text-decoration:none;font-size:10px;font-weight:800}.hint{margin-bottom:0!important;color:#87918a!important;font-size:10px!important}.preference{display:flex;align-items:center;justify-content:space-between;gap:18px}.preference button{border:0;border-radius:10px;padding:11px 14px;background:#075f2b;color:#fff;font-weight:800;font-size:10px;white-space:nowrap}@media(max-width:650px){.grid{grid-template-columns:1fr}.hero{align-items:flex-start}.shield{width:56px;height:56px}.card{align-items:flex-start}.status{margin-left:auto}.preference{display:block}.preference button{width:100%;margin-top:8px}}@media(max-width:430px){.hero{display:block}.shield{margin-top:16px}.card{display:grid;grid-template-columns:38px minmax(0,1fr);gap:10px}.status{grid-column:2;margin:0;justify-self:start}.rows>div{display:block}.rows strong{display:block;margin-top:4px}} `}</style>
  </DashboardShell>;
}

function Row({label,value}){return <div><span>{label}</span><strong>{value}</strong></div>}
