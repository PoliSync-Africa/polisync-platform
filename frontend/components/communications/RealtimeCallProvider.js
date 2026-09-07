"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const CallContext = createContext(null);
const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }];
const CALL_TIMEOUT_MS = 45000;

export const useRealtimeCall = () => useContext(CallContext);

export default function RealtimeCallProvider({ children }) {
  const [call, setCall] = useState(null), [muted, setMuted] = useState(false), [cameraOff, setCameraOff] = useState(false), [error, setError] = useState("");
  const socketRef = useRef(null), pcRef = useRef(null), localRef = useRef(null), pendingCandidates = useRef([]), outgoingCandidates = useRef([]), activeCallId = useRef(null), timeoutRef = useRef(null);
  const api = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  const token = () => typeof window !== "undefined" ? (localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || "") : "";

  const clearTimeoutRef = useCallback(() => { if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; } }, []);
  const stopMedia = useCallback(() => { localRef.current?.getTracks().forEach(t => t.stop()); localRef.current = null; pcRef.current?.close(); pcRef.current = null; pendingCandidates.current = []; outgoingCandidates.current = []; activeCallId.current = null; clearTimeoutRef(); }, [clearTimeoutRef]);
  const finish = useCallback((reason = "ended", notify = true) => { const id = activeCallId.current || call?.callId; if (notify && id) socketRef.current?.emit("call:end", { callId: id, reason }); stopMedia(); setCall(null); setMuted(false); setCameraOff(false); }, [call, stopMedia]);

  const createPeer = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = e => {
      if (!e.candidate) return;
      const id = activeCallId.current;
      if (id) socketRef.current?.emit("call:ice", { callId: id, candidate: e.candidate });
      else outgoingCandidates.current.push(e.candidate);
    };
    pc.ontrack = e => setCall(c => c ? { ...c, remoteStream: e.streams[0], status: "connected" } : c);
    pc.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
        if (pc.connectionState === "failed") setError("Call connection failed. Check your network and try again.");
        stopMedia(); setCall(null);
      } else if (pc.connectionState === "connected") setCall(c => c ? { ...c, status: "connected" } : c);
    };
    pcRef.current = pc;
    return pc;
  }, [stopMedia]);

  const getMedia = async type => {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera and microphone access is not supported on this device.");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === "video" ? { facingMode: "user" } : false });
    localRef.current = stream; return stream;
  };

  const armTimeout = useCallback(() => {
    clearTimeoutRef();
    timeoutRef.current = setTimeout(() => { setError("Call timed out. The other user did not answer."); finish("timeout", true); }, CALL_TIMEOUT_MS);
  }, [clearTimeoutRef, finish]);

  const startCall = useCallback(async (recipient, type = "voice") => {
    setError("");
    try {
      if (!recipient?.id) throw new Error("Select a user before calling.");
      if (!socketRef.current?.connected) throw new Error("Calling service is not connected.");
      if (type !== "voice" && type !== "video") throw new Error("Unsupported call type.");
      const stream = await getMedia(type);
      const pc = createPeer();
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
      socketRef.current.emit("call:start", { recipientId: recipient.id, type, offer: pc.localDescription }, result => {
        if (!result?.success) { stopMedia(); setCall(null); setError(result?.message || "Unable to start call."); return; }
        activeCallId.current = result.callId;
        outgoingCandidates.current.splice(0).forEach(candidate => socketRef.current?.emit("call:ice", { callId: result.callId, candidate }));
        setCall(c => ({ ...(c || {}), callId: result.callId, type, peer: recipient, direction: "outgoing", status: "ringing", localStream: stream }));
        armTimeout();
      });
      setCall({ callId: null, type, peer: recipient, direction: "outgoing", status: "calling", localStream: stream });
    } catch (e) { stopMedia(); setCall(null); setError(e.message || "Camera or microphone access failed."); }
  }, [createPeer, armTimeout, stopMedia]);

  const answer = useCallback(async () => {
    if (!call?.incomingOffer || !call.callId) return;
    setError(""); clearTimeoutRef(); activeCallId.current = call.callId;
    try {
      const stream = await getMedia(call.type); const pc = createPeer();
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      await pc.setRemoteDescription(call.incomingOffer);
      for (const c of pendingCandidates.current.splice(0)) await pc.addIceCandidate(c);
      const answerDescription = await pc.createAnswer(); await pc.setLocalDescription(answerDescription);
      socketRef.current.emit("call:answer", { callId: call.callId, answer: pc.localDescription }, r => { if (!r?.success) { finish("failed", false); setError(r?.message || "Unable to answer call."); } });
      setCall(c => ({ ...c, status: "connecting", localStream: stream }));
    } catch (e) { finish("failed", false); setError(e.message || "Unable to access camera or microphone."); }
  }, [call, clearTimeoutRef, createPeer, finish]);

  const decline = useCallback(() => { if (call?.callId) socketRef.current?.emit("call:decline", { callId: call.callId }); stopMedia(); setCall(null); }, [call, stopMedia]);
  const toggleMute = () => { const track = localRef.current?.getAudioTracks()[0]; if (track) { track.enabled = !track.enabled; setMuted(!track.enabled); } };
  const toggleCamera = () => { const track = localRef.current?.getVideoTracks()[0]; if (track) { track.enabled = !track.enabled; setCameraOff(!track.enabled); } };
  const switchCamera = async () => {
    if (call?.type !== "video" || !localRef.current) return;
    try { const old = localRef.current.getVideoTracks()[0]; const current = old?.getSettings().facingMode; const fresh = await navigator.mediaDevices.getUserMedia({ video: { facingMode: current === "environment" ? "user" : "environment" }, audio: false }); const next = fresh.getVideoTracks()[0]; const sender = pcRef.current?.getSenders().find(s => s.track?.kind === "video"); if (sender) await sender.replaceTrack(next); old?.stop(); localRef.current.removeTrack(old); localRef.current.addTrack(next); setCall(c => c ? { ...c, localStream: new MediaStream(localRef.current.getTracks()) } : c); } catch { setError("Unable to switch camera."); }
  };

  useEffect(() => {
    const authToken = token(); if (!authToken || !api) return;
    const socket = io(api, { auth: { token: authToken }, transports: ["websocket", "polling"] }); socketRef.current = socket;
    socket.on("call:incoming", payload => setCall(current => { if (current) { socket.emit("call:decline", { callId: payload.callId }); return current; } activeCallId.current = payload.callId; armTimeout(); return { ...payload, peer: payload.caller, direction: "incoming", status: "ringing", incomingOffer: payload.offer }; }));
    socket.on("call:answered", async ({ callId, answer: remoteAnswer }) => { if (!pcRef.current) return; clearTimeoutRef(); try { activeCallId.current = callId; await pcRef.current.setRemoteDescription(remoteAnswer); for (const c of pendingCandidates.current.splice(0)) await pcRef.current.addIceCandidate(c); setCall(c => c && (!c.callId || c.callId === callId) ? { ...c, callId, status: "connecting" } : c); } catch { setError("Call connection failed."); } });
    socket.on("call:ice", async ({ candidate }) => { try { if (pcRef.current?.remoteDescription) await pcRef.current.addIceCandidate(candidate); else pendingCandidates.current.push(candidate); } catch {} });
    socket.on("call:declined", () => { setError("Call declined."); stopMedia(); setCall(null); });
    socket.on("call:ended", () => { stopMedia(); setCall(null); });
    socket.on("connect_error", e => setError(e.message === "Authentication failed" ? "Calling session expired. Please sign in again." : "Calling service unavailable."));
    return () => { socket.disconnect(); socketRef.current = null; stopMedia(); };
  }, [api, armTimeout, clearTimeoutRef, stopMedia]);

  return <CallContext.Provider value={{ call, error, startCall, answer, decline, endCall: () => finish("ended", true), toggleMute, toggleCamera, switchCamera, muted, cameraOff }}>{children}<CallOverlay call={call} error={error} answer={answer} decline={decline} endCall={() => finish("ended", true)} toggleMute={toggleMute} toggleCamera={toggleCamera} switchCamera={switchCamera} muted={muted} cameraOff={cameraOff}/></CallContext.Provider>;
}

