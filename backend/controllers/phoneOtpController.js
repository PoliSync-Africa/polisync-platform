const jwt = require("jsonwebtoken");

const User = require("../models/User");

const { verifyOTP, sendLoginOTP } = require("../services/arkeselOtpService");

// ============================================================
// POLISYNC AFRICA — LOGIN PHONE OTP CONTROLLER
// ============================================================
//
// Mandatory phone OTP security for login.
//
// SECURITY RULE:
//
// 1. Email + password are checked by the normal login process.
// 2. If the 24-hour phone verification window has expired,
// login must stop before a JWT is issued.
// 3. A login OTP is sent to the registered phone number.
// 4. The user submits the OTP.
// 5. Arkesel verifies the OTP.
// 6. Successful verification records lastPhoneVerificationAt.
// 7. A JWT is then issued.
// ============================================================

// ============================================================
// CONFIGURATION
// ============================================================

const LOGIN_OTP_VALIDITY_MS = 24 * 60 * 60 * 1000;

// ============================================================
// CHECK 24-HOUR PHONE VERIFICATION WINDOW
// ============================================================

const isLoginOtpStillValid = (user) => {
  if (!user || !user.lastPhoneVerificationAt) {
    return false;
  }

  const verifiedAt = new Date(user.lastPhoneVerificationAt).getTime();

  if (Number.isNaN(verifiedAt)) {
    return false;
  }

  return Date.now() - verifiedAt < LOGIN_OTP_VALIDITY_MS;
};

// ============================================================
// CREATE LOGIN TOKEN
// ============================================================

const createLoginToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      userId: user._id.toString(),

      platformRole: user.platformRole,
    },

    process.env.JWT_SECRET,

    {
      expiresIn: "7d",
    }
  );
};

// ============================================================
// BUILD LOGIN RESPONSE
// ============================================================

const buildLoginResponse = (user, token) => {
  // ----------------------------------------------------------
  // SUPER ADMIN
  // ----------------------------------------------------------

  if (user.platformRole === "super_admin") {
    return {
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

      workspace: {
        type: "super_admin",

        name: "PoliSync Africa Super Admin",
      },
    };
  }

  // ----------------------------------------------------------
  // ORDINARY USER
  // ----------------------------------------------------------

  return {
    success: true,

    message: "Login successful.",

    token,

    user: {
      id: user._id,

      displayName:
        user.displayName || `${user.firstName} ${user.lastName}`.trim(),

      username: user.username,

      platformRole: "user",

      isPlatformAccount: false,

      verified: Boolean(
        user.verification &&
          user.verification.isVerified &&
          user.verification.status === "approved"
      ),

      verificationBadge:
        user.verification && user.verification.isVerified
          ? "/verified-badge.png"
          : null,

      accountStatus: user.accountStatus,
    },

    workspace: {
      type: "organization",

      requiresMembership: true,
    },
  };
};

// ============================================================
// SEND LOGIN OTP
// ============================================================
//
// This endpoint is used after the existing login controller
// has confirmed the user's email and password.
//
// The frontend sends:
//
// {
// "userId": "USER_ID"
// }
//
// The server obtains the phone number from MongoDB.
//
// The client therefore does NOT choose which phone receives
// the security OTP.
// ============================================================

