"use client";

import { useEffect, useMemo, useState } from "react";
import superAdminNavigation from "./superAdminNavigation";
import PoliSyncBrand from "./PoliSyncBrand";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export default function DashboardShell({
  children,
  title = "Dashboard",
  subtitle = "",
  role = "user",
  navigation = null,
  activeSection = "overview",
  onSectionChange = null,
  mobileMenuOpen = false,
  onMobileMenuClose = null,
  user = null,
  onSignOut = null,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(Boolean(mobileMenuOpen));
  const [profilePhoto, setProfilePhoto] = useState(() => getStoredUser()?.profilePhoto || user?.profilePhoto || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [location, setLocation] = useState({
    loading: role !== "super_admin",
    name: "Location unavailable",
    country: "",
    countryCode: "",
    flag: "🌍",
    temperature: null,
    condition: "",
  });

  useEffect(() => setSidebarOpen(Boolean(mobileMenuOpen)), [mobileMenuOpen]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [sidebarOpen]);

  useEffect(() => {
    if (role === "super_admin") {
      setLocation((current) => ({ ...current, loading: false, name: "PoliSync Africa", country: "", flag: "🌍" }));
      return undefined;
    }

    if (!navigator.geolocation) {
      setLocation((current) => ({ ...current, loading: false, name: "Location unavailable" }));
      return undefined;
    }

    let cancelled = false;
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const [geoResponse, weatherResponse] = await Promise.all([
          fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(coords.latitude)}&longitude=${encodeURIComponent(coords.longitude)}&localityLanguage=en`),
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(coords.latitude)}&longitude=${encodeURIComponent(coords.longitude)}&current=temperature_2m,weather_code&timezone=auto`),
        ]);

        const geo = geoResponse.ok ? await geoResponse.json() : {};
        const weather = weatherResponse.ok ? await weatherResponse.json() : {};
        if (cancelled) return;

        const countryCode = String(geo.countryCode || geo.countryCodeIso2 || "").toUpperCase();
        const locality = geo.locality || geo.city || geo.principalSubdivision || geo.countryName || "Current location";
        const region = geo.principalSubdivision && geo.principalSubdivision !== locality ? geo.principalSubdivision : "";

        setLocation({
          loading: false,
          name: region ? `${locality}, ${region}` : locality,
          country: geo.countryName || "",
          countryCode,
          flag: countryCodeToFlag(countryCode),
          temperature: weather?.current?.temperature_2m ?? null,
          condition: weatherCodeToText(weather?.current?.weather_code),
        });
      } catch {
        if (!cancelled) setLocation((current) => ({ ...current, loading: false, name: "Location unavailable" }));
      }
    }, () => {
      if (!cancelled) setLocation((current) => ({ ...current, loading: false, name: "Location permission not granted" }));
    }, { enableHighAccuracy: true, maximumAge: 300000, timeout: 12000 });

    return () => { cancelled = true; };
  }, [role]);

  const sections = useMemo(() => {
    if (Array.isArray(navigation)) return navigation;
    if (role === "super_admin" && Array.isArray(superAdminNavigation)) return superAdminNavigation;
    return [];
  }, [navigation, role]);

  const closeSidebar = () => {
    setSidebarOpen(false);
    onMobileMenuClose?.();
  };

  const displayRole = formatRole(role);
  const displayName = user?.displayName || user?.firstName || user?.name || getStoredUser()?.displayName || displayRole;
  const initials = getInitials(displayName);

  const handleNavigation = (item, event) => {
    const itemKey = item?.key || item?.href || item?.label || "overview";
    if (!item?.href || item.href === "#") event?.preventDefault();
    onSectionChange?.(itemKey);
    closeSidebar();
  };

  const handleProfilePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;

    setUploadingPhoto(true);
    try {
      const dataUrl = await resizeImage(file, 400, 0.78);
      setProfilePhoto(dataUrl);

      const storedUser = getStoredUser() || {};
      const updatedUser = { ...storedUser, ...user, profilePhoto: dataUrl };
      saveStoredUser(updatedUser);

      const token = getStoredToken();
      if (token) {
        const response = await fetch(`${API_URL || ""}/api/profile/photo`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ profilePhoto: dataUrl }),
        });
        if (!response.ok) throw new Error("Profile photo could not be saved.");
      }
    } catch (error) {
      console.error("PoliSync profile photo update failed:", error);
      setProfilePhoto(user?.profilePhoto || getStoredUser()?.profilePhoto || null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="polisync-dashboard">
      {sidebarOpen && <button type="button" className="dashboard-overlay" aria-label="Close navigation" onClick={closeSidebar} />}

      <aside className={`dashboard-sidebar ${sidebarOpen ? "dashboard-sidebar-open" : ""}`} aria-label="Dashboard navigation">
        <div className="dashboard-brand">
          <PoliSyncBrand />
          <button type="button" className="dashboard-sidebar-close" aria-label="Close navigation" onClick={closeSidebar}>×</button>
        </div>

        <nav className="dashboard-navigation">
          {sections.length > 0 ? sections.map((section, sectionIndex) => {
            const sectionKey = section?.section || section?.key || `section-${sectionIndex}`;
            const items = Array.isArray(section?.items) ? section.items : [];
            return (
              <div className="dashboard-nav-group" key={sectionKey}>
                {section?.section && <div className="dashboard-nav-section">{section.section}</div>}
                {items.map((item, itemIndex) => {
                  const itemKey = item?.key || item?.href || item?.label || `item-${sectionIndex}-${itemIndex}`;
                  const isActive = activeSection === itemKey || activeSection === item?.key;
                  return (
                    <a key={itemKey} href={item?.href || "#"} className={`dashboard-nav-item ${isActive ? "dashboard-nav-item-active" : ""}`} aria-current={isActive ? "page" : undefined} onClick={(event) => handleNavigation(item, event)}>
                      <span className="dashboard-nav-icon" aria-hidden="true">{item?.icon || "•"}</span>
                      <span className="dashboard-nav-label">{item?.label || "Untitled"}</span>
                      {item?.badge != null && <span className="dashboard-nav-badge">{item.badge === true ? "!" : item.badge}</span>}
                    </a>
                  );
                })}
              </div>
            );
          }) : <FallbackNavigation activeSection={activeSection} onSectionChange={onSectionChange} onNavigate={closeSidebar} />}
        </nav>

        <div className="dashboard-sidebar-footer">
          <div className="dashboard-role-label">CURRENT ROLE</div>
          <div className="dashboard-role">{displayRole}</div>
          <button type="button" className="dashboard-logout" onClick={() => { closeSidebar(); onSignOut?.(); }}>Sign Out</button>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-header">
          <button type="button" className="dashboard-menu-button" aria-label="Open navigation" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(true)}>☰</button>

          <div className="dashboard-header-brand"><PoliSyncBrand compact /></div>

          <div className="dashboard-header-title">
            <div className="dashboard-country-line">
              <span className="dashboard-country-flag" aria-label={location.country || "Country"}>{location.flag}</span>
              <span>{location.loading ? "Locating…" : location.name}</span>
              {location.country && <span className="dashboard-country-name">{location.country}</span>}
            </div>
            <h1>{title || "Dashboard"}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>

          <div className="dashboard-header-actions">
            <div className="dashboard-weather" aria-label="Live atmospheric weather">
              <span className="dashboard-weather-icon" aria-hidden="true">{weatherToIcon(location.condition)}</span>
              <div>
                <strong>{location.temperature == null ? "--°C" : `${Math.round(location.temperature)}°C`}</strong>
                <small>{location.condition || "Atmospheric temperature"}</small>
              </div>
            </div>

            <button type="button" className="dashboard-header-icon" aria-label="Notifications">🔔</button>
            <button type="button" className="dashboard-header-icon" aria-label="Messages">💬</button>

            <label className="dashboard-profile" title="Update profile photo">
              <input className="dashboard-photo-input" type="file" accept="image/*" onChange={handleProfilePhoto} />
              <span className="dashboard-profile-avatar">
                {profilePhoto ? <img src={profilePhoto} alt="Profile" /> : initials}
                <span className="dashboard-camera">{uploadingPhoto ? "…" : "📷"}</span>
              </span>
              <span className="dashboard-profile-text"><strong>{displayName}</strong><small>Update photo</small></span>
              <span className="dashboard-profile-arrow" aria-hidden="true">▼</span>
            </label>
          </div>
        </header>

        <main className="dashboard-content-wrapper">{children}</main>
      </div>

      <style jsx>{`
        .polisync-dashboard { --green:#075f2b; --gold:#c9a227; --text:#1f2d25; --muted:#66736b; --light:#849088; --border:#dce6df; width:100%; min-height:100vh; display:flex; background:#f4f7f5; color:var(--text); }
        .dashboard-sidebar { position:fixed; inset:0 auto 0 0; z-index:1200; width:280px; display:flex; flex-direction:column; background:#fff; border-right:1px solid var(--border); box-shadow:8px 0 30px rgba(16,59,34,.06); overflow:hidden; transform:translateX(0); transition:transform 180ms ease; }
        .dashboard-brand { min-height:106px; display:flex; align-items:center; justify-content:center; padding:10px 16px; border-bottom:1px solid #edf1ee; background:#fff; }
        .dashboard-brand :global(.polisync-brand-image) { max-width:232px; }
        .dashboard-sidebar-close { display:none; width:38px; height:38px; margin-left:auto; border:1px solid var(--border); border-radius:10px; background:#fff; color:var(--green); font-size:24px; cursor:pointer; }
        .dashboard-navigation { flex:1; min-height:0; padding:16px 12px; overflow-y:auto; }
        .dashboard-nav-group + .dashboard-nav-group { margin-top:20px; }
        .dashboard-nav-section { margin:0 10px 8px; color:var(--light); font-size:11px; font-weight:850; letter-spacing:1px; text-transform:uppercase; }
        .dashboard-nav-item { position:relative; width:100%; min-height:46px; display:flex; align-items:center; gap:11px; box-sizing:border-box; margin:3px 0; padding:10px 11px; border-radius:10px; color:#56635b; text-decoration:none; font-size:14px; font-weight:650; transition:background 140ms ease,color 140ms ease; }
        .dashboard-nav-item:hover { background:#eaf5ee; color:var(--green); }
        .dashboard-nav-item-active { background:var(--green); color:#fff; box-shadow:0 6px 18px rgba(7,95,43,.18); }
        .dashboard-nav-item-active:hover { background:var(--green); color:#fff; }
        .dashboard-nav-icon { width:25px; flex:0 0 25px; display:inline-flex; align-items:center; justify-content:center; font-size:18px; }
        .dashboard-nav-label { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dashboard-nav-badge { min-width:23px; height:23px; margin-left:auto; padding:0 6px; display:inline-flex; align-items:center; justify-content:center; border-radius:999px; background:var(--gold); color:#fff; font-size:11px; font-weight:900; }
        .dashboard-sidebar-footer { padding:15px; border-top:1px solid #edf1ee; background:#fbfcfb; }
        .dashboard-role-label { color:var(--light); font-size:10px; font-weight:850; letter-spacing:1px; }
        .dashboard-role { margin-top:5px; color:var(--green); font-size:14px; font-weight:850; }
        .dashboard-logout { width:100%; min-height:42px; margin-top:11px; padding:9px 12px; border:1px solid var(--border); border-radius:9px; background:#fff; color:#59655e; font-size:13px; font-weight:750; cursor:pointer; }
        .dashboard-main { width:calc(100% - 280px); min-width:0; min-height:100vh; margin-left:280px; }
        .dashboard-header { position:sticky; top:0; z-index:900; min-height:80px; display:flex; align-items:center; gap:14px; padding:10px 22px; box-sizing:border-box; background:rgba(255,255,255,.97); border-bottom:1px solid #e1e9e3; backdrop-filter:blur(10px); }
        .dashboard-menu-button { display:none; width:44px; height:44px; flex:0 0 44px; align-items:center; justify-content:center; padding:0; border:1px solid var(--border); border-radius:10px; background:#fff; color:var(--green); font-size:21px; cursor:pointer; }
        .dashboard-header-brand { width:142px; flex:0 0 142px; display:flex; align-items:center; justify-content:center; }
        .dashboard-header-brand :global(.polisync-brand-image) { max-width:138px; }
        .dashboard-header-title { min-width:0; flex:1; }
        .dashboard-country-line { display:flex; align-items:center; flex-wrap:wrap; gap:5px; margin-bottom:3px; color:var(--light); font-size:10px; font-weight:750; }
        .dashboard-country-flag { font-size:17px; line-height:1; }
        .dashboard-country-name { color:#9a8250; font-weight:850; }
        .dashboard-header-title h1 { margin:0; color:var(--green); font-size:clamp(21px,2vw,29px); line-height:1.15; font-weight:850; letter-spacing:-.35px; }
        .dashboard-header-title p { margin:5px 0 0; color:var(--muted); font-size:13px; line-height:1.4; }
        .dashboard-header-actions { display:flex; align-items:center; gap:8px; flex-shrink:0; }
        .dashboard-weather { display:flex; align-items:center; gap:8px; min-width:110px; padding-right:12px; border-right:1px solid #e4ebe6; }
        .dashboard-weather-icon { font-size:21px; }
        .dashboard-weather strong { display:block; color:#344139; font-size:12px; }
        .dashboard-weather small { display:block; margin-top:2px; max-width:105px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--light); font-size:9px; }
        .dashboard-header-icon { width:42px; height:42px; flex:0 0 42px; display:grid; place-items:center; padding:0; border:1px solid var(--border); border-radius:10px; background:#fff; font-size:18px; cursor:pointer; }
        .dashboard-profile { position:relative; min-height:44px; display:flex; align-items:center; gap:9px; padding:4px 10px 4px 5px; border:1px solid var(--border); border-radius:999px; background:#fff; cursor:pointer; }
        .dashboard-photo-input { position:absolute; width:1px; height:1px; opacity:0; pointer-events:none; }
        .dashboard-profile-avatar { position:relative; width:35px; height:35px; flex:0 0 35px; display:grid; place-items:center; overflow:hidden; border-radius:50%; background:var(--green); color:#fff; font-size:11px; font-weight:900; border:2px solid var(--gold); }
        .dashboard-profile-avatar img { width:100%; height:100%; object-fit:cover; }
        .dashboard-camera { position:absolute; right:-1px; bottom:-1px; width:15px; height:15px; display:grid; place-items:center; border-radius:50%; background:var(--gold); color:#fff; font-size:8px; border:1px solid #fff; }
        .dashboard-profile-text { min-width:0; display:flex; flex-direction:column; align-items:flex-start; }
        .dashboard-profile-text strong { max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#344139; font-size:12px; }
        .dashboard-profile-text small { margin-top:3px; color:var(--green); font-size:10px; font-weight:750; }
        .dashboard-profile-arrow { color:#7b8780; font-size:9px; }
        .dashboard-content-wrapper { width:100%; min-width:0; min-height:calc(100vh - 80px); }
        .dashboard-overlay { position:fixed; inset:0; z-index:1150; border:0; background:rgba(7,34,19,.48); cursor:pointer; }
        @media (max-width:1200px) { .dashboard-header-brand { display:none; } }
        @media (max-width:1100px) { .dashboard-sidebar { transform:translateX(-105%); } .dashboard-sidebar-open { transform:translateX(0); } .dashboard-sidebar-close { display:block; } .dashboard-main { width:100%; margin-left:0; } .dashboard-menu-button { display:inline-flex; } .dashboard-header { padding:10px 18px; } }
        @media (max-width:760px) { .dashboard-header { min-height:68px; gap:8px; padding:9px 12px; } .dashboard-header-title h1 { font-size:19px; } .dashboard-country-line { font-size:9px; } .dashboard-header-title p, .dashboard-weather { display:none; } .dashboard-header-actions { gap:5px; } .dashboard-header-icon { width:38px; height:38px; flex-basis:38px; font-size:17px; } .dashboard-profile { min-height:38px; padding:0; border:0; } .dashboard-profile-text, .dashboard-profile-arrow { display:none; } .dashboard-profile-avatar { width:38px; height:38px; flex-basis:38px; } .dashboard-content-wrapper { min-height:calc(100vh - 68px); } }
        @media (max-width:430px) { .dashboard-sidebar { width:min(88vw,320px); } .dashboard-menu-button { width:38px; height:38px; flex-basis:38px; font-size:18px; } .dashboard-header-title h1 { font-size:17px; } .dashboard-header-icon { width:36px; height:36px; flex-basis:36px; } .dashboard-profile-avatar { width:36px; height:36px; flex-basis:36px; } }
        @media (prefers-reduced-motion:reduce) { .dashboard-sidebar, .dashboard-nav-item { transition:none; } }
      `}</style>
    </div>
  );
}

