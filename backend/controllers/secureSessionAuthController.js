const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const AuthSession = require("../models/AuthSession");
const {
  isPhoneVerificationValid,
  createLoginOtpChallenge,
  sendLoginOtp,
  verifyLoginOtp,
  resendLoginOtp,
} = require("../middleware/phoneOtpSecurity");

const SESSION_TTL_SECONDS = 24 * 60 * 60;
const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("Authentication service is not properly configured.");
  }
  return secret;
};

const createSessionToken = async (user, req) => {
  const sessionId = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  await AuthSession.create({
    sessionId,
    userId: user._id,
    expiresAt,
    ipAddress: req.ip || null,
    userAgent: req.get("user-agent") || null,
    lastSeenAt: now,
  });

  const token = jwt.sign(
    {
      userId: user._id.toString(),
      platformRole: user.platformRole,
      sessionId,
    },
    getJwtSecret(),
    { expiresIn: "24h", algorithm: "HS256" }
  );

  return { token, sessionId, expiresAt };
};

const publicUser = (user) => {
  const isSuperAdmin = user.platformRole === "super_admin";
  return {
    id: user._id,
    displayName: isSuperAdmin
      ? "POLISYNC AFRICA"
      : user.displayName || `${user.firstName} ${user.lastName}`.trim(),
    username: isSuperAdmin ? "polisync.africa" : user.username,
    platformRole: user.platformRole,
    isPlatformAccount: isSuperAdmin,
    verified: isSuperAdmin || Boolean(
      user.verification?.isVerified && user.verification?.status === "approved"
    ),
    verificationBadge: isSuperAdmin || user.verification?.isVerified
      ? "/verified-badge.png"
      : null,
    accountStatus: user.accountStatus,
  };
};

const validateApprovedUser = (user) => {
  if (!user) return { status: 401, message: "Invalid email or password." };
  if (["suspended", "deactivated", "rejected"].includes(user.accountStatus)) {
    return { status: 403, message: `This account has been ${user.accountStatus}.` };
  }
  if (user.accountStatus !== "approved") {
    return { status: 403, message: "Your account has not yet been approved." };
  }
  if (!["user", "super_admin"].includes(user.platformRole)) {
    return { status: 403, message: "This account has an invalid platform role." };
  }
  return null;
};

