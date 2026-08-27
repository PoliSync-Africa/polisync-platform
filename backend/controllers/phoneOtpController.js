const jwt = require("jsonwebtoken");

const User = require("../models/User");

const {
  verifyOTP,
  sendPhoneVerificationOTP,
} = require("../services/arkeselOtpService");

// ============================================================
// POLISYNC AFRICA — LOGIN PHONE OTP CONTROLLER
// ============================================================
//
// This controller handles the mandatory phone OTP security
// required during login.
//
// SECURITY RULE:
//
// 1. User logs in with email + password.
// 2. If phone OTP security is required, login does NOT issue
//    the final JWT.
// 3. An OTP is sent to the user's registered phone number.
// 4. User submits the OTP.
// 5. Arkesel verifies the OTP.
// 6. Only after successful verification is the JWT issued.
// 7. Successful login-phone verification remains valid for
//    24 hours.
// 8. After 24 hours, another login requires another OTP.
//
// IMPORTANT:
//
// Arkesel remains authoritative for the SMS OTP.
// PoliSync does not store the SMS OTP itself.
//
// ============================================================


// ============================================================
// CONFIGURATION
// ============================================================

const LOGIN_OTP_VALIDITY_HOURS = 24;


// ============================================================
// NORMALIZE GHANA PHONE
// ============================================================

const normalizeGhanaPhone = (phone) => {
  let normalized = String(phone || "").trim();

  if (/^0\d{9}$/.test(normalized)) {
    normalized = "233" + normalized.slice(1);
  }

  if (/^\+233\d{9}$/.test(normalized)) {
    normalized = normalized.slice(1);
  }

  if (!/^233\d{9}$/.test(normalized)) {
    return null;
  }

  return "+" + normalized;
};


// ============================================================
// CHECK WHETHER LOGIN OTP IS STILL VALID
// ============================================================
//
// The 24-hour period is calculated from the user's
// last successful login-phone OTP verification.
//
// ============================================================

const isLoginOtpStillValid = (user) => {
  if (!user.loginOtpVerifiedAt) {
    return false;
  }

  const verifiedAt =
    new Date(user.loginOtpVerifiedAt).getTime();

  if (Number.isNaN(verifiedAt)) {
    return false;
  }

  const validityMilliseconds =
    LOGIN_OTP_VALIDITY_HOURS *
    60 *
    60 *
    1000;

  return (
    Date.now() - verifiedAt <
    validityMilliseconds
  );
};


// ============================================================
// CREATE LOGIN JWT
// ============================================================

const createLoginToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET is not configured."
    );
  }

  return jwt.sign(
    {
      userId: user._id.toString(),
      platformRole:
        user.platformRole,
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

const buildLoginResponse = (
  user,
  token
) => {
  // ----------------------------------------------------------
  // SUPER ADMIN
  // ----------------------------------------------------------

  if (
    user.platformRole ===
    "super_admin"
  ) {
    return {
      success: true,

      message:
        "Welcome to PoliSync Africa.",

      token,

      user: {
        id: user._id,

        displayName:
          "POLISYNC AFRICA",

        username:
          "polisync.africa",

        platformRole:
          "super_admin",

        isPlatformAccount:
          true,

        verified: true,

        verificationBadge:
          "/verified-badge.png",

        accountStatus:
          "approved",
      },

      workspace: {
        type: "super_admin",

        name:
          "PoliSync Africa Super Admin",
      },
    };
  }


  // ----------------------------------------------------------
  // ORDINARY USER
  // ----------------------------------------------------------

  return {
    success: true,

    message:
      "Login successful.",

    token,

    user: {
      id: user._id,

      displayName:
        user.displayName ||
        `${user.firstName} ${user.lastName}`.trim(),

      username:
        user.username,

      platformRole:
        "user",

      isPlatformAccount:
        false,

      verified: Boolean(
        user.verification &&
        user.verification.isVerified &&
        user.verification.status ===
          "approved"
      ),

      verificationBadge:
        user.verification &&
        user.verification.isVerified
          ? "/verified-badge.png"
          : null,

      accountStatus:
        user.accountStatus,
    },

    workspace: {
      type: "organization",

      requiresMembership:
        true,
    },
  };
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
//   "phone": "+233XXXXXXXXX",
//   "code": "123456"
// }
//
// ============================================================

exports.verifyLoginPhoneOTP =
  async (req, res) => {
    try {
      const {
        phone,
        code,
      } = req.body || {};


      // --------------------------------------------------------
      // REQUIRED FIELDS
      // --------------------------------------------------------

      if (!phone || !code) {
        return res.status(400).json({
          success: false,

          message:
            "Phone number and OTP code are required.",
        });
      }


      // --------------------------------------------------------
      // NORMALIZE PHONE
      // --------------------------------------------------------

      const normalizedPhone =
        normalizeGhanaPhone(
          phone
        );

      if (!normalizedPhone) {
        return res.status(400).json({
          success: false,

          message:
            "Phone number must be a valid Ghana phone number.",
        });
      }


      // --------------------------------------------------------
      // NORMALIZE OTP
      // --------------------------------------------------------

      const normalizedCode =
        String(code).trim();

      if (
        !/^\d{4,15}$/.test(
          normalizedCode
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid OTP format.",
        });
      }


      // --------------------------------------------------------
      // FIND USER
      // --------------------------------------------------------

      const user =
        await User.findOne({
          phone:
            normalizedPhone,
        });


      if (!user) {
        return res.status(404).json({
          success: false,

          message:
            "Account not found.",
        });
      }


      // --------------------------------------------------------
      // ACCOUNT SECURITY CHECKS
      // --------------------------------------------------------

      if (
        user.accountStatus ===
        "suspended"
      ) {
        return res.status(403).json({
          success: false,

          message:
            "This account has been suspended.",
        });
      }


      if (
        user.accountStatus ===
        "deactivated"
      ) {
        return res.status(403).json({
          success: false,

          message:
            "This account has been deactivated.",
        });
      }


      if (
        user.accountStatus ===
        "rejected"
      ) {
        return res.status(403).json({
          success: false,

          message:
            "This account has been rejected.",
        });
      }


      if (
        user.accountStatus !==
        "approved"
      ) {
        return res.status(403).json({
          success: false,

          message:
            "Your account has not yet been approved.",
        });
      }


      // --------------------------------------------------------
      // EMAIL MUST ALREADY BE VERIFIED
      // --------------------------------------------------------

      if (!user.emailVerified) {
        return res.status(403).json({
          success: false,

          code:
            "EMAIL_NOT_VERIFIED",

          message:
            "Please verify your email before logging in.",
        });
      }


      // --------------------------------------------------------
      // VERIFY OTP THROUGH ARKESEL
      // --------------------------------------------------------

      let arkeselResult;

      try {
        arkeselResult =
          await verifyOTP({
            phone:
              normalizedPhone,

            code:
              normalizedCode,
          });
      } catch (
        arkeselError
      ) {
        console.error(
          "Login OTP Arkesel verification error:",
          arkeselError
        );

        return res.status(502).json({
          success: false,

          message:
            "Unable to verify the OTP right now. Please try again.",
        });
      }


      // --------------------------------------------------------
      // INVALID OTP
      // --------------------------------------------------------

      if (
        !arkeselResult?.success ||
        !arkeselResult?.verified
      ) {
        return res.status(400).json({
          success: false,

          verified: false,

          message:
            arkeselResult?.message ||
            "Invalid or expired OTP.",

          provider:
            "arkesel",

          providerCode:
            arkeselResult?.providerCode ||
            null,
        });
      }


      // --------------------------------------------------------
      // OTP SUCCESSFUL
      // --------------------------------------------------------
      //
      // Store ONLY the time of successful verification.
      //
      // We do NOT store the OTP.
      //
      // The OTP itself remains under Arkesel's control.
      // --------------------------------------------------------

      user.phoneVerified =
        true;

      user.loginOtpVerifiedAt =
        new Date();

      user.lastLoginAt =
        new Date();

      user.lastSeenAt =
        new Date();

      user.isOnline =
        true;


      await user.save();


      // --------------------------------------------------------
      // CREATE FINAL LOGIN TOKEN
      // --------------------------------------------------------

      const token =
        createLoginToken(
          user
        );


      // --------------------------------------------------------
      // FINAL LOGIN RESPONSE
      // --------------------------------------------------------

      return res.status(200).json(
        buildLoginResponse(
          user,
          token
        )
      );


    } catch (error) {
      console.error(
        "Verify login phone OTP error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to complete phone OTP verification.",
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
//   "phone": "+233XXXXXXXXX"
// }
//
// ============================================================

exports.resendLoginPhoneOTP =
  async (req, res) => {
    try {
      const {
        phone,
      } = req.body || {};


      // --------------------------------------------------------
      // REQUIRED PHONE
      // --------------------------------------------------------

      if (!phone) {
        return res.status(400).json({
          success: false,

          message:
            "Phone number is required.",
        });
      }


      // --------------------------------------------------------
      // NORMALIZE PHONE
      // --------------------------------------------------------

      const normalizedPhone =
        normalizeGhanaPhone(
          phone
        );

      if (!normalizedPhone) {
        return res.status(400).json({
          success: false,

          message:
            "Phone number must be a valid Ghana phone number.",
        });
      }


      // --------------------------------------------------------
      // FIND USER
      // --------------------------------------------------------

      const user =
        await User.findOne({
          phone:
            normalizedPhone,
        });


      if (!user) {
        return res.status(404).json({
          success: false,

          message:
            "Account not found.",
        });
      }


      // --------------------------------------------------------
      // CHECK ACCOUNT
      // --------------------------------------------------------

      if (
        user.accountStatus !==
        "approved"
      ) {
        return res.status(403).json({
          success: false,

          message:
            "Your account is not approved for login.",
        });
      }


      // --------------------------------------------------------
      // IF 24-HOUR VERIFICATION IS STILL ACTIVE
      // --------------------------------------------------------

      if (
        isLoginOtpStillValid(
          user
        )
      ) {
        return res.status(200).json({
          success: true,

          otpRequired:
            false,

          message:
            "Phone verification is still valid for this account.",
        });
      }


      // --------------------------------------------------------
      // SEND NEW ARKESEL OTP
      // --------------------------------------------------------

      let notification;

      try {
        notification =
          await sendPhoneVerificationOTP({
            phone:
              user.phone,

            firstName:
              user.firstName,
          });
      } catch (
        notificationError
      ) {
        console.error(
          "Login OTP resend failed:",
          notificationError
        );

        return res.status(502).json({
          success: false,

          message:
            "Unable to send a new OTP right now. Please try again.",
        });
      }


      // --------------------------------------------------------
      // RESPONSE
      // --------------------------------------------------------

      return res.status(200).json({
        success: true,

        otpRequired:
          true,

        message:
          "A new login verification OTP has been sent to your registered phone number.",

        notification:
          Boolean(
            notification?.success
          ),
      });


    } catch (error) {
      console.error(
        "Resend login phone OTP error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to resend login OTP.",
      });
    }
  };


// ============================================================
// EXPORT HELPERS
// ============================================================

exports.isLoginOtpStillValid =
  isLoginOtpStillValid;

exports.createLoginToken =
  createLoginToken;

exports.buildLoginResponse =
  buildLoginResponse;
