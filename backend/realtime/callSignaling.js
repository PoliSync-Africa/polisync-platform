const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AuthSession = require("../models/AuthSession");

const activeSockets = new Map();
const calls = new Map();

const allowedOrigins = () => ["https://polisync-app.onrender.com", String(process.env.FRONTEND_URL || "").trim().replace(/\/$/, "")].filter(Boolean);

async function authenticateSocket(socket, next) {
  try {
    const raw = socket.handshake.auth?.token || String(socket.handshake.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!raw || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) return next(new Error("Authentication required"));
    const decoded = jwt.verify(raw, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (!decoded.userId || !decoded.sessionId) return next(new Error("Invalid session"));
    const session = await AuthSession.findOne({ sessionId: decoded.sessionId, userId: decoded.userId, revokedAt: null, expiresAt: { $gt: new Date() } });
    if (!session) return next(new Error("Session expired"));
    const user = await User.findById(decoded.userId).select("_id username displayName firstName lastName accountStatus platformRole privacy.messagePrivacy");
    if (!user || user.accountStatus !== "approved") return next(new Error("Account unavailable"));
    socket.user = user;
    socket.sessionId = decoded.sessionId;
    next();
  } catch { next(new Error("Authentication failed")); }
}

const publicUser = (u) => ({ id: u._id.toString(), username: u.username, displayName: u.displayName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username });
const socketFor = (userId) => activeSockets.get(String(userId));
const canReceiveCall = (recipient) => (recipient.privacy?.messagePrivacy || "nobody") !== "nobody";

function installCallSignaling(server) {
  const io = new Server(server, { cors: { origin: allowedOrigins(), methods: ["GET", "POST"], allowedHeaders: ["Authorization"], credentials: false }, transports: ["websocket", "polling"] });
  io.use(authenticateSocket);
  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    activeSockets.set(userId, socket.id);
    socket.emit("call:ready", { userId });

    socket.on("call:start", async ({ recipientId, type, offer }, ack = () => {}) => {
      try {
        if (!recipientId || !["voice", "video"].includes(type) || !offer?.type || !offer?.sdp) return ack({ success: false, message: "Invalid call request." });
        if (String(recipientId) === userId) return ack({ success: false, message: "You cannot call yourself." });
        const recipient = await User.findById(recipientId).select("_id username displayName firstName lastName accountStatus privacy.messagePrivacy");
        if (!recipient || recipient.accountStatus !== "approved" || !canReceiveCall(recipient)) return ack({ success: false, message: "This user is not available for calls." });
        const recipientSocket = socketFor(recipientId);
        if (!recipientSocket) return ack({ success: false, code: "USER_OFFLINE", message: "This user is currently offline." });
        const callId = require("crypto").randomUUID();
        calls.set(callId, { callId, callerId: userId, recipientId: String(recipientId), type, status: "ringing", createdAt: Date.now() });
        io.to(recipientSocket).emit("call:incoming", { callId, type, offer, caller: publicUser(socket.user) });
        ack({ success: true, callId });
      } catch { ack({ success: false, message: "Unable to start the call." }); }
    });

    socket.on("call:answer", ({ callId, answer }, ack = () => {}) => {
      const call = calls.get(callId);
      if (!call || call.recipientId !== userId || !answer?.type || !answer?.sdp) return ack({ success: false, message: "Invalid call." });
      call.status = "connected";
      const callerSocket = socketFor(call.callerId);
      if (callerSocket) io.to(callerSocket).emit("call:answered", { callId, answer, recipient: publicUser(socket.user) });
      ack({ success: true });
    });

    socket.on("call:ice", ({ callId, candidate }) => {
      const call = calls.get(callId); if (!call || !candidate) return;
      const otherId = call.callerId === userId ? call.recipientId : call.recipientId === userId ? call.callerId : null;
      const target = otherId && socketFor(otherId); if (target) io.to(target).emit("call:ice", { callId, candidate });
    });

    const endCall = ({ callId, reason = "ended" } = {}) => {
      const call = calls.get(callId); if (!call || (call.callerId !== userId && call.recipientId !== userId)) return;
      const otherId = call.callerId === userId ? call.recipientId : call.callerId;
      const target = socketFor(otherId); if (target) io.to(target).emit("call:ended", { callId, reason });
      calls.delete(callId);
    };
    socket.on("call:decline", ({ callId }) => endCall({ callId, reason: "declined" }));
    socket.on("call:end", endCall);

    socket.on("disconnect", () => {
      if (activeSockets.get(userId) === socket.id) activeSockets.delete(userId);
      for (const [callId, call] of calls.entries()) if (call.callerId === userId || call.recipientId === userId) endCall({ callId, reason: "disconnected" });
    });
  });
  return io;
}

module.exports = { installCallSignaling };
