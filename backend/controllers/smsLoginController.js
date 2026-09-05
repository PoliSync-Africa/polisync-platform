const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  isPhoneVerificationValid,
  createLoginOtpChallenge,
  sendLoginOtp,
  requirePhoneOtpIfExpired,
} = require("../middleware/phoneOtpSecurity");

// ============================================================
// POLISYNC AFRICA — SMS-FIRST LOGIN
// ============================================================
// Email remains the account identifier for login/password recovery.
// Email verification is NOT a login gate.
// All accounts use Arkesel SMS OTP for phone verification/security.
// ============================================================

const startSmsChallenge = async (user) => {
  if (!user?.phone) {
    throw new Error("A registered phone number is required for SMS verification.");
  }

  // Existing verified phones continue to use the platform's 24-hour
  // phone-security window.
  if (isPhoneVerificationValid(user)) {
    return { required: false, user };
  }

  // First login / expired verification: create the challenge even when
  // phoneVerified is still false. The Arkesel OTP itself completes the
  // initial phone verification.
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

  return {
    required: true,
    success: true,
    code: "PHONE_OTP_REQUIRED",
    challengeId,
    expiresIn: 300,
    message: "A PoliSync verification code has been sent by SMS to your registered phone number.",
    user,
  };
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Authentication service is not properly configured.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(String(password), user.password);
    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (["suspended", "deactivated", "rejected"].includes(user.accountStatus)) {
      return res.status(403).json({
        success: false,
        message: `This account has been ${user.accountStatus}.`,
      });
    }

    if (user.accountStatus !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Your account has not yet been approved.",
      });
    }

    // IMPORTANT: There is deliberately NO user.emailVerified check here.
    // Arkesel SMS OTP is the verification/security mechanism for everyone.
    let phoneOtpCheck;
    try {
      phoneOtpCheck = await startSmsChallenge(user);
    } catch (otpError) {
      console.error("PoliSync SMS login challenge error:", otpError);
      return res.status(502).json({
        success: false,
        message: "Unable to send the SMS verification code right now. Please try again.",
      });
    }

    if (phoneOtpCheck.required) {
      const expiresAt = new Date(Date.now() + phoneOtpCheck.expiresIn * 1000);
      return res.status(202).json({
        success: true,
        code: "PHONE_OTP_REQUIRED",
        message: phoneOtpCheck.message,
        challengeToken: phoneOtpCheck.challengeId,
        phone: user.phone,
        expiresAt: expiresAt.toISOString(),
        expiresInMinutes: Math.round(phoneOtpCheck.expiresIn / 60),
      });
    }

    user.lastLoginAt = new Date();
    user.isOnline = true;
    await user.save();

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        platformRole: user.platformRole,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const isSuperAdmin = user.platformRole === "super_admin";

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        displayName: isSuperAdmin
          ? "POLISYNC AFRICA"
          : (user.displayName || `${user.firstName} ${user.lastName}`.trim()),
        username: isSuperAdmin ? "polisync.africa" : user.username,
        platformRole: user.platformRole,
        isPlatformAccount: isSuperAdmin,
        verified: isSuperAdmin || Boolean(
          user.verification &&
          user.verification.isVerified &&
          user.verification.status === "approved"
        ),
        verificationBadge: isSuperAdmin || (user.verification && user.verification.isVerified)
          ? "/verified-badge.png"
          : null,
        accountStatus: user.accountStatus,
      },
      workspace: isSuperAdmin
        ? { type: "super_admin", name: "PoliSync Africa Super Admin" }
        : { type: "organization", requiresMembership: true },
    });
  } catch (error) {
    console.error("PoliSync SMS-first login error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to complete login at this time.",
    });
  }
};

module.exports = login;
