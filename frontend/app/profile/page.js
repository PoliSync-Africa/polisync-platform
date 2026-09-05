"use client";

import { useEffect, useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";

const token = () => typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || localStorage.getItem("token") || sessionStorage.getItem("token") || "";
const api = () => String(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const navigation = [{ section: "MY ACCOUNT", items: [
  { label: "Dashboard", href: "/dashboard", key: "overview", icon: "⌂" },
  { label: "Profile", href: "/profile", key: "profile", icon: "♙" },
  { label: "Results", href: "/results", key: "results", icon: "↗" },
  { label: "Privacy & Security", href: "/settings/security", key: "security", icon: "♢" },
]}];

export default function ProfilePage() {
  const [state, setState] = useState({ loading: true, user: null, metrics: {}, error: "" });
  useEffect(() => {
    let active = true;
    (async () => {
      const t = token();
      if (!t) { if (active) setState({ loading: false, user: null, metrics: {}, error: "Authentication required. Please sign in again." }); return; }
      try {
        const res = await fetch(`${api()}/api/profile/me`, { headers: { Authorization: `Bearer ${t}`, Accept: "application/json" }, cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) throw new Error(data?.message || `Unable to load profile (${res.status}).`);
        if (active) setState({ loading: false, user: data.user || {}, metrics: data.metrics || {}, error: "" });
      } catch (e) { if (active) setState({ loading: false, user: null, metrics: {}, error: e.message || "Unable to load profile." }); }
    })();
    return () => { active = false; };
  }, []);
  const user = state.user || {};
  const displayName = user.displayName || [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ") || "PoliSync User";
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0,2).map((x) => x[0]).join("").toUpperCase() || "U";
  return <DashboardShell title="Profile" subtitle="Manage your personal PoliSync Africa account." role="user" navigation={navigation} activeSection="profile" user={user}>
    <main className="profile-page">
      <section className="hero"><span>PERSONAL ACCOUNT</span><h2>My Profile</h2><p>Your identity, verification and account information in one place.</p></section>
      {state.error ? <div className="error">{state.error}</div> : state.loading ? <div className="card">Loading your profile…</div> : <>
        <section className="identity card">
          <div className="avatar">{user.profilePhoto ? <img src={user.profilePhoto} alt="Profile" /> : initials}</div>
          <div className="copy"><h3>{displayName}</h3><p>{user.email || "Email not available"}</p><small>{user.username ? `@${user.username}` : "Personal account"}</small></div>
          {user.verified && <span className="verified">✓ Verified</span>}
        </section>
        <section className="grid">
          {[["First name", user.firstName],["Middle name", user.middleName],["Last name", user.lastName],["Email", user.email],["Phone", user.phone],["Date of birth", user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "Not provided"],["Platform role", user.platformRole || "user"],["Account status", user.accountStatus || "active"]].map(([label,value]) => <div className="card info" key={label}><small>{label}</small><strong>{value || "Not provided"}</strong></div>)}
        </section>
        <section className="grid stats">
          {[["Profile completion", `${user.profileCompletion ?? 0}%"], ["Organizations", metricsValue(state.metrics.organizations)], ["Assignments", metricsValue(state.metrics.assignments)], ["Results submitted", metricsValue(state.metrics.results)]].map(([label,value]) => <div className="card info" key={label}><small>{label}</small><strong>{value}</strong></div>)}
        </section>
      </>}
    </main>
    <style jsx>{`.profile-page{min-height:100%;padding:clamp(14px,2.5vw,34px);background:#f4f7f5;box-sizing:border-box}.hero{padding:28px;border-radius:22px;background:linear-gradient(135deg,#04351a,#075f2b);border:1px solid #c9a227;color:#fff}.hero span{color:#c9a227;font-size:10px;font-weight:900;letter-spacing:1.5px}.hero h2{margin:8px 0 5px;font-size:32px}.hero p{margin:0;color:#dce9e1;font-size:12px}.error,.card{margin-top:12px;padding:16px;border-radius:16px;background:#fff;border:1px solid #dce6df}.error{color:#a62c2c;border-color:#efcccc;background:#fff5f5}.identity{display:flex;align-items:center;gap:16px}.avatar{width:76px;height:76px;flex:0 0 76px;display:grid;place-items:center;overflow:hidden;border-radius:50%;background:#eaf5ee;color:#075f2b;font-size:24px;font-weight:900}.avatar img{width:100%;height:100%;object-fit:cover}.copy{min-width:0;flex:1}.copy h3{margin:0;color:#075f2b;font-size:20px}.copy p{margin:5px 0;color:#59675f;font-size:12px}.copy small{color:#8a958e;font-size:10px}.verified{padding:5px 9px;border-radius:999px;background:#eaf5ee;color:#075f2b;font-size:9px;font-weight:900}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:12px}.info small{display:block;color:#89948d;font-size:9px;text-transform:uppercase;letter-spacing:.5px}.info strong{display:block;margin-top:6px;color:#263b31;font-size:12px;overflow-wrap:anywhere}.stats .info strong{color:#075f2b;font-size:20px}@media(max-width:850px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.profile-page{padding:12px}.hero h2{font-size:27px}.identity{align-items:flex-start;flex-wrap:wrap}.verified{margin-left:92px}.grid{grid-template-columns:1fr}.hero{border-radius:18px}}`}</style>
  </DashboardShell>;
}
function metricsValue(value){return Number(value||0).toLocaleString();}
