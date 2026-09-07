"use client";
import { useEffect, useRef, useState } from "react";
import { useRealtimeCall } from "./RealtimeCallProvider";

export default function MobileCallLauncher() {
  const { startCall, call } = useRealtimeCall();
  const [open, setOpen] = useState(false), [query, setQuery] = useState(""), [users, setUsers] = useState([]), [loading, setLoading] = useState(false), [error, setError] = useState("");
  const timer = useRef(null);
  const api = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  const token = () => typeof window !== "undefined" ? (localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || "") : "";
  const search = async value => {
    const q = value.trim(); if (!q) { setUsers([]); setLoading(false); return; }
    setLoading(true); setError("");
    try { const r = await fetch(`${api}/api/messages/users?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token()}` }, cache: "no-store" }); const d = await r.json(); if (!r.ok || !d.success) throw new Error(d.message || "Unable to search users."); setUsers(Array.isArray(d.users) ? d.users : []); } catch (e) { setUsers([]); setError(e.message || "Unable to search users."); } finally { setLoading(false); }
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  if (call) return null;
  return <>
    <button className="dialFab" onClick={() => setOpen(true)} aria-label="Start a PoliSync voice or video call">☎</button>
    {open && <div className="dialBackdrop" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section className="dialCard" role="dialog" aria-modal="true" aria-label="Start a call">
        <header><div><small>SECURE COMMUNICATION</small><h2>Start a call</h2></div><button onClick={() => setOpen(false)} aria-label="Close">×</button></header>
        <input autoFocus value={query} onChange={e => { const v = e.target.value; setQuery(v); clearTimeout(timer.current); timer.current = setTimeout(() => search(v), 220); }} placeholder="Search name or username" />
        {loading && <p className="dialState">Searching…</p>}{error && <p className="dialError">{error}</p>}{!loading && !error && query.trim() && !users.length && <p className="dialState">No approved users found.</p>}
        <div className="dialUsers">{users.map(u => <div className="dialUser" key={u.id}><div><b>{u.displayName || [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username}</b><small>@{u.username}</small></div><div className="dialActions"><button disabled={u.messagePrivacy === "nobody"} onClick={() => { setOpen(false); startCall(u, "voice"); }}>Voice</button><button disabled={u.messagePrivacy === "nobody"} onClick={() => { setOpen(false); startCall(u, "video"); }}>Video</button></div></div>)}</div>
        <p className="dialNote">Calls require microphone access. Video calls additionally require camera access.</p>
      </section>
      <style jsx>{`.dialFab{position:fixed;right:18px;bottom:18px;z-index:2200;width:52px;height:52px;border:0;border-radius:50%;background:#075f2b;color:#fff;font-size:22px;box-shadow:0 10px 28px rgba(7,95,43,.28)}.dialBackdrop{position:fixed;inset:0;z-index:2199;display:flex;align-items:flex-end;justify-content:flex-end;padding:82px 18px 82px;background:rgba(3,20,11,.18);backdrop-filter:blur(3px)}.dialCard{width:min(440px,100%);max-height:min(620px,80dvh);overflow:auto;padding:18px;border-radius:18px;background:#fff;border:1px solid #dce5df;box-shadow:0 24px 70px rgba(0,0,0,.2)}.dialCard header{display:flex;justify-content:space-between;align-items:flex-start}.dialCard header small{font-size:8px;color:#c9a227;font-weight:900;letter-spacing:1px}.dialCard h2{margin:4px 0 14px;color:#075f2b;font-size:20px}.dialCard header button{width:34px;height:34px;border:1px solid #dce5df;border-radius:9px;background:#fff;font-size:20px}.dialCard>input{width:100%;box-sizing:border-box;padding:12px;border:1px solid #dce5df;border-radius:10px}.dialUsers{display:grid;gap:8px;margin-top:12px}.dialUser{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px;border:1px solid #e5ece7;border-radius:10px}.dialUser b,.dialUser small{display:block}.dialUser small{margin-top:2px;color:#7a857e;font-size:10px}.dialActions{display:flex;gap:6px}.dialActions button{padding:8px 10px;border:1px solid #b9d4c1;border-radius:8px;background:#f1f8f3;color:#075f2b;font-weight:800}.dialActions button:disabled{opacity:.45}.dialState,.dialError,.dialNote{font-size:11px;color:#707b74}.dialError{color:#a33d16}.dialNote{margin:14px 0 0;line-height:1.45}@media(max-width:640px){.dialFab{right:14px;bottom:calc(14px + env(safe-area-inset-bottom))}.dialBackdrop{padding:0 0 calc(78px + env(safe-area-inset-bottom));align-items:flex-end}.dialCard{width:100%;border-radius:18px 18px 0 0;max-height:78dvh}}`}</style>
    </div>}
  </>;
}
