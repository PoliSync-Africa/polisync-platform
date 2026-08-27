const {
  verifyLoginOtp,
  resendLoginOtp,
} = require("../middleware/phoneOtpSecurity");

// ============================================================
// POLISYNC AFRICA — PHONE OTP CONTROLLER
// ============================================================
//
// Handles the HTTP layer for login phone OTP security.
//
// The actual OTP security logic lives in:
// middleware/phoneOtpSecurity.js
//
// This controller:
// - receives the user's OTP
// - verifies the login challenge
// - handles OTP resend
//
// It does NOT create JWTs itself.
// The authentication flow remains responsible for issuing the
// final authentication token after successful verification.
// ============================================================


// ============================================================
// VERIFY LOGIN PHONE OTP
// ============================================================

const verifyLoginPhoneOTP =
  async (req, res) => {
    try {
      const {
        userId,
        challengeId,
        code,
      } = req.body || {};

      // --------------------------------------------------------
      // BASIC VALIDATION
      // --------------------------------------------------------

      if (
        !userId ||
        !challengeId ||
        !code
      ) {
        return res.status(400).json({
          success: false,

          code:
            "INVALID_REQUEST",

          message:
            "User ID, verification challenge and OTP are required.",
        });
      }

      // --------------------------------------------------------
      // VERIFY OTP
      // --------------------------------------------------------

      const result =
        await verifyLoginOtp({
          userId,

          challengeId,

          code,
        });

      // --------------------------------------------------------
      // FAILED VERIFICATION
      // --------------------------------------------------------

      if (!result.success) {
        const statusCode =
          result.code ===
          "USER_NOT_FOUND"
            ? 404
            : result.code ===
                "TOO_MANY_ATTEMPTS"
              ? 429
              : result.code ===
                  "OTP_SERVICE_ERROR"
                ? 503
                : 400;

        return res.status(
          statusCode
        ).json(result);
      }

      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      return res.status(200).json({
        success: true,

        code:
          "PHONE_OTP_VERIFIED",

        message:
          "Phone verification successful.",

        userId:
          result.userId,

        lastPhoneVerificationAt:
          result.lastPhoneVerificationAt,
      });

    } catch (error) {
      console.error(
        "PoliSync verify login phone OTP error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to complete phone verification at this time.",
      });
    }
  };


// ============================================================
// RESEND LOGIN PHONE OTP
// ============================================================

const resendLoginPhoneOTP =
  async (req, res) => {
    try {
      const {
        userId,
        challengeId,
      } = req.body || {};

      // --------------------------------------------------------
      // BASIC VALIDATION
      // --------------------------------------------------------

      if (
        !userId ||
        !challengeId
      ) {
        return res.status(400).json({
          success: false,

          code:
            "INVALID_REQUEST",

          message:
            "User ID and verification challenge are required.",
        });
      }

      // --------------------------------------------------------
      // RESEND OTP
      // --------------------------------------------------------

      const result =
        await resendLoginOtp({
          userId,

          challengeId,
        });

      // --------------------------------------------------------
      // FAILED REQUEST
      // --------------------------------------------------------

      if (!result.success) {
        const statusCode =
          result.code ===
          "USER_NOT_FOUND"
            ? 404
            : result.code ===
                "TOO_MANY_ATTEMPTS"
              ? 429
              : 400;

        return res.status(
          statusCode
        ).json(result);
      }

      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      return res.status(200).json({
        success: true,

        code:
          "PHONE_OTP_RESENT",

        message:
          "A new verification code has been sent to your registered phone number.",

        challengeId:
          result.challengeId,

        expiresIn:
          result.expiresIn,
      });

    } catch (error) {
      console.error(
        "PoliSync resend login phone OTP error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to resend the verification code at this time.",
      });
    }
  };


// ============================================================
// EXPORT
// ============================================================

module.exports = {
  verifyLoginPhoneOTP,

  resendLoginPhoneOTP,
};
