"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

function getToken() {
  if (typeof window === "undefined") return "";
  return ["polisync_token", "authToken", "accessToken", "token"]
    .map((key) => localStorage.getItem(key) || sessionStorage.getItem(key))
    .find(Boolean) || "";
}

function displayName(user) {
  return user?.displayName || [user?.firstName, user?.middleName, user?.lastName].filter(Boolean).join(" ") || user?.username || "PoliSync User";
}

function initials(name) {
  return String(name || "U").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
}

function formatDate(value) {
  if (!value) return "Not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [metrics, setMetrics] = useState({ organizations: 0, assignments: 0, unreadNotifications: 0, results: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState(null);
  const [savingPhoto, setSavingPhoto] = useState(false);

  const navigation = useMemo(() => [{
    section: "ACCOUNT",
    items: [
      { key: "home", label: "Home", href: "/dashboard", icon: "⌂" },
      { key: "dashboard", label: "Dashboard", href: "/personal", icon: "▦" },
      { key: "profile", label: "Profile", href: "/profile", icon: "♙" },
      { key: "privacy", label: "Privacy & Security", href: "/privacy", icon: "◆" },
    ],
  }], []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const token = getToken();
      if (!token) {
        if (active) { setError("Your session could not be found. Please sign in again."); setLoading(false); }
        return;
      }
      try {
        const response = await fetch(`${API_URL}/api/profile/me`, {
          cache: "no-store",
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body?.success) throw new Error(body?.message || `Profile request failed (${response.status}).`);
        if (!active) return;
        setUser(body.user || null);
        setMetrics(body.metrics || {});
        setPhoto(body.user?.profilePhoto || null);
      } catch (err) {
        if (active) setError(err.message || "Unable to load your profile.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const name = displayName(user);
  const handlePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    setSavingPhoto(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const token = getToken();
      const response = await fetch(`${API_URL}/api/profile/photo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ profilePhoto: dataUrl }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body?.success) throw new Error(body?.message || "Profile photo could not be saved.");
      setPhoto(body.user?.profilePhoto || dataUrl);
      setUser((current) => ({ ...current, profilePhoto: body.user?.profilePhoto || dataUrl }));
    } catch (err) {
      setError(err.message || "Unable to update profile photo.");
    } finally {
      setSavingPhoto(false);
    }
  };

  return (
    <DashboardShell role="user" navigation={navigation} activeSection="profile" title="Profile" subtitle="Manage your personal PoliSync account">
      <main className="profile-page">
        <div className="profile-container">
          {error && <div className="profile-error" role="alert">{error}</div>}

          <section className="profile-hero">
            <div className="avatar-wrap">
              <div className="avatar">
                {photo ? <img src={photo} alt="Profile" /> : initials(name)}
              </div>
              <label className="photo-button">
                {savingPhoto ? "Saving…" : "Update photo"}
                <input type="file" accept="image/*" onChange={handlePhoto} disabled={savingPhoto} />
              </label>
            </div>
            <div className="hero-copy">
              <span className="eyebrow">PERSONAL ACCOUNT</span>
              <h1>{loading ? "Loading profile…" : name}</h1>
              <p>{user?.email || "Your account information"}</p>
              <div className="badges">
                <span className={user?.verified ? "badge verified" : "badge"}>{user?.verified ? "✓ Phone verified" : "Phone not verified"}</span>
                <span className="badge">{user?.accountStatus || "Account"}</span>
              </div>
            </div>
          </section>

          <section className="metric-grid" aria-label="Account activity">
            <Metric label="Profile completion" value={user?.profileCompletion != null ? `${user.profileCompletion}%` : "—"} />
            <Metric label="Organizations" value={metrics.organizations ?? "—"} />
            <Metric label="Assignments" value={metrics.assignments ?? "—"} />
            <Metric label="Results submitted" value={metrics.results ?? "—"} />
          </section>

          <section className="profile-grid">
            <article className="panel">
              <div className="panel-heading"><div><span className="eyebrow">IDENTITY</span><h2>Personal information</h2></div></div>
              <Info label="First name" value={user?.firstName} />
              <Info label="Middle name" value={user?.middleName} />
              <Info label="Last name" value={user?.lastName} />
              <Info label="Username" value={user?.username} />
              <Info label="Date of birth" value={formatDate(user?.dateOfBirth)} />
            </article>

            <article className="panel">
              <div className="panel-heading"><div><span className="eyebrow">CONTACT</span><h2>Contact information</h2></div></div>
              <Info label="Email" value={user?.email} />
              <Info label="Phone" value={user?.phone} />
              <Info label="Email verification" value="Not required for account security" />
              <Info label="Phone verification" value={user?.phoneVerified ? "Verified" : "Not verified"} />
            </article>
          </section>

          <section className="panel account-panel">
            <div className="panel-heading"><div><span className="eyebrow">ACCOUNT SECURITY</span><h2>Account status & access</h2></div></div>
            <div className="access-row"><div><strong>Platform role</strong><span>Personal account access</span></div><b>{user?.platformRole || "user"}</b></div>
            <div className="access-row"><div><strong>Account status</strong><span>Your current PoliSync account state</span></div><b>{user?.accountStatus || "—"}</b></div>
            <div className="security-actions"><a href="/privacy">Privacy & Security →</a><a href="/personal">Return to personal workspace →</a></div>
          </section>
        </div>
      </main>
      <style jsx>{styles}</style>
    </DashboardShell>
  );
}

function Metric({ label, value }) { return <div className="metric"><span>{label}</span><strong>{value}</strong></div>; }
function Info({ label, value }) { return <div className="info"><span>{label}</span><strong>{value || "Not provided"}</strong></div>; }

const styles = `
.profile-page{min-height:100%;background:#f4f7f5;padding:clamp(14px,3vw,34px);box-sizing:border-box}.profile-container{width:min(100%,1200px);margin:0 auto}.profile-error{margin-bottom:14px;padding:13px 15px;border:1px solid #e3b9b9;border-radius:12px;background:#fff5f5;color:#9b2c2c;font-size:13px}.profile-hero{display:flex;align-items:center;gap:24px;padding:clamp(22px,4vw,38px);border-radius:22px;background:linear-gradient(135deg,#04351a,#075f2b);border:1px solid #c9a227;color:#fff;box-shadow:0 12px 30px rgba(17,65,36,.12)}.avatar-wrap{display:grid;justify-items:center;gap:9px;flex:0 0 auto}.avatar{width:112px;height:112px;border-radius:50%;display:grid;place-items:center;overflow:hidden;background:#e9c75a;color:#06351c;font-size:35px;font-weight:900;border:3px solid #f1d475}.avatar img{width:100%;height:100%;object-fit:cover}.photo-button{display:inline-flex;align-items:center;justify-content:center;padding:7px 10px;border:1px solid rgba(255,255,255,.35);border-radius:9px;background:rgba(255,255,255,.1);color:#fff;font-size:10px;font-weight:800;cursor:pointer}.photo-button input{display:none}.hero-copy{min-width:0}.eyebrow{display:block;color:#d9bc50;font-size:10px;font-weight:900;letter-spacing:1.5px}.hero-copy h1{margin:7px 0 5px;font-size:clamp(27px,4vw,40px);line-height:1.1}.hero-copy p{margin:0;color:rgba(255,255,255,.78);font-size:14px;overflow-wrap:anywhere}.badges{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}.badge{padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.22);font-size:10px;font-weight:800;text-transform:capitalize}.badge.verified{background:rgba(230,200,90,.16);border-color:#d9bc50;color:#ffe38a}.metric-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0}.metric{padding:15px;border:1px solid #dce6df;border-radius:14px;background:#fff}.metric span{display:block;color:#87918a;font-size:10px}.metric strong{display:block;margin-top:6px;color:#075f2b;font-size:21px}.profile-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.panel{padding:20px;border:1px solid #dce6df;border-radius:16px;background:#fff;box-shadow:0 7px 20px rgba(17,65,36,.04)}.panel-heading{margin-bottom:12px}.panel-heading h2{margin:5px 0 0;color:#183326;font-size:19px}.info{display:flex;justify-content:space-between;gap:20px;padding:13px 0;border-bottom:1px solid #edf1ee}.info:last-child{border-bottom:0}.info span{color:#7d8982;font-size:11px}.info strong{max-width:62%;text-align:right;color:#26382e;font-size:12px;overflow-wrap:anywhere}.account-panel{margin-top:14px}.access-row{display:flex;justify-content:space-between;gap:20px;align-items:center;padding:14px 0;border-bottom:1px solid #edf1ee}.access-row strong,.access-row span{display:block}.access-row strong{color:#26382e;font-size:12px}.access-row span{margin-top:4px;color:#859089;font-size:10px}.access-row b{padding:6px 9px;border-radius:8px;background:#eaf5ee;color:#075f2b;font-size:10px;text-transform:capitalize}.security-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}.security-actions a{padding:10px 12px;border:1px solid #c9a227;border-radius:9px;color:#075f2b;background:#fbfaf4;text-decoration:none;font-size:11px;font-weight:800}@media(max-width:760px){.profile-page{padding:12px}.profile-hero{align-items:flex-start;gap:16px;padding:20px;border-radius:18px}.avatar{width:82px;height:82px;font-size:27px}.metric-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.profile-grid{grid-template-columns:1fr}.panel{padding:16px}.info{gap:10px}.info strong{max-width:58%}}@media(max-width:430px){.profile-hero{display:block;text-align:center}.avatar-wrap{margin-bottom:15px}.hero-copy h1{font-size:25px}.badges{justify-content:center}.metric strong{font-size:18px}.info{display:block}.info strong{display:block;max-width:none;text-align:left;margin-top:5px}.access-row{align-items:flex-start}.security-actions a{width:100%;box-sizing:border-box;text-align:center}}
`;
