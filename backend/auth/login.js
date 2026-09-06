const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ============================================================
// POLISYNC AFRICA — LEGACY LOGIN CONTROLLER
// ============================================================
// This compatibility controller keeps the existing 7-day JWT
// lifetime. SMS/Arkesel verification is handled separately.
// ============================================================

const SESSION_TTL = "7d";
const JWT_ALGORITHM = "HS256";

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 32) {
      console.error("POLISYNC AUTH ERROR: JWT_SECRET is missing or too short.");
      return res.status(500).json({ success: false, message: "Authentication service is not properly configured." });
    }

    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user || !(await bcrypt.compare(String(password), user.password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    if (["suspended", "deactivated", "rejected"].includes(user.accountStatus)) {
      const messages = {
        suspended: "This account has been suspended.",
        deactivated: "This account has been deactivated.",
        rejected: "This account has been rejected.",
      };
      return res.status(403).json({ success: false, message: messages[user.accountStatus] });
    }

    if (user.platformRole === "super_admin") {
      if (user.accountStatus !== "approved") {
        return res.status(403).json({ success: false, message: "The Super Admin account is not approved." });
      }
      user.lastLoginAt = new Date();
      user.isOnline = true;
      await user.save();
      const token = jwt.sign(
        { userId: user._id.toString(), platformRole: "super_admin" },
        jwtSecret,
        { expiresIn: SESSION_TTL, algorithm: JWT_ALGORITHM }
      );
      return res.status(200).json({
        success: true,
        message: "Welcome to PoliSync Africa.",
        token,
        user: {
          id: user._id,
          displayName: "POLISYNC AFRICA",
          username: "polisync.africa",
          platformRole: "super_admin",
          isPlatformAccount: true,
          verified: true,
          verificationBadge: "/verified-badge.png",
          accountStatus: "approved",
        },
        workspace: { type: "super_admin", name: "PoliSync Africa Super Admin" },
      });
    }

    if (user.platformRole !== "user") {
      return res.status(403).json({ success: false, message: "This account has an invalid platform role." });
    }
    if (user.accountStatus !== "approved") {
      return res.status(403).json({ success: false, message: "Your account has not yet been approved." });
    }

    user.lastLoginAt = new Date();
    user.isOnline = true;
    await user.save();
    const token = jwt.sign(
      { userId: user._id.toString(), platformRole: "user" },
      jwtSecret,
      { expiresIn: SESSION_TTL, algorithm: JWT_ALGORITHM }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        displayName: user.displayName || `${user.firstName} ${user.lastName}`.trim(),
        username: user.username,
        platformRole: "user",
        isPlatformAccount: false,
        verified: Boolean(user.verification && user.verification.isVerified && user.verification.status === "approved"),
        verificationBadge: user.verification && user.verification.isVerified ? "/verified-badge.png" : null,
        accountStatus: user.accountStatus,
      },
      workspace: { type: "organization", requiresMembership: true },
    });
  } catch (error) {
    console.error("PoliSync legacy login error:", error);
    return res.status(500).json({ success: false, message: "Unable to complete login at this time." });
  }
};

module.exports = login;