function FallbackNavigation({ activeSection, onSectionChange, onNavigate }) {
  const items = [
    ["overview", "⌂", "Dashboard"], ["elections", "◉", "Elections"], ["results", "▣", "Results"], ["analytics", "◫", "Analytics"], ["reports", "◌", "Reports"], ["tasks", "✓", "Tasks & Reminders"], ["ai-analyzer", "◉", "AI Analyzer"], ["ai-assistant", "✦", "AI Personal Assistant"], ["messages", "☷", "Messages"], ["notifications", "🔔", "Notifications"], ["profile", "♙", "Profile"], ["privacy-security", "⚙", "Privacy & Security"], ["help", "?", "Help & Support"],
  ];
  return <><div className="dashboard-nav-section">WORKSPACE</div>{items.map(([key, icon, label]) => { const active = activeSection === key; return <a key={key} href="#" className={`dashboard-nav-item ${active ? "dashboard-nav-item-active" : ""}`} aria-current={active ? "page" : undefined} onClick={(event) => { event.preventDefault(); onSectionChange?.(key); onNavigate?.(); }}><span className="dashboard-nav-icon" aria-hidden="true">{icon}</span><span className="dashboard-nav-label">{label}</span></a>; })}</>;
}

function getStoredToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token");
}

function getStoredUser() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem("polisync_user") || sessionStorage.getItem("polisync_user") || "null"); } catch { return null; }
}

