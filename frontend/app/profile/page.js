"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";

const nav = [{ section: "MY WORKSPACE", items: [
  { label: "Home", href: "/dashboard", key: "home", icon: "⌂" },
  { label: "Dashboard", href: "/dashboard", key: "overview", icon: "⌂" },
  { label: "Campaigns", href: "/campaigns", key: "campaigns", icon: "◉" },
  { label: "Field Work", href: "/field-work", key: "field-work", icon: "⚑" },
  { label: "Research & Surveys", href: "/research", key: "research", icon: "⌕" },
  { label: "Elections", href: "/elections", key: "elections", icon: "◎" },
  { label: "Results", href: "/results", key: "results", icon: "↗" },
  { label: "Ghana News & Intelligence", href: "/news", key: "news", icon: "◌" },
  { label: "Calendar", href: "/calendar", key: "calendar", icon: "□" },
  { label: "Messages", href: "/messages", key: "messages", icon: "✉" },
  { label: "Notifications", href: "/notifications", key: "notifications", icon: "♧" },
  { label: "AI Analyzer", href: "/ai-analyzer", key: "ai-analyzer", icon: "✦" },
  { label: "Profile", href: "/profile", key: "profile", icon: "♙" },
  { label: "Privacy & Security", href: "/settings/security", key: "security", icon: "♢" },
]}];

const token = () => typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || "";
const api = () => String(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [metrics, setMetrics] = useState({ organizations: 0, assignments: 0, unreadNotifications: 0, results: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      const t = token();
      if (!t) { if (active) { setError("Authentication required."); setLoading(false); } return; }
      try {
        const response = await fetch(`${api()}/api/profile/me`, { headers: { Authorization: `Bearer ${t}`, Accept: "application/json" }, cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.success) throw new Error(data?.message || "Unable to load your profile.");
        if (active) { setUser(data.user || null); setMetrics(data.metrics || {}); }
      } catch (e) { if (active) setError(e.message || "Unable to load your profile."); }
      finally { if (active) setLoading(false); }
    };
    load();
    return () => { active = false; };
  }, []);

  const displayName = user?.displayName || [user?.firstName, user?.middleName, user?.lastName].filter(Boolean).join(" ") || "PoliSync User";
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join("").toUpperCase() || "U";

  return <DashboardShell role="user" navigation={nav} activeSection="profile" user={user || { displayName }}>
    <main className="page">
      <section className="hero"><div><span>PERSONAL ACCOUNT</span><h1>My Profile</h1><p>Manage and review the identity, verification and account information connected to your personal PoliSync Africa workspace.</p></div></section>
      {error && <div className="error">{error}</div>}
      {loading ? <section className="card loading">Loading your profile…</section> : <>
        <section className="profile-card">
          <div className="avatar">{user?.profilePhoto ? <img src={user.profilePhoto} alt="Profile" /> : initials}</div>
          <div className="identity"><div className="name-row"><h2>{displayName}</h2>{user?.verified && <span className="verified">✓ Verified</span>}</div><p>{user?.email || "Email not available"}</p><small>{user?.username ? `@${user.username}` : "Personal account"}</small></div>
          <a className="security" href="/settings/security">Privacy & Security →</a>
        </section>
        <section className="grid">
          <Info label="First name" value={user?.firstName} /><Info label="Middle name" value={user?.middleName} /><Info label="Last name" value={user?.lastName} /><Info label="Email" value={user?.email} /><Info label="Phone" value={user?.phone} /><Info label="Date of birth" value={user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "Not provided"} /><Info label="Platform role" value={user?.platformRole || "user"} /><Info label="Account status" value={user?.accountStatus || "active"} />
        </section>
        <section className="stats"><Stat label="Profile completion" value={`${user?.profileCompletion ?? 0}%`} /><Stat label="Organizations" value={metrics.organizations ?? 0} /><Stat label="Assignments" value={metrics.assignments ?? 0} /><Stat label="Results submitted" value={metrics.results ?? 0} /></section>
      </>}
    </main>
    <style jsx>{`.page{min-height:100vh;padding:clamp(14px,2.5vw,32px);background:#f4f7f5;color:#193127}.hero{padding:28px;border-radius:22px;background:linear-gradient(135deg,#04351a,#075f2b);border:1px solid #c9a227;color:#fff}.hero span{color:#c9a227;font-size:10px;font-weight:900;letter-spacing:1.5px}.hero h1{margin:8px 0;font-size:34px}.hero p{max-width:780px;color:#dce9e1;font-size:12px;line-height:1.6}.error{margin-top:12px;padding:12px;border:1px solid #efcaca;border-radius:12px;background:#fff5f5;color:#a62c2c;font-size:11px}.loading{margin-top:12px;color:#718078}.profile-card{display:flex;align-items:center;gap:18px;margin-top:12px;padding:20px;border:1px solid #dce6df;border-radius:18px;background:#fff}.avatar{width:76px;height:76px;flex:0 0 76px;display:grid;place-items:center;overflow:hidden;border-radius:50%;background:#eaf5ee;color:#075f2b;font-size:24px;font-weight:900}.avatar img{width:100%;height:100%;object-fit:cover}.identity{min-width:0;flex:1}.name-row{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.identity h2{margin:0;color:#075f2b;font-size:21px}.identity p{margin:5px 0;color:#59675f;font-size:12px}.identity small{color:#8a958e;font-size:10px}.verified{padding:5px 8px;border-radius:999px;background:#eaf5ee;color:#075f2b;font-size:9px;font-weight:900}.security{padding:10px 12px;border:1px solid #c9a227;border-radius:10px;color:#075f2b;text-decoration:none;font-size:10px;font-weight:850}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}.info,.stat{padding:14px;border:1px solid #dce6df;border-radius:14px;background:#fff}.info small{display:block;color:#89948d;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}.info strong{display:block;margin-top:6px;color:#263b31;font-size:12px;word-break:break-word}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}.stat span{display:block;color:#89948d;font-size:9px}.stat strong{display:block;margin-top:5px;color:#075f2b;font-size:20px}@media(max-width:850px){.grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.profile-card{align-items:flex-start;flex-wrap:wrap}.security{width:100%;text-align:center}.grid,.stats{grid-template-columns:1fr 1fr}.hero h1{font-size:28px}}`}</style>
  </DashboardShell>;
}

function Info({ label, value }) { return <div className="info"><small>{label}</small><strong>{value || "Not provided"}</strong></div>; }
function Stat({ label, value }) { return <div className="stat"><span>{label}</span><strong>{typeof value === "number" ? Number(value).toLocaleString() : value}</strong></div>; }