const startLogin = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select("+password");
    const invalid = validateApprovedUser(user);
    if (invalid) return res.status(invalid.status).json({ success: false, message: invalid.message });

    if (user.platformRole === "super_admin" && !user.emailVerified) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email before accessing PoliSync Africa.",
      });
    }

    if (user.platformRole === "user" && !user.emailVerified) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email before logging in.",
      });
    }

    if (!(await bcrypt.compare(String(password), user.password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    if (!isPhoneVerificationValid(user)) {
      const challengeId = await createLoginOtpChallenge(user);
      try {
        await sendLoginOtp(user);
      } catch (error) {
        user.loginOtpChallengeHash = null;
        user.loginOtpExpiresAt = null;
        user.loginOtpAttempts = 0;
        await user.save();
        throw error;
      }
      return res.status(202).json({
        success: true,
        code: "PHONE_OTP_REQUIRED",
        message: "A PoliSync verification code has been sent by SMS to your registered phone number.",
        challengeToken: challengeId,
        phone: user.phone,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        expiresInMinutes: 5,
      });
    }

    user.lastLoginAt = new Date();
    user.isOnline = true;
    await user.save();

    const { token, expiresAt } = await createSessionToken(user, req);
    return res.status(200).json({
      success: true,
      message: user.platformRole === "super_admin" ? "Welcome to PoliSync Africa." : "Login successful.",
      token,
      expiresAt: expiresAt.toISOString(),
      user: publicUser(user),
      workspace: user.platformRole === "super_admin"
        ? { type: "super_admin", name: "PoliSync Africa Super Admin" }
        : { type: "organization", requiresMembership: true },
    });
  } catch (error) {
    console.error("Secure PoliSync login error:", error);
    return res.status(500).json({ success: false, message: "Unable to complete login at this time." });
  }
};

const verifyLogin = async (req, res) => {
  try {
    const { email, code, challengeToken } = req.body || {};
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail || !code || !challengeToken) {
      return res.status(400).json({ success: false, message: "Email, verification code, and challenge token are required." });
    }

    const user = await User.findOne({ email: normalizedEmail });
    const invalid = validateApprovedUser(user);
    if (invalid) return res.status(invalid.status).json({ success: false, message: invalid.message });

    const result = await verifyLoginOtp({ userId: user._id, challengeId: challengeToken, code });
    if (!result.success) {
      const statusByCode = {
        INVALID_REQUEST: 400,
        USER_NOT_FOUND: 401,
        ACCOUNT_SUSPENDED: 403,
        ACCOUNT_DEACTIVATED: 403,
        ACCOUNT_REJECTED: 403,
        INVALID_CHALLENGE: 401,
        PHONE_OTP_EXPIRED: 401,
        TOO_MANY_ATTEMPTS: 429,
        OTP_SERVICE_ERROR: 502,
        INVALID_PHONE_OTP: 401,
      };
      return res.status(statusByCode[result.code] || 400).json({
        success: false,
        code: result.code,
        message: result.message,
        remainingAttempts: result.remainingAttempts,
      });
    }

    user.lastLoginAt = new Date();
    user.isOnline = true;
    await user.save();

    const { token, expiresAt } = await createSessionToken(user, req);
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      expiresAt: expiresAt.toISOString(),
      user: publicUser(user),
      workspace: user.platformRole === "super_admin"
        ? { type: "super_admin", name: "PoliSync Africa Super Admin" }
        : { type: "organization", requiresMembership: true },
    });
  } catch (error) {
    console.error("Secure login OTP verification error:", error);
    return res.status(500).json({ success: false, message: "Unable to complete phone verification at this time." });
  }
};

const resendLogin = async (req, res) => {
  try {
    const { email, challengeToken } = req.body || {};
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail || !challengeToken) {
      return res.status(400).json({ success: false, message: "Email and challenge token are required." });
    }
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(401).json({ success: false, message: "Invalid email or verification challenge." });
    const result = await resendLoginOtp({ userId: user._id, challengeId: challengeToken });
    if (!result.success) {
      const statusByCode = { INVALID_REQUEST: 400, USER_NOT_FOUND: 401, INVALID_CHALLENGE: 401, TOO_MANY_ATTEMPTS: 429 };
      return res.status(statusByCode[result.code] || 400).json({ success: false, code: result.code, message: result.message });
    }
    const expiresAt = new Date(Date.now() + result.expiresIn * 1000);
    return res.status(200).json({
      success: true,
      code: result.code,
      message: result.message,
      challengeToken: result.challengeId,
      phone: user.phone,
      expiresAt: expiresAt.toISOString(),
      expiresInMinutes: Math.round(result.expiresIn / 60),
    });
  } catch (error) {
    console.error("Secure resend login OTP error:", error);
    return res.status(500).json({ success: false, message: "Unable to resend the verification code at this time." });
  }
};

const logout = async (req, res) => {
  try {
    const sessionId = req.auth?.sessionId;
    if (sessionId) {
      await AuthSession.findOneAndUpdate(
        { sessionId, userId: req.auth.userId, revokedAt: null },
        { $set: { revokedAt: new Date() } }
      );
    }
    if (req.user) {
      await User.findByIdAndUpdate(req.auth.userId, {
        $set: { isOnline: false, lastSeenAt: new Date() },
      });
    }
    return res.status(200).json({ success: true, message: "Logout successful." });
  } catch (error) {
    console.error("Secure logout error:", error);
    return res.status(500).json({ success: false, message: "Logout failed." });
  }
};

module.exports = { startLogin, verifyLogin, resendLogin, logout, SESSION_TTL_MS };
