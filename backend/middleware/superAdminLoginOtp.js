const bcrypt = require("bcryptjs");

const User = require("../models/User");
const { requirePhoneOtpIfExpired } = require("./phoneOtpSecurity");

// ============================================================
// POLISYNC AFRICA — SUPER ADMIN LOGIN OTP GATE
// ============================================================
// Super Admin is protected by the same 24-hour phone security
// window as ordinary accounts.
//
// The existing authController handles ordinary-user OTP login.
// This middleware closes the Super Admin bypass without changing
// Super Admin privileges or dashboard authorization.
// ============================================================

const requireSuperAdminLoginOtpIfExpired = async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return next();
    }

    const user = await User.findOne({ email }).select(
      "+password +lastPhoneVerificationAt"
    );

    // This gate only applies to Super Admin. Ordinary users continue
    // through authController.login(), which already enforces the 24-hour OTP.
    if (!user || user.platformRole !== "super_admin") {
      return next();
    }

    if (user.accountStatus !== "approved") {
      return next();
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return next();
    }

    let phoneOtpCheck;

    try {
      phoneOtpCheck = await requirePhoneOtpIfExpired(user);
    } catch (otpError) {
      console.error("PoliSync Super Admin login OTP challenge error:", otpError);

      return res.status(500).json({
        success: false,
        message: "Unable to start phone verification at this time.",
      });
    }

    if (!phoneOtpCheck.required) {
      return next();
    }

    if (phoneOtpCheck.success !== true) {
      return res.status(403).json({
        success: false,
        code: phoneOtpCheck.code || "PHONE_OTP_REQUIRED",
        message:
          phoneOtpCheck.message ||
          "Phone verification is required before logging in.",
      });
    }

    const otpExpiresAt = new Date(
      Date.now() + phoneOtpCheck.expiresIn * 1000
    );

    return res.status(202).json({
      success: true,
      code: "PHONE_OTP_REQUIRED",
      message: phoneOtpCheck.message,
      challengeToken: phoneOtpCheck.challengeId,
      phone: user.phone,
      expiresAt: otpExpiresAt.toISOString(),
      expiresInMinutes: Math.round(phoneOtpCheck.expiresIn / 60),
    });
  } catch (error) {
    console.error("PoliSync Super Admin login OTP gate error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to complete authentication at this time.",
    });
  }
};

module.exports = {
  requireSuperAdminLoginOtpIfExpired,
};