const sendLoginPhoneOTP = async (req, res) => {
  try {
    const { userId } = req.body || {};

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!userId) {
      return res.status(400).json({
        success: false,

        code: "USER_ID_REQUIRED",

        message: "User ID is required.",
      });
    }

    // --------------------------------------------------------
    // FIND USER
    // --------------------------------------------------------

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,

        code: "USER_NOT_FOUND",

        message: "Account not found.",
      });
    }

    // --------------------------------------------------------
    // ACCOUNT STATUS
    // --------------------------------------------------------

    if (user.accountStatus === "suspended") {
      return res.status(403).json({
        success: false,

        code: "ACCOUNT_SUSPENDED",

        message: "This account has been suspended.",
      });
    }

    if (user.accountStatus === "deactivated") {
      return res.status(403).json({
        success: false,

        code: "ACCOUNT_DEACTIVATED",

        message: "This account has been deactivated.",
      });
    }

    if (user.accountStatus === "rejected") {
      return res.status(403).json({
        success: false,

        code: "ACCOUNT_REJECTED",

        message: "This account has been rejected.",
      });
    }

    if (user.accountStatus !== "approved") {
      return res.status(403).json({
        success: false,

        code: "ACCOUNT_NOT_APPROVED",

        message: "Your account has not yet been approved.",
      });
    }

    // --------------------------------------------------------
    // PHONE MUST BE VERIFIED
    // --------------------------------------------------------

    if (!user.phoneVerified) {
      return res.status(403).json({
        success: false,

        code: "PHONE_NOT_VERIFIED",

        message: "Your registered phone number must be verified before login.",
      });
    }

    // --------------------------------------------------------
    // EMAIL MUST BE VERIFIED
    // --------------------------------------------------------

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,

        code: "EMAIL_NOT_VERIFIED",

        message: "Please verify your email before logging in.",
      });
    }

    // --------------------------------------------------------
    // CHECK 24-HOUR WINDOW
    // --------------------------------------------------------

    if (isLoginOtpStillValid(user)) {
      return res.status(200).json({
        success: true,

        otpRequired: false,

        message: "Phone verification is still valid.",
      });
    }

    // --------------------------------------------------------
    // SEND OTP TO REGISTERED PHONE
    // --------------------------------------------------------

    const result = await sendLoginOTP({
      phone: user.phone,

      firstName: user.firstName,
    });

    // --------------------------------------------------------
    // UPDATE CHALLENGE STATE
    // --------------------------------------------------------
    //
    // We do not store the actual OTP.
    // Arkesel handles the OTP itself.
    //
    // Reset the attempt counter for this new challenge.
    // --------------------------------------------------------

    user.loginOtpAttempts = 0;

    await user.save();

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,

      otpRequired: true,

      message:
        "A login verification code has been sent to your registered phone number.",

      expiresInMinutes: result.expiresInMinutes,

      phone: user.phone.slice(-4) ? `••••••${user.phone.slice(-4)}` : null,
    });
  } catch (error) {
    console.error("PoliSync send login OTP error:", error);

    return res.status(500).json({
      success: false,

      message: "Unable to send login verification code.",
    });
  }
};

// ============================================================
// VERIFY LOGIN PHONE OTP
// ============================================================
//
// POST
// /api/phone-otp/verify-login-otp
//
// Body:
//
// {
// "userId": "...",
// "code": "123456"
// }
//
// ============================================================

