"use client";

import { useEffect, useState } from "react";
import DashboardShell from "./DashboardShell";
import WeatherCard from "./WeatherCard";
import RemindersPanel from "./RemindersPanel";
import AIPersonalAssistant from "./AIPersonalAssistant";
import AIAnalyzer from "./AIAnalyzer";
import NotificationsPanel from "./NotificationsPanel";
import PrivacySecurityPanel from "./PrivacySecurityPanel";

const getToken = () => typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || "";
const apiBase = () => String(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export default function UserDashboardLanding({ role = "user", title, navigation, activeSection = "overview", onSectionChange, extraContent = null }) {
  const [state, setState] = useState({ loading:true, user:null, metrics:{}, error:"" });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const token = getToken();
        if (!token) throw new Error("Authentication required.");
        const response = await fetch(`${apiBase()}/api/profile/me`, { headers:{ Authorization:`Bearer ${token}`, Accept:"application/json" }, cache:"no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success !== true) throw new Error(data.message || `Unable to load account (${response.status}).`);
        if (!cancelled) setState({ loading:false, user:data.user || null, metrics:data.metrics || {}, error:"" });
      } catch (error) {
        if (!cancelled) setState((current) => ({ ...current, loading:false, error:error.message || "Unable to load account." }));
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const user = state.user || {};
  const roleTitle = title || formatRole(role);
  const cards = [
    ["My Profile", user.profileCompletion ?? 0, "%", "♙"],
    ["Organizations", state.metrics.organizations ?? 0, "", "▦"],
    ["Assignments", state.metrics.assignments ?? 0, "", "⌖"],
    ["Notifications", state.metrics.unreadNotifications ?? 0, "", "♧"],
    ["Reminders", state.metrics.activeReminders ?? 0, "", "✓"],
    ["Results", state.metrics.results ?? 0, "", "▤"],
  ];

  return <DashboardShell role={role} navigation={navigation} activeSection={activeSection} onSectionChange={onSectionChange} mobileMenuOpen={mobileMenuOpen} onMobileMenuClose={() => setMobileMenuOpen(false)} user={user}>
    <main className="page">
      <header className="hero"><div><span>POLISYNC AFRICA • SHARED ACCOUNT WORKSPACE</span><h2>{user.displayName || user.firstName || roleTitle}</h2><p>{roleTitle} workspace with the same dashboard experience used across PoliSync organizations.</p></div></header>
      {state.error && <div className="error">{state.error}</div>}
      <section className="grid">{cards.map(([label,value,suffix,icon]) => <article key={label} className="card"><div className="icon">{icon}</div><div><span>{label}</span><strong>{state.loading ? "—" : `${Number(value || 0).toLocaleString()}${suffix}`}</strong></div></article>)}</section>
      {extraContent}
      <section className="panels">
        <Panel title="Live Weather"><WeatherCard /></Panel>
        <Panel title="AI Personal Assistant"><AIPersonalAssistant /></Panel>
        <Panel title="AI Election Intelligence"><AIAnalyzer /></Panel>
        <Panel title="Reminders"><RemindersPanel /></Panel>
        <Panel title="Notifications"><NotificationsPanel /></Panel>
        <Panel title="Privacy & Security"><PrivacySecurityPanel /></Panel>
      </section>
    </main>
    <style jsx>{styles}</style>
  </DashboardShell>;
}

function Panel({ title, children }) { return <section className="panel"><header>{title}</header><div>{children}</div></section>; }
function formatRole(role) { return String(role || "user").replace(/[-_]/g," ").replace(/\b\w/g,(c)=>c.toUpperCase()); }
const styles=`.page{min-height:100%;padding:clamp(14px,2.5vw,32px);background:#f4f7f5;box-sizing:border-box}.hero{margin-bottom:14px}.hero span{color:#c9a227;font-size:9px;font-weight:900;letter-spacing:1.5px}.hero h2{margin:5px 0;color:#075f2b;font-size:30px}.hero p{margin:0;color:#6f7c74;font-size:12px}.error{margin-bottom:12px;padding:12px;border:1px solid #efd0d0;border-radius:10px;background:#fff5f5;color:#a00000;font-size:10px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.card{min-height:95px;display:flex;align-items:center;gap:11px;padding:14px;background:#fff;border:1px solid #dce6df;border-radius:13px}.icon{width:45px;height:45px;display:grid;place-items:center;border-radius:11px;border:1px solid #dcc06a;background:#faf6e8;color:#075f2b;font-size:20px}.card span{display:block;color:#7d8982;font-size:9px}.card strong{display:block;margin-top:4px;color:#075f2b;font-size:22px}.panels{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px}.panel{min-width:0;background:#fff;border:1px solid #dce6df;border-radius:15px;overflow:hidden}.panel header{padding:11px 14px;background:#f7faf8;border-bottom:1px solid #edf1ee;color:#68756d;font-size:9px;font-weight:900;letter-spacing:1px;text-transform:uppercase}.panel>div{padding:10px;min-height:120px}.super-admin-privileges{margin-top:14px;padding:18px;background:#fff;border:1px solid #dce6df;border-radius:15px}.super-admin-privileges header span{color:#c9a227;font-size:9px;font-weight:900;letter-spacing:1.5px}.super-admin-privileges h2{margin:5px 0;color:#075f2b;font-size:20px}.super-admin-privileges p{margin:0;color:#6f7c74;font-size:12px;line-height:1.5}.super-admin-privileges ul{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:14px 0 0;padding:0;list-style:none}.super-admin-privileges li{display:flex;gap:8px;align-items:flex-start;padding:10px;border:1px solid #edf1ee;border-radius:10px;background:#f9fbfa;color:#536159;font-size:11px;line-height:1.45}.super-admin-privileges li>span:first-child{color:#075f2b;font-weight:900}@media(max-width:850px){.grid{grid-template-columns:repeat(2,1fr)}.panels{grid-template-columns:1fr}.super-admin-privileges ul{grid-template-columns:1fr}}@media(max-width:520px){.grid{grid-template-columns:1fr}.hero h2{font-size:24px}}`;
