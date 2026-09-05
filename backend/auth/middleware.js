const jwt = require("jsonwebtoken");
const User = require("../models/User");

// PoliSync authentication middleware.
// Email verification is NOT an access requirement.
// Arkesel SMS OTP is the verification/security mechanism.
const MAX_AUTH_SESSION_MS = 24 * 60 * 60 * 1000;

const authenticate = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || "";
    if (!authorization.startsWith("Bearer ")) return res.status(401).json({ success: false, message: "Authentication required." });
    const token = authorization.substring(7).trim();
    if (!token) return res.status(401).json({ success: false, message: "Authentication token is missing." });
    if (!process.env.JWT_SECRET) return res.status(500).json({ success: false, message: "Authentication service is not properly configured." });

    let decoded;
    try { decoded = jwt.verify(token, process.env.JWT_SECRET); }
    catch { return res.status(401).json({ success: false, message: "Your authentication session is invalid or expired." }); }

    if (!decoded.userId) return res.status(401).json({ success: false, message: "Invalid authentication token." });

    if (!decoded.iat || Date.now() - decoded.iat * 1000 >= MAX_AUTH_SESSION_MS) {
      return res.status(401).json({ success: false, code: "SESSION_EXPIRED", message: "Your 24-hour security session has expired. Please log in again and complete phone verification." });
    }

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ success: false, message: "User account no longer exists." });

    if (["suspended", "deactivated", "rejected"].includes(user.accountStatus)) {
      return res.status(403).json({ success: false, message: `This account has been ${user.accountStatus}.` });
    }
    if (user.accountStatus !== "approved") return res.status(403).json({ success: false, message: "This account is not approved for platform access." });

    // IMPORTANT: There is deliberately NO user.emailVerified check.
    // Email verification has been removed for every account type.

    const isSuperAdmin = user.platformRole === "super_admin";
    if (!isSuperAdmin && user.platformRole !== "user") {
      return res.status(403).json({ success: false, message: "This account has an invalid platform role." });
    }

    req.user = user;
    req.auth = { userId: user._id.toString(), platformRole: user.platformRole, isSuperAdmin };
    return next();
  } catch (error) {
    console.error("PoliSync authentication middleware error:", error);
    return res.status(500).json({ success: false, message: "Authentication service error." });
  }
};

const requireSuperAdmin = (req, res, next) => {
  if (!req.auth || req.auth.platformRole !== "super_admin") return res.status(403).json({ success: false, message: "Super Admin authorization is required." });
  return next();
};

const requirePlatformUser = (req, res, next) => {
  if (!req.auth) return res.status(401).json({ success: false, message: "Authentication required." });
  return next();
};

module.exports = { MAX_AUTH_SESSION_MS, authenticate, requireSuperAdmin, requirePlatformUser };