const verifyLoginPhoneOTP = async (req, res) => {
  try {
    const { userId, code } = req.body || {};

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!userId || !code) {
      return res.status(400).json({
        success: false,

        code: "INVALID_REQUEST",

        message: "User ID and OTP code are required.",
      });
    }

    const normalizedCode = String(code).trim();

    if (!/^\d{4,15}$/.test(normalizedCode)) {
      return res.status(400).json({
        success: false,

        code: "INVALID_OTP_FORMAT",

        message: "Invalid OTP format.",
      });
    }

    // --------------------------------------------------------
    // FIND USER
    // --------------------------------------------------------

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,

        code: "USER_NOT_FOUND",

        message: "Account not found.",
      });
    }

    // --------------------------------------------------------
    // ACCOUNT STATUS
    // --------------------------------------------------------

    if (user.accountStatus !== "approved") {
      return res.status(403).json({
        success: false,

        message: "Your account is not approved for login.",
      });
    }

    // --------------------------------------------------------
    // PHONE MUST BE VERIFIED
    // --------------------------------------------------------

    if (!user.phoneVerified) {
      return res.status(403).json({
        success: false,

        code: "PHONE_NOT_VERIFIED",

        message: "Your registered phone number must be verified first.",
      });
    }

    // --------------------------------------------------------
    // VERIFY OTP THROUGH ARKESEL
    // --------------------------------------------------------

    let result;

    try {
      result = await verifyOTP({
        phone: user.phone,

        code: normalizedCode,
      });
    } catch (arkeselError) {
      console.error(
        "PoliSync Arkesel login OTP verification error:",
        arkeselError
      );

      return res.status(502).json({
        success: false,

        code: "OTP_SERVICE_ERROR",

        message: "Unable to verify the OTP right now. Please try again.",
      });
    }

    // --------------------------------------------------------
    // INVALID OTP
    // --------------------------------------------------------

    if (!result || result.success !== true || result.verified !== true) {
      user.loginOtpAttempts = (user.loginOtpAttempts || 0) + 1;

      await user.save();

      if (user.loginOtpAttempts >= 5) {
        return res.status(429).json({
          success: false,

          code: "TOO_MANY_ATTEMPTS",

          message: "Too many incorrect OTP attempts. Please request a new OTP.",
        });
      }

      return res.status(400).json({
        success: false,

        code: "INVALID_PHONE_OTP",

        message: result?.message || "Invalid or expired OTP.",

        remainingAttempts: Math.max(0, 5 - user.loginOtpAttempts),
      });
    }

    // --------------------------------------------------------
    // SUCCESSFUL PHONE OTP
    // --------------------------------------------------------
    //
    // This starts a new 24-hour security period.
    // --------------------------------------------------------

    user.phoneVerified = true;

    user.lastPhoneVerificationAt = new Date();

    user.loginOtpAttempts = 0;

    user.lastLoginAt = new Date();

    user.lastSeenAt = new Date();

    user.isOnline = true;

    await user.save();

    // --------------------------------------------------------
    // CREATE JWT ONLY AFTER OTP SUCCESS
    // --------------------------------------------------------

    const token = createLoginToken(user);

    // --------------------------------------------------------
    // FINAL LOGIN RESPONSE
    // --------------------------------------------------------

    return res.status(200).json(buildLoginResponse(user, token));
  } catch (error) {
    console.error("PoliSync verify login OTP error:", error);

    return res.status(500).json({
      success: false,

      message: "Unable to complete phone OTP verification.",
    });
  }
};

// ============================================================
// RESEND LOGIN PHONE OTP
// ============================================================
//
// POST
// /api/phone-otp/resend-login-otp
//
// Body:
//
// {
// "userId": "..."
// }
//
// ============================================================

const resendLoginPhoneOTP = async (req, res) => {
  try {
    const { userId } = req.body || {};

    if (!userId) {
      return res.status(400).json({
        success: false,

        code: "USER_ID_REQUIRED",

        message: "User ID is required.",
      });
    }

    // --------------------------------------------------------
    // FIND USER
    // --------------------------------------------------------

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,

        code: "USER_NOT_FOUND",

        message: "Account not found.",
      });
    }

    // --------------------------------------------------------
    // CHECK 24-HOUR WINDOW
    // --------------------------------------------------------

    if (isLoginOtpStillValid(user)) {
      return res.status(200).json({
        success: true,

        otpRequired: false,

        message: "Phone verification is still valid for this account.",
      });
    }

    // --------------------------------------------------------
    // SEND NEW LOGIN OTP
    // --------------------------------------------------------

    const result = await sendLoginOTP({
      phone: user.phone,

      firstName: user.firstName,
    });

    user.loginOtpAttempts = 0;

    await user.save();

    return res.status(200).json({
      success: true,

      otpRequired: true,

      message:
        "A new login verification code has been sent to your registered phone number.",

      expiresInMinutes: result.expiresInMinutes,
    });
  } catch (error) {
    console.error("PoliSync resend login OTP error:", error);

    return res.status(500).json({
      success: false,

      message: "Unable to resend login verification code.",
    });
  }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  sendLoginPhoneOTP,

  verifyLoginPhoneOTP,

  resendLoginPhoneOTP,

  isLoginOtpStillValid,

  createLoginToken,

  buildLoginResponse,
};
