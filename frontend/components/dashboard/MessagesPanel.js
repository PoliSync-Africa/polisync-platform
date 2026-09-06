"use client";
import { useEffect, useMemo, useState } from "react";

export default function MessagesPanel() {
  const [messages, setMessages] = useState([]);
  const [sent, setSent] = useState([]);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [recipient, setRecipient] = useState(null);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const [forwarding, setForwarding] = useState(null);
  const [forwardQuery, setForwardQuery] = useState("");
  const [forwardUsers, setForwardUsers] = useState([]);
  const [forwardRecipients, setForwardRecipients] = useState([]);
  const [forwardStatus, setForwardStatus] = useState("");
  const [forwardBusy, setForwardBusy] = useState(false);

  const api = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  const token = () => typeof window !== "undefined" ? (localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || "") : "";

  const load = async () => {
    try {
      const r = await fetch(`${api}/api/messages/inbox`, { headers: { Authorization: `Bearer ${token()}` } });
      const d = await r.json();
      if (d.success) { setMessages(d.messages || []); setSent(d.sent || []); }
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const searchUsers = async (value, setter) => {
    if (!value.trim()) return setter([]);
    try {
      const r = await fetch(`${api}/api/messages/users?q=${encodeURIComponent(value.trim())}`, { headers: { Authorization: `Bearer ${token()}` } });
      const d = await r.json();
      setter(d.users || []);
    } catch { setter([]); }
  };

  const search = () => searchUsers(query, setUsers);

  const send = async () => {
    if (!recipient || !body.trim()) return;
    try {
      const r = await fetch(`${api}/api/messages`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: JSON.stringify({ recipientId: recipient.id, body: body.trim() }) });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.message || "Message could not be sent.");
      setBody(""); setRecipient(null); setQuery(""); setUsers([]); setStatus("Message sent securely."); load();
    } catch (e) { setStatus(e.message); }
  };

  const displayName = (user) => user?.displayName || user?.username || "User";
  const messageText = (message) => String(message?.body || "");

  const allForwardable = useMemo(() => [...messages, ...sent], [messages, sent]);

  const openForward = (message) => {
    setForwarding(message);
    setForwardQuery("");
    setForwardUsers([]);
    setForwardRecipients([]);
    setForwardStatus("");
  };

  const toggleForwardRecipient = (user) => {
    setForwardRecipients((current) => current.some((x) => String(x.id) === String(user.id)) ? current.filter((x) => String(x.id) !== String(user.id)) : [...current, user]);
  };

  const forward = async () => {
    if (!forwarding || !forwardRecipients.length || forwardBusy) return;
    setForwardBusy(true); setForwardStatus("");
    try {
      const r = await fetch(`${api}/api/messages/forward`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: JSON.stringify({ messageId: forwarding._id, recipientIds: forwardRecipients.map((u) => u.id) }) });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.message || "Message could not be forwarded.");
      const rejectedText = d.rejected?.length ? ` ${d.rejected.length} recipient${d.rejected.length === 1 ? " was" : "s were"} skipped because of privacy settings.` : "";
      setForwardStatus(`${d.forwardedCount} recipient${d.forwardedCount === 1 ? "" : "s"} received the forwarded message.${rejectedText}`);
      setForwardRecipients([]); setForwardUsers([]); setForwardQuery(""); load();
      setTimeout(() => setForwarding(null), 1200);
    } catch (e) { setForwardStatus(e.message); }
    finally { setForwardBusy(false); }
  };

  return <section className="messages">
    <header className="messagesHeader">
      <div><small className="eyebrow">PRIVATE COMMUNICATION</small><h2>Communications</h2><p>Secure messaging across phones, tablets and computers.</p></div>
      <button className="refresh" onClick={load} aria-label="Refresh messages">↻</button>
    </header>

    <div className="compose">
      <div className="searchRow">
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && search()} placeholder="Search name or username" aria-label="Search recipient" />
        <button onClick={search}>Search</button>
      </div>
      {users.length > 0 && <div className="results">{users.map(u => <button key={u.id} onClick={() => { setRecipient(u); setUsers([]); }}>{displayName(u)} <small>@{u.username}</small></button>)}</div>}
      {recipient && <><div className="recipient">To: <b>{displayName(recipient)}</b><button onClick={() => setRecipient(null)} aria-label="Remove recipient">×</button></div><textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message…" maxLength={10000}/><button className="send" onClick={send}>Send message</button></>}
    </div>

    <div className="list">
      <div className="sectionTitle"><h3>Inbox</h3><span>{messages.length}</span></div>
      {messages.length ? messages.map(m => <article key={`in-${m._id}`}>
        <div className="messageMeta"><b>{displayName(m.sender)}</b><small>{new Date(m.createdAt).toLocaleString()}</small></div>
        {m.forwardedFrom && <div className="forwardedLabel">↗ Forwarded message</div>}
        <p>{messageText(m)}</p>
        <button className="messageAction" onClick={() => openForward(m)}>↗ Forward</button>
      </article>) : <p className="empty">No messages yet.</p>}

      <div className="sectionTitle sentTitle"><h3>Sent</h3><span>{sent.length}</span></div>
      {sent.length ? sent.map(m => <article key={`out-${m._id}`}>
        <div className="messageMeta"><b>To {displayName(m.recipient)}</b><small>{new Date(m.createdAt).toLocaleString()}</small></div>
        {m.forwardedFrom && <div className="forwardedLabel">↗ Forwarded message</div>}
        <p>{messageText(m)}</p>
        <button className="messageAction" onClick={() => openForward(m)}>↗ Forward</button>
      </article>) : <p className="empty">No sent messages yet.</p>}
    </div>

    {status && <div className="statusMessage">{status}</div>}

    {forwarding && <div className="forwardOverlay" role="dialog" aria-modal="true" aria-label="Forward message">
      <div className="forwardModal">
        <div className="forwardHeader"><div><small className="eyebrow">MESSAGE ACTION</small><h3>Forward message</h3></div><button className="close" onClick={() => setForwarding(null)} aria-label="Close">×</button></div>
        <div className="preview">{messageText(forwarding)}</div>
        <div className="forwardSearch"><input value={forwardQuery} onChange={e => { setForwardQuery(e.target.value); searchUsers(e.target.value, setForwardUsers); }} onKeyDown={e => e.key === "Enter" && searchUsers(forwardQuery, setForwardUsers)} placeholder="Find one or more people…" aria-label="Find forwarding recipients" /></div>
        {forwardUsers.length > 0 && <div className="forwardResults">{forwardUsers.map(u => { const selected = forwardRecipients.some(x => String(x.id) === String(u.id)); return <button className={selected ? "selected" : ""} key={u.id} onClick={() => toggleForwardRecipient(u)}><span>{displayName(u)}</span><small>@{u.username}</small>{selected && <b>✓</b>}</button>; })}</div>}
        {forwardRecipients.length > 0 && <div className="chips">{forwardRecipients.map(u => <button key={u.id} onClick={() => toggleForwardRecipient(u)}>{displayName(u)} ×</button>)}</div>}
        <div className="forwardFooter"><span>{forwardRecipients.length} selected</span><button className="cancel" onClick={() => setForwarding(null)}>Cancel</button><button className="forwardButton" disabled={!forwardRecipients.length || forwardBusy} onClick={forward}>{forwardBusy ? "Forwarding…" : "Forward message"}</button></div>
        {forwardStatus && <div className="statusMessage">{forwardStatus}</div>}
      </div>
    </div>}

    <style jsx>{`
      .messages{width:100%;box-sizing:border-box;padding:22px;border:1px solid #e3ebe5;border-radius:18px;background:#fff;box-shadow:0 8px 24px rgba(17,65,36,.05);overflow:hidden}
      .messagesHeader{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.eyebrow{color:#c9a227;font-size:8px;font-weight:900;letter-spacing:1px}.messages h2{margin:4px 0;color:#075f2b;font-size:20px}.messagesHeader p{margin:3px 0;color:#818a84;font-size:11px}.refresh,.close{width:34px;height:34px;border:1px solid #dce5df;border-radius:9px;background:#fff;cursor:pointer}.compose{position:relative;margin-top:18px;padding-top:16px;border-top:1px solid #edf1ee}.searchRow{display:flex;gap:8px}.compose input,.forwardSearch input{width:100%;min-width:0;box-sizing:border-box;padding:11px 12px;border:1px solid #dce5df;border-radius:9px;outline:none}.searchRow input{flex:1}.searchRow button,.send,.forwardButton{padding:10px 14px;border:0;border-radius:9px;background:#075f2b;color:#fff;font-weight:700;cursor:pointer}.results{position:absolute;z-index:10;top:66px;left:0;right:78px;max-height:240px;overflow:auto;background:#fff;border:1px solid #dce5df;border-radius:10px;box-shadow:0 10px 24px rgba(0,0,0,.08)}.results button,.forwardResults button{display:flex;align-items:center;gap:7px;width:100%;padding:11px;border:0;border-bottom:1px solid #eef1ef;background:#fff;text-align:left;cursor:pointer}.results small,.forwardResults small{color:#8a938d}.recipient{margin-top:10px;width:100%;box-sizing:border-box;padding:9px 11px;background:#eef8f1;border-radius:9px;font-size:11px}.recipient button{float:right;border:0;background:transparent;font-size:18px;cursor:pointer}.compose textarea{display:block;width:100%;box-sizing:border-box;min-height:90px;margin-top:9px;padding:11px;border:1px solid #dce5df;border-radius:9px;resize:vertical;font:inherit}.compose .send{display:block;margin:9px 0 0 auto}.list{margin-top:22px;border-top:1px solid #edf1ee;padding-top:16px}.sectionTitle{display:flex;align-items:center;gap:7px}.sectionTitle h3{margin:0;color:#344139;font-size:13px}.sectionTitle span{min-width:20px;padding:2px 6px;border-radius:999px;background:#eef8f1;color:#075f2b;text-align:center;font-size:9px}.sentTitle{margin-top:24px}.list article{padding:12px 2px;border-bottom:1px solid #f0f3f1}.messageMeta{display:flex;justify-content:space-between;gap:12px}.messageMeta b{font-size:11px;color:#445149}.messageMeta small{color:#929b95;font-size:8px;white-space:nowrap}.list article p{margin:6px 0;color:#5d6861;font-size:11px;white-space:pre-wrap;overflow-wrap:anywhere}.forwardedLabel{margin-top:7px;color:#8b7020;font-size:9px;font-weight:700}.messageAction{padding:6px 8px;border:1px solid #dce5df;border-radius:7px;background:#fff;color:#075f2b;font-size:9px;font-weight:700;cursor:pointer}.empty{color:#929b95;font-size:10px}.statusMessage{margin-top:12px;padding:9px 10px;border-radius:8px;background:#eef8f1;color:#267043;font-size:10px}.forwardOverlay{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;background:rgba(8,35,20,.48);backdrop-filter:blur(4px)}.forwardModal{width:min(560px,100%);max-height:min(720px,92vh);overflow:auto;box-sizing:border-box;padding:18px;border-radius:16px;background:#fff;box-shadow:0 20px 60px rgba(0,0,0,.2)}.forwardHeader{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.forwardHeader h3{margin:4px 0 12px;color:#075f2b;font-size:18px}.preview{padding:11px;margin-bottom:12px;border-left:3px solid #c9a227;border-radius:8px;background:#f7f9f7;color:#5d6861;font-size:11px;white-space:pre-wrap;overflow-wrap:anywhere;max-height:140px;overflow:auto}.forwardResults{margin-top:7px;max-height:220px;overflow:auto;border:1px solid #e3ebe5;border-radius:9px}.forwardResults button{position:relative}.forwardResults button.selected{background:#eef8f1}.forwardResults button b{margin-left:auto;color:#075f2b}.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.chips button{padding:6px 8px;border:1px solid #cfe0d4;border-radius:999px;background:#eef8f1;color:#075f2b;font-size:9px;cursor:pointer}.forwardFooter{display:flex;align-items:center;gap:7px;margin-top:15px}.forwardFooter span{margin-right:auto;color:#737d77;font-size:10px}.cancel{padding:10px 12px;border:1px solid #dce5df;border-radius:9px;background:#fff;cursor:pointer}.forwardButton:disabled{opacity:.5;cursor:not-allowed}
      @media(max-width:640px){.messages{padding:14px;border-radius:14px}.messages h2{font-size:18px}.messagesHeader p{font-size:10px}.searchRow{display:grid;grid-template-columns:1fr}.searchRow button,.compose .send{width:100%;margin-top:0}.results{top:105px;right:0}.messageMeta{align-items:flex-start;flex-direction:column;gap:3px}.messageMeta small{white-space:normal}.forwardOverlay{padding:8px;align-items:flex-end}.forwardModal{width:100%;max-height:88vh;border-radius:16px 16px 10px 10px;padding:15px}.forwardFooter{flex-wrap:wrap}.forwardFooter span{width:100%;margin-bottom:2px}.cancel,.forwardButton{flex:1}.preview{max-height:110px}}
      @media(min-width:641px) and (max-width:1024px){.messages{padding:18px}.forwardModal{max-width:600px}}
      @media(min-width:1025px){.messages{max-width:100%;}.forwardModal{max-width:620px}}
      @media(pointer:coarse){button,input,textarea{font-size:16px}.messageAction{font-size:12px;padding:8px 10px}}
    `}</style>
  </section>;
}
