const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AuthSession = require("../models/AuthSession");

const MAX_AUTH_SESSION_MS = 7 * 24 * 60 * 60 * 1000;

const createMigratedSession = async (user, req) => {
  const sessionId = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + MAX_AUTH_SESSION_MS);
  return AuthSession.create({ sessionId, userId: user._id, expiresAt, ipAddress: req.ip || null, userAgent: req.get("user-agent") || null, lastSeenAt: now });
};

const protect = async (req, res, next) => {
  try {
    const authorization = String(req.headers.authorization || "");
    if (!authorization.startsWith("Bearer ")) return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    const token = authorization.substring(7).trim();
    if (!token) return res.status(401).json({ success: false, message: "Authentication token is missing." });
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) return res.status(500).json({ success: false, message: "Authentication service is not properly configured." });
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (!decoded.userId || typeof decoded.userId !== "string") return res.status(401).json({ success: false, code: "SESSION_INVALID", message: "This security session is no longer valid. Please log in again." });
    if (!decoded.iat || Date.now() - decoded.iat * 1000 >= MAX_AUTH_SESSION_MS) return res.status(401).json({ success: false, code: "SESSION_EXPIRED", message: "Your seven-day security session has expired. Please log in again." });

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(401).json({ success: false, message: "User not found." });
    if (["suspended", "deactivated", "rejected"].includes(user.accountStatus)) return res.status(403).json({ success: false, message: `This account has been ${user.accountStatus}.` });
    if (user.accountStatus !== "approved") return res.status(403).json({ success: false, message: "This account is not approved for platform access." });
    if (!["user", "super_admin"].includes(user.platformRole)) return res.status(403).json({ success: false, message: "This account has an invalid platform role." });

    let session;
    if (decoded.sessionId && typeof decoded.sessionId === "string") {
      session = await AuthSession.findOne({ sessionId: decoded.sessionId, userId: decoded.userId, revokedAt: null, expiresAt: { $gt: new Date() } });
      if (!session) return res.status(401).json({ success: false, code: "SESSION_REVOKED", message: "This security session has been revoked or expired. Please log in again." });
    } else {
      session = await createMigratedSession(user, req);
    }

    session.lastSeenAt = new Date();
    await session.save();
    req.user = user;
    req.auth = { userId: user._id.toString(), platformRole: user.platformRole, isSuperAdmin: user.platformRole === "super_admin", sessionId: session.sessionId };
    return next();
  } catch (error) { return res.status(401).json({ success: false, message: "Invalid or expired token." }); }
};
const authorize = (...roles) => (req, res, next) => { if (!req.user || !roles.includes(req.user.platformRole)) return res.status(403).json({ success: false, message: "You do not have permission to perform this action." }); return next(); };
module.exports = { MAX_AUTH_SESSION_MS, protect, authorize };
