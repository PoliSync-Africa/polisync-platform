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

function dateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "Not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

function formFromUser(user) {
  return {
    displayName: user?.displayName || "",
    firstName: user?.firstName || "",
    middleName: user?.middleName || "",
    lastName: user?.lastName || "",
    dateOfBirth: dateInput(user?.dateOfBirth),
    nationality: user?.nationality || "",
    identificationType: user?.identificationType || "",
    identificationNumber: user?.identificationNumber || "",
    email: user?.email || "",
    phone: user?.phone || "",
  };
}

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [metrics, setMetrics] = useState({ organizations: 0, assignments: 0, unreadNotifications: 0, results: 0 });
  const [form, setForm] = useState(formFromUser(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const navigation = useMemo(() => [{
    section: "ACCOUNT",
    items: [
      { key: "home", label: "Home", href: "/dashboard", icon: "⌂" },
      { key: "dashboard", label: "Dashboard", href: "/personal", icon: "▦" },
      { key: "profile", label: "Profile", href: "/profile", icon: "♙" },
      { key: "privacy", label: "Privacy & Security", href: "/privacy", icon: "◆" },
    ],
  }], []);

  const loadProfile = async () => {
    const token = getToken();
    if (!token) {
      setError("Your session could not be found. Please sign in again.");
      setLoading(false);
      return;
    }
    try {
      setError("");
      const response = await fetch(`${API_URL}/api/profile/me`, {
        cache: "no-store",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body?.success) throw new Error(body?.message || `Profile request failed (${response.status}).`);
      const freshUser = body.user || null;
      setUser(freshUser);
      setForm(formFromUser(freshUser));
      setMetrics(body.metrics || {});

      // Keep local session identity synchronized with the authoritative DB response.
      try {
        const raw = localStorage.getItem("polisync_user") || sessionStorage.getItem("polisync_user");
        const stored = raw ? JSON.parse(raw) : {};
        const merged = { ...stored, ...freshUser };
        if (localStorage.getItem("polisync_user")) localStorage.setItem("polisync_user", JSON.stringify(merged));
        if (sessionStorage.getItem("polisync_user")) sessionStorage.setItem("polisync_user", JSON.stringify(merged));
      } catch { /* local cache is non-authoritative */ }
    } catch (err) {
      setError(err.message || "Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const name = displayName(user);

  const updateField = (event) => {
    const { name: field, value } = event.target;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    const token = getToken();
    if (!token) {
      setError("Your session has expired. Please sign in again.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/api/profile/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body?.success) throw new Error(body?.message || `Profile update failed (${response.status}).`);
      const freshUser = body.user || null;
      setUser(freshUser);
      setForm(formFromUser(freshUser));
      setMetrics(body.metrics || {});
      setEditing(false);
      setNotice("Profile saved. Your account now reflects the latest data from PoliSync.");

      try {
        const raw = localStorage.getItem("polisync_user") || sessionStorage.getItem("polisync_user");
        const stored = raw ? JSON.parse(raw) : {};
        const merged = { ...stored, ...freshUser };
        ["polisync_user"].forEach((key) => {
          if (localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(merged));
          if (sessionStorage.getItem(key)) sessionStorage.setItem(key, JSON.stringify(merged));
        });
      } catch { /* local cache is non-authoritative */ }
    } catch (err) {
      setError(err.message || "Unable to save your profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    setSavingPhoto(true);
    setError("");
    setNotice("");
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
      const freshUser = { ...(user || {}), ...(body.user || {}), profilePhoto: body.user?.profilePhoto || dataUrl };
      setUser(freshUser);
      setForm(formFromUser(freshUser));
      setNotice("Profile photo updated.");
    } catch (err) {
      setError(err.message || "Unable to update profile photo.");
    } finally {
      setSavingPhoto(false);
    }
  };

  const isSuperAdmin = user?.platformRole === "super_admin";

  return (
    <DashboardShell
      role={isSuperAdmin ? "super_admin" : "user"}
      navigation={isSuperAdmin ? null : navigation}
      activeSection="profile"
      title="Profile"
      subtitle={isSuperAdmin ? "Manage the PoliSync Africa platform profile" : "Manage your personal PoliSync account"}
      user={user}
    >
      <main className="profile-page">
        <div className="profile-container">
          {error && <div className="profile-message error" role="alert">{error}</div>}
          {notice && <div className="profile-message success" role="status">✓ {notice}</div>}

          <section className="profile-hero">
            <div className="avatar-wrap">
              <div className="avatar">
                {user?.profilePhoto ? <img src={user.profilePhoto} alt="Profile" /> : initials(name)}
              </div>
              <label className="photo-button">
                {savingPhoto ? "Saving…" : "Update photo"}
                <input type="file" accept="image/*" onChange={handlePhoto} disabled={savingPhoto} />
              </label>
            </div>
            <div className="hero-copy">
              <span className="eyebrow">{isSuperAdmin ? "POLISYNC AFRICA PLATFORM ACCOUNT" : "PERSONAL ACCOUNT"}</span>
              <h1>{loading ? "Loading profile…" : name}</h1>
              <p>{user?.email || "Complete your profile information"}</p>
              <div className="badges">
                <span className={user?.verified ? "badge verified" : "badge"}>{user?.verified ? "✓ Verified" : "Verification pending"}</span>
                <span className="badge">{isSuperAdmin ? "Super Admin" : user?.accountStatus || "Account"}</span>
              </div>
            </div>
            <div className="hero-action">
              {!editing && <button type="button" className="edit-button" onClick={() => { setNotice(""); setError(""); setEditing(true); }}>Edit profile</button>}
            </div>
          </section>

          <section className="completion-card">
            <div><span className="eyebrow dark">PROFILE COMPLETION</span><strong>{user?.profileCompletion ?? 0}%</strong></div>
            <div className="progress"><span style={{ width: `${Math.min(100, Math.max(0, Number(user?.profileCompletion || 0)))}%` }} /></div>
            <p>{Number(user?.profileCompletion || 0) >= 100 ? "Your profile is complete and synchronized." : "Complete the available profile fields so PoliSync can keep your account information accurate."}</p>
          </section>

          {editing ? (
            <form className="edit-panel" onSubmit={saveProfile}>
              <div className="panel-heading"><div><span className="eyebrow dark">EDIT PROFILE</span><h2>Keep your account information current</h2><p>Changes are saved to the authenticated account and returned from the database after saving.</p></div></div>

              <div className="form-section"><h3>Identity</h3><div className="form-grid">
                <Field label="Display name" name="displayName" value={form.displayName} onChange={updateField} placeholder="How your name should appear" />
                <Field label="First name" name="firstName" value={form.firstName} onChange={updateField} required />
                <Field label="Middle name" name="middleName" value={form.middleName} onChange={updateField} />
                <Field label="Last name" name="lastName" value={form.lastName} onChange={updateField} required />
                <Field label="Date of birth" type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={updateField} />
                <Field label="Nationality" name="nationality" value={form.nationality} onChange={updateField} />
              </div></div>

              <div className="form-section"><h3>Identification</h3><div className="form-grid">
                <label className="field"><span>Identification type</span><select name="identificationType" value={form.identificationType} onChange={updateField}><option value="">Select type</option><option value="ghana_card">Ghana Card</option><option value="voter_id">Voter ID</option><option value="passport">Passport</option></select></label>
                <Field label="Identification number" name="identificationNumber" value={form.identificationNumber} onChange={updateField} placeholder="Enter the number" />
              </div></div>

              <div className="form-section"><h3>Contact</h3><div className="form-grid">
                <Field label="Email" type="email" name="email" value={form.email} onChange={updateField} required />
                <Field label="Phone" name="phone" value={form.phone} onChange={updateField} required placeholder="+233XXXXXXXXX" />
              </div><p className="field-note">Changing your email or phone may require verification again. Your password, platform role, account status and security permissions cannot be changed from this form.</p></div>

              <div className="form-actions"><button type="button" className="cancel" onClick={() => { setForm(formFromUser(user)); setEditing(false); }}>Cancel</button><button type="submit" className="save" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button></div>
            </form>
          ) : (
            <>
              <section className="profile-grid">
                <article className="panel"><div className="panel-heading"><div><span className="eyebrow dark">IDENTITY</span><h2>Personal information</h2></div></div>
                  <Info label="Display name" value={user?.displayName} /><Info label="First name" value={user?.firstName} /><Info label="Middle name" value={user?.middleName} /><Info label="Last name" value={user?.lastName} /><Info label="Date of birth" value={formatDate(user?.dateOfBirth)} /><Info label="Nationality" value={user?.nationality} />
                </article>
                <article className="panel"><div className="panel-heading"><div><span className="eyebrow dark">CONTACT</span><h2>Contact information</h2></div></div>
                  <Info label="Email" value={user?.email} /><Info label="Phone" value={user?.phone} /><Info label="Email verification" value={user?.emailVerified ? "Verified" : "Not verified"} /><Info label="Phone verification" value={user?.phoneVerified ? "Verified" : "Not verified"} />
                </article>
              </section>

              <section className="profile-grid second-row">
                <article className="panel"><div className="panel-heading"><div><span className="eyebrow dark">IDENTIFICATION</span><h2>Identity records</h2></div></div><Info label="Identification type" value={user?.identificationType ? user.identificationType.replace("_", " ") : null} /><Info label="Identification number" value={user?.identificationNumber} /></article>
                <article className="panel"><div className="panel-heading"><div><span className="eyebrow dark">ACCOUNT</span><h2>Account status</h2></div></div><Info label="Username" value={user?.username} /><Info label="Platform role" value={user?.platformRole} /><Info label="Account status" value={user?.accountStatus} /><Info label="Last profile update" value={formatDate(user?.updatedAt)} /></article>
              </section>

              <section className="panel activity-panel"><div className="panel-heading"><div><span className="eyebrow dark">LIVE ACCOUNT DATA</span><h2>Current activity</h2><p>These figures are loaded from PoliSync's current database records.</p></div></div><div className="metric-grid"><Metric label="Organizations" value={metrics.organizations ?? 0} /><Metric label="Assignments" value={metrics.assignments ?? 0} /><Metric label="Results submitted" value={metrics.results ?? 0} /><Metric label="Unread notifications" value={metrics.unreadNotifications ?? 0} /></div></section>
            </>
          )}
        </div>
      </main>
      <style jsx>{styles}</style>
    </DashboardShell>
  );
}

function Field({ label, name, value, onChange, type = "text", required = false, placeholder = "" }) {
  return <label className="field"><span>{label}{required ? " *" : ""}</span><input type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} /></label>;
}

function Info({ label, value }) { return <div className="info"><span>{label}</span><strong>{value || "Not provided"}</strong></div>; }
function Metric({ label, value }) { return <div className="metric"><span>{label}</span><strong>{Number(value || 0).toLocaleString()}</strong></div>; }

const styles = `
.profile-page{min-height:100%;background:#f4f7f5;padding:clamp(14px,3vw,34px);box-sizing:border-box}.profile-container{width:min(100%,1200px);margin:0 auto}.profile-message{margin-bottom:14px;padding:13px 15px;border-radius:12px;font-size:13px}.profile-message.error{border:1px solid #e3b9b9;background:#fff5f5;color:#9b2c2c}.profile-message.success{border:1px solid #b9dcc7;background:#f1fbf4;color:#075f2b}.profile-hero{display:flex;align-items:center;gap:24px;padding:clamp(22px,4vw,38px);border-radius:22px;background:linear-gradient(135deg,#04351a,#075f2b);border:1px solid #c9a227;color:#fff;box-shadow:0 12px 30px rgba(17,65,36,.12)}.avatar-wrap{display:grid;justify-items:center;gap:9px;flex:0 0 auto}.avatar{width:112px;height:112px;border-radius:50%;display:grid;place-items:center;overflow:hidden;background:#e9c75a;color:#06351c;font-size:35px;font-weight:900;border:3px solid #f1d475}.avatar img{width:100%;height:100%;object-fit:cover}.photo-button{display:inline-flex;align-items:center;justify-content:center;padding:7px 10px;border:1px solid rgba(255,255,255,.35);border-radius:9px;background:rgba(255,255,255,.1);color:#fff;font-size:10px;font-weight:800;cursor:pointer}.photo-button input{display:none}.hero-copy{min-width:0;flex:1}.eyebrow{display:block;color:#d9bc50;font-size:10px;font-weight:900;letter-spacing:1.5px}.eyebrow.dark{color:#9b7a12}.hero-copy h1{margin:7px 0 5px;font-size:clamp(27px,4vw,40px);line-height:1.1}.hero-copy p{margin:0;color:rgba(255,255,255,.78);font-size:14px;overflow-wrap:anywhere}.badges{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}.badge{padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.22);font-size:10px;font-weight:800;text-transform:capitalize}.badge.verified{background:rgba(230,200,90,.16);border-color:#d9bc50;color:#ffe38a}.hero-action{flex:0 0 auto}.edit-button{border:1px solid #e7cb62;border-radius:10px;padding:11px 16px;background:#fff;color:#075f2b;font-weight:900;font-size:12px;cursor:pointer}.completion-card{margin:14px 0;padding:17px 19px;border:1px solid #dce6df;border-radius:16px;background:#fff}.completion-card>div:first-child{display:flex;align-items:end;justify-content:space-between;gap:10px}.completion-card strong{font-size:25px;color:#075f2b}.progress{height:8px;margin:10px 0 8px;border-radius:99px;background:#e7eee9;overflow:hidden}.progress span{display:block;height:100%;border-radius:99px;background:#0b8750;transition:width .25s ease}.completion-card p{margin:0;color:#7b8780;font-size:11px}.profile-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.second-row{margin-top:14px}.panel,.edit-panel{padding:20px;border:1px solid #dce6df;border-radius:16px;background:#fff;box-shadow:0 7px 20px rgba(17,65,36,.04)}.panel-heading{margin-bottom:12px}.panel-heading h2{margin:5px 0 0;color:#183326;font-size:19px}.panel-heading p{margin:6px 0 0;color:#7c8981;font-size:11px}.info{display:flex;justify-content:space-between;gap:20px;padding:13px 0;border-bottom:1px solid #edf1ee}.info:last-child{border-bottom:0}.info span{color:#7d8982;font-size:11px;text-transform:none}.info strong{max-width:62%;text-align:right;color:#26382e;font-size:12px;overflow-wrap:anywhere;text-transform:capitalize}.activity-panel{margin-top:14px}.metric-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.metric{padding:14px;border:1px solid #e1e9e4;border-radius:12px;background:#fafcfb}.metric span{display:block;color:#87918a;font-size:10px}.metric strong{display:block;margin-top:6px;color:#075f2b;font-size:21px}.edit-panel{margin-top:0}.form-section{padding:18px 0;border-top:1px solid #edf1ee}.form-section:first-of-type{border-top:0}.form-section h3{margin:0 0 13px;color:#1d3328;font-size:14px}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.field{display:grid;gap:6px}.field span{color:#6f7c74;font-size:10px;font-weight:800}.field input,.field select{width:100%;box-sizing:border-box;border:1px solid #d7e1db;border-radius:10px;padding:11px 12px;background:#fff;color:#24372c;font:inherit;font-size:12px;outline:none}.field input:focus,.field select:focus{border-color:#0b8750;box-shadow:0 0 0 3px rgba(11,135,80,.08)}.field-note{margin:10px 0 0;color:#8a958f;font-size:10px}.form-actions{display:flex;justify-content:flex-end;gap:9px;padding-top:18px}.cancel,.save{padding:11px 16px;border-radius:9px;font-size:11px;font-weight:900;cursor:pointer}.cancel{border:1px solid #d7e1db;background:#fff;color:#536259}.save{border:1px solid #075f2b;background:#075f2b;color:#fff}.save:disabled{opacity:.6;cursor:wait}@media(max-width:760px){.profile-page{padding:12px}.profile-hero{align-items:flex-start;gap:16px;padding:20px;border-radius:18px;flex-wrap:wrap}.avatar{width:82px;height:82px;font-size:27px}.hero-action{width:100%}.edit-button{width:100%}.profile-grid{grid-template-columns:1fr}.metric-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.panel,.edit-panel{padding:16px}.info{gap:10px}.info strong{max-width:58%}.form-grid{grid-template-columns:1fr}}@media(max-width:430px){.profile-hero{display:block;text-align:center}.avatar-wrap{margin-bottom:15px}.hero-copy h1{font-size:25px}.badges{justify-content:center}.hero-action{margin-top:14px}.metric strong{font-size:18px}.info{display:block}.info strong{display:block;max-width:none;text-align:left;margin-top:5px}.form-actions{display:grid;grid-template-columns:1fr}.cancel,.save{width:100%}}
`;
