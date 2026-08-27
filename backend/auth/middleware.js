const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ============================================================
// POLISYNC AFRICA — AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// ============================================================
//
// Platform role:
// - super_admin
// - user
//
// Organization roles are handled separately through
// OrganizationMembership.
//
// Organization hierarchy:
// - national_party_admin
// - regional_admin
// - constituency_admin
// - polling_station_agent
//
// NO COUNTRY ADMIN.
// ============================================================

// ============================================================
// AUTHENTICATE USER
// ============================================================

const authenticate = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const token = authorization.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("POLISYNC AUTH ERROR: JWT_SECRET is not configured.");

      return res.status(500).json({
        success: false,
        message: "Authentication service is not properly configured.",
      });
    }

    // ----------------------------------------------------------
    // VERIFY TOKEN
    // ----------------------------------------------------------

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Your authentication session is invalid or expired.",
      });
    }

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    // ----------------------------------------------------------
    // LOAD CURRENT USER
    // ----------------------------------------------------------
    // Do not rely only on the role stored inside the JWT.
    // The database remains the source of truth.
    // ----------------------------------------------------------

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists.",
      });
    }

    // ----------------------------------------------------------
    // ACCOUNT STATUS
    // ----------------------------------------------------------

    if (user.accountStatus === "suspended") {
      return res.status(403).json({
        success: false,
        message: "This account has been suspended.",
      });
    }

    if (user.accountStatus === "deactivated") {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated.",
      });
    }

    if (user.accountStatus === "rejected") {
      return res.status(403).json({
        success: false,
        message: "This account has been rejected.",
      });
    }

    if (user.accountStatus !== "approved") {
      return res.status(403).json({
        success: false,
        message: "This account is not approved for platform access.",
      });
    }

    // ----------------------------------------------------------
    // EMAIL VERIFICATION
    // ----------------------------------------------------------

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email before accessing PoliSync Africa.",
      });
    }

    // ----------------------------------------------------------
    // SUPER ADMIN
    // ----------------------------------------------------------
    // Super Admin is a platform-level authority.
    // It does NOT require OrganizationMembership.
    // ----------------------------------------------------------

    if (user.platformRole === "super_admin") {
      req.user = user;

      req.auth = {
        userId: user._id.toString(),

        platformRole: "super_admin",

        isSuperAdmin: true,
      };

      return next();
    }

    // ----------------------------------------------------------
    // ORDINARY USER
    // ----------------------------------------------------------

    if (user.platformRole !== "user") {
      return res.status(403).json({
        success: false,
        message: "This account has an invalid platform role.",
      });
    }

    req.user = user;

    req.auth = {
      userId: user._id.toString(),

      platformRole: "user",

      isSuperAdmin: false,
    };

    return next();
  } catch (error) {
    console.error("PoliSync authentication middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Authentication service error.",
    });
  }
};

// ============================================================
// REQUIRE SUPER ADMIN
// ============================================================

const requireSuperAdmin = (req, res, next) => {
  if (!req.auth || req.auth.platformRole !== "super_admin") {
    return res.status(403).json({
      success: false,
      message: "Super Admin authorization is required.",
    });
  }

  return next();
};

// ============================================================
// REQUIRE PLATFORM USER
// ============================================================

const requirePlatformUser = (req, res, next) => {
  if (!req.auth) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  return next();
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  authenticate,
  requireSuperAdmin,
  requirePlatformUser,
};