function saveStoredUser(user) {
  if (typeof window === "undefined") return;
  const remember = localStorage.getItem("polisync_remember") === "true";
  const target = remember ? localStorage : sessionStorage;
  target.setItem("polisync_user", JSON.stringify(user));
}

function resizeImage(file, maxSize = 400, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function countryCodeToFlag(code) {
  if (!/^[A-Z]{2}$/.test(code)) return "🌍";
  return String.fromCodePoint(...[...code].map((letter) => 127397 + letter.charCodeAt(0)));
}

function weatherCodeToText(code) {
  const map = { 0:"Clear sky", 1:"Mainly clear", 2:"Partly cloudy", 3:"Overcast", 45:"Fog", 48:"Depositing rime fog", 51:"Light drizzle", 53:"Drizzle", 55:"Heavy drizzle", 61:"Light rain", 63:"Rain", 65:"Heavy rain", 71:"Light snow", 73:"Snow", 75:"Heavy snow", 80:"Rain showers", 81:"Rain showers", 82:"Heavy rain showers", 95:"Thunderstorm", 96:"Thunderstorm with hail", 99:"Thunderstorm with hail" };
  return map[Number(code)] || "Current conditions";
}

function weatherToIcon(condition) {
  const value = String(condition || "").toLowerCase();
  if (value.includes("thunder")) return "⛈️";
  if (value.includes("rain") || value.includes("drizzle") || value.includes("shower")) return "🌧️";
  if (value.includes("cloud") || value.includes("overcast") || value.includes("fog")) return "☁️";
  if (value.includes("snow")) return "❄️";
  return "☀️";
}

function formatRole(role) {
  if (!role) return "User";
  return String(role).replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getInitials(value) {
  const words = String(value || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "U";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}