function CallOverlay({ call, error, answer, decline, endCall, toggleMute, toggleCamera, switchCamera, muted, cameraOff }) {
  const localVideo = useRef(null), remoteVideo = useRef(null);
  useEffect(() => { if (localVideo.current && call?.localStream) localVideo.current.srcObject = call.localStream; if (remoteVideo.current && call?.remoteStream) remoteVideo.current.srcObject = call.remoteStream; }, [call?.localStream, call?.remoteStream]);
  if (!call && !error) return null;
  return <div className="callLayer">{call ? <div className={`callCard ${call.type}`}><div className="callTop"><b>{call.peer?.displayName || call.peer?.username || "PoliSync user"}</b><span>{call.status}</span></div>{call.type === "video" && <div className="videos"><video ref={remoteVideo} autoPlay playsInline className="remote"/><video ref={localVideo} autoPlay playsInline muted className="local"/></div>}{call.type === "voice" && <div className="voiceAvatar">☎</div>}<div className="controls">{call.direction === "incoming" && call.status === "ringing" ? <><button className="decline" onClick={decline}>Decline</button><button className="accept" onClick={answer}>Accept</button></> : <><button onClick={toggleMute}>{muted ? "Unmute" : "Mute"}</button>{call.type === "video" && <><button onClick={toggleCamera}>{cameraOff ? "Camera on" : "Camera off"}</button><button onClick={switchCamera}>Switch camera</button></>}<button className="decline" onClick={endCall}>End</button></>}</div></div> : <div className="callError">{error}<button onClick={() => window.location.reload()}>Dismiss</button></div>}<style jsx>{`.callLayer{position:fixed;inset:0;z-index:3000;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(2,20,11,.78);backdrop-filter:blur(8px)}.callCard{width:min(760px,100%);padding:18px;border-radius:22px;background:#071c10;color:#fff;box-shadow:0 30px 80px #0008}.callTop{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:14px}.callTop b{font-size:18px}.callTop span{font-size:11px;text-transform:capitalize;color:#b9c8be}.videos{position:relative;aspect-ratio:16/10;overflow:hidden;border-radius:16px;background:#020805}.remote{width:100%;height:100%;object-fit:cover}.local{position:absolute;right:12px;bottom:12px;width:min(28%,180px);aspect-ratio:3/4;object-fit:cover;border:2px solid #fff;border-radius:12px;background:#111}.voiceAvatar{display:grid;place-items:center;height:280px;font-size:68px}.controls{display:flex;justify-content:center;gap:9px;flex-wrap:wrap;margin-top:16px}.controls button,.callError button{min-width:82px;padding:11px 14px;border:0;border-radius:999px;background:#f0f5f1;color:#15351f;font-weight:800}.controls .decline{background:#c83232;color:#fff}.controls .accept{background:#168548;color:#fff}.callError{display:flex;gap:12px;align-items:center;padding:14px 18px;border-radius:12px;background:#fff;color:#9c2f2f}@media(max-width:640px){.callLayer{padding:0}.callCard{height:100dvh;width:100%;border-radius:0;box-sizing:border-box;display:flex;flex-direction:column}.videos{flex:1;aspect-ratio:auto}.voiceAvatar{flex:1}.controls{padding-bottom:max(8px,env(safe-area-inset-bottom))}}`}</style></div>;
}
