const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AuthSession = require("../models/AuthSession");
const { isCanonicalSuperAdminIdentity } = require("../services/superAdminIdentityService");

const MAX_AUTH_SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const JWT_ALGORITHMS = ["HS256"];

const createMigratedSession = async (user, req) => {
  const sessionId = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + MAX_AUTH_SESSION_MS);
  return AuthSession.create({ sessionId, userId: user._id, expiresAt, ipAddress: req.ip || null, userAgent: req.get("user-agent") || null, lastSeenAt: now });
};

const authenticate = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || "";
    if (!authorization.startsWith("Bearer ")) return res.status(401).json({ success: false, message: "Authentication required." });
    const token = authorization.substring(7).trim();
    if (!token) return res.status(401).json({ success: false, message: "Authentication token is missing." });
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) return res.status(500).json({ success: false, message: "Authentication service is not properly configured." });
    let decoded;
    try { decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: JWT_ALGORITHMS }); } catch { return res.status(401).json({ success: false, message: "Your authentication session is invalid or expired." }); }
    if (!decoded.userId || typeof decoded.userId !== "string") return res.status(401).json({ success: false, code: "SESSION_INVALID", message: "This security session is no longer valid. Please log in again." });
    if (!decoded.iat || Date.now() - decoded.iat * 1000 >= MAX_AUTH_SESSION_MS) return res.status(401).json({ success: false, code: "SESSION_EXPIRED", message: "Your seven-day security session has expired. Please log in again." });

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ success: false, message: "User account no longer exists." });

    // The canonical PoliSync Africa identity can never be downgraded by
    // ordinary account or organization-role management. Repair the stored
    // platform role before authorization is calculated.
    if (isCanonicalSuperAdminIdentity(user) && user.platformRole !== "super_admin") {
      user.platformRole = "super_admin";
      user.accountStatus = "approved";
      user.emailVerified = true;
      user.phoneVerified = true;
      await user.save();
    }

    if (["suspended", "deactivated", "rejected"].includes(user.accountStatus)) return res.status(403).json({ success: false, message: `This account has been ${user.accountStatus}.` });
    if (user.accountStatus !== "approved") return res.status(403).json({ success: false, message: "This account is not approved for platform access." });
    const isSuperAdmin = user.platformRole === "super_admin";
    if (!isSuperAdmin && user.platformRole !== "user") return res.status(403).json({ success: false, message: "This account has an invalid platform role." });

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
    req.auth = { userId: user._id.toString(), platformRole: user.platformRole, isSuperAdmin, sessionId: session.sessionId };
    return next();
  } catch (error) { console.error("PoliSync authentication middleware error:", error); return res.status(500).json({ success: false, message: "Authentication service error." }); }
};
const requireSuperAdmin = (req, res, next) => { if (!req.auth || req.auth.platformRole !== "super_admin") return res.status(403).json({ success: false, message: "Super Admin authorization is required." }); return next(); };
const requirePlatformUser = (req, res, next) => { if (!req.auth) return res.status(401).json({ success: false, message: "Authentication required." }); return next(); };
module.exports = { MAX_AUTH_SESSION_MS, JWT_ALGORITHMS, authenticate, requireSuperAdmin, requirePlatformUser };
