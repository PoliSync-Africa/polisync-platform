const crypto = require("crypto");

const User = require("../models/User");

const {
  sendPhoneVerificationOTP,
  verifyOTP,
} = require("../services/arkeselOtpService");

// ============================================================
// POLISYNC AFRICA — PHONE OTP SECURITY LAYER
// ============================================================
//
// Purpose:
//   Add mandatory phone OTP security without replacing the
//   existing authentication controller.
//
// Security rules:
//
//   1. Registration phone verification is mandatory.
//   2. A successful phone verification starts a 24-hour window.
//   3. After 24 hours, another SMS OTP is required.
//   4. OTP is sent only to the registered phone number.
//   5. Login OTP challenge expires after 5 minutes.
//   6. Maximum 5 login OTP attempts.
//   7. Successful OTP verification clears the challenge.
//   8. The actual SMS OTP is never stored by this module.
//
// IMPORTANT
// ------------------------------------------------------------
// This module does NOT create JWTs.
// It does NOT replace authController.js.
// It only handles the phone-security challenge.
// ============================================================


// ============================================================
// CONFIGURATION
// ============================================================

const PHONE_VERIFICATION_WINDOW_MS =
  24 * 60 * 60 * 1000;

const LOGIN_OTP_EXPIRY_MS =
  5 * 60 * 1000;

const MAX_LOGIN_OTP_ATTEMPTS = 5;


// ============================================================
// CHECK WHETHER PHONE SECURITY IS STILL VALID
// ============================================================

const isPhoneVerificationValid =
  (user) => {
    if (!user) {
      return false;
    }

    if (!user.phoneVerified) {
      return false;
    }

    if (
      !user.lastPhoneVerificationAt
    ) {
      return false;
    }

    const lastVerification =
      new Date(
        user.lastPhoneVerificationAt
      ).getTime();

    if (
      Number.isNaN(
        lastVerification
      )
    ) {
      return false;
    }

    return (
      Date.now() -
        lastVerification <
      PHONE_VERIFICATION_WINDOW_MS
    );
  };


// ============================================================
// CREATE LOGIN OTP CHALLENGE
// ============================================================
//
// This creates a random challenge identifier.
//
// The actual SMS OTP remains with Arkesel.
// We only store a SHA-256 hash of the challenge.
// ============================================================

const createLoginOtpChallenge =
  async (user) => {
    if (!user) {
      throw new Error(
        "User is required."
      );
    }

    if (!user.phone) {
      throw new Error(
        "A registered phone number is required."
      );
    }

    const challengeId =
      crypto
        .randomBytes(32)
        .toString("hex");

    const challengeHash =
      crypto
        .createHash("sha256")
        .update(challengeId)
        .digest("hex");

    user.loginOtpChallengeHash =
      challengeHash;

    user.loginOtpExpiresAt =
      new Date(
        Date.now() +
          LOGIN_OTP_EXPIRY_MS
      );

    user.loginOtpAttempts = 0;

    await user.save();

    return challengeId;
  };


// ============================================================
// SEND LOGIN OTP
// ============================================================

const sendLoginOtp =
  async (user) => {
    if (!user) {
      throw new Error(
        "User is required."
      );
    }

    if (!user.phone) {
      throw new Error(
        "No registered phone number is available."
      );
    }

    await sendPhoneVerificationOTP({
      user,
    });
  };


// ============================================================
// START LOGIN PHONE OTP CHALLENGE
// ============================================================
//
// Returns a temporary challenge.
//
// NO JWT is created here.
// ============================================================

const startLoginOtpChallenge =
  async (user) => {
    if (!user) {
      throw new Error(
        "User is required."
      );
    }

    if (!user.phoneVerified) {
      return {
        success: false,

        code:
          "PHONE_NOT_VERIFIED",

        message:
          "The registered phone number must be verified before login security can be completed.",
      };
    }

    const challengeId =
      await createLoginOtpChallenge(
        user
      );

    try {
      await sendLoginOtp(
        user
      );
    } catch (error) {
      await clearLoginOtpChallenge(
        user
      );

      throw error;
    }

    return {
      success: true,

      code:
        "PHONE_OTP_REQUIRED",

      challengeId,

      expiresIn:
        Math.floor(
          LOGIN_OTP_EXPIRY_MS /
            1000
        ),

      message:
        "A verification code has been sent to your registered phone number.",
    };
  };


// ============================================================
// CLEAR LOGIN OTP CHALLENGE
// ============================================================

const clearLoginOtpChallenge =
  async (user) => {
    if (!user) {
      return;
    }

    user.loginOtpChallengeHash =
      null;

    user.loginOtpExpiresAt =
      null;

    user.loginOtpAttempts = 0;

    await user.save();
  };


// ============================================================
// VERIFY LOGIN OTP
// ============================================================
//
// This verifies:
//   1. Challenge
//   2. Expiration
//   3. Attempt limit
//   4. Arkesel OTP
//
// Successful verification:
//   phoneVerified = true
//   lastPhoneVerificationAt = now
//
// JWT creation remains outside this module.
// ============================================================

const verifyLoginOtp =
  async ({
    userId,
    challengeId,
    code,
  }) => {
    if (
      !userId ||
      !challengeId ||
      !code
    ) {
      return {
        success: false,

        code:
          "INVALID_REQUEST",

        message:
          "User ID, challenge ID and OTP are required.",
      };
    }

    const user =
      await User.findById(
        userId
      ).select(
        "+loginOtpChallengeHash +loginOtpExpiresAt"
      );

    if (!user) {
      return {
        success: false,

        code:
          "USER_NOT_FOUND",

        message:
          "Account not found.",
      };
    }

    // ----------------------------------------------------------
    // ACCOUNT STATUS
    // ----------------------------------------------------------

    if (
      user.accountStatus ===
      "suspended"
    ) {
      return {
        success: false,

        code:
          "ACCOUNT_SUSPENDED",

        message:
          "This account has been suspended.",
      };
    }

    if (
      user.accountStatus ===
      "deactivated"
    ) {
      return {
        success: false,

        code:
          "ACCOUNT_DEACTIVATED",

        message:
          "This account has been deactivated.",
      };
    }

    if (
      user.accountStatus ===
      "rejected"
    ) {
      return {
        success: false,

        code:
          "ACCOUNT_REJECTED",

        message:
          "This account has been rejected.",
      };
    }

    // ----------------------------------------------------------
    // CHALLENGE HASH
    // ----------------------------------------------------------

    const challengeHash =
      crypto
        .createHash("sha256")
        .update(
          String(challengeId)
        )
        .digest("hex");

    if (
      !user.loginOtpChallengeHash ||
      user.loginOtpChallengeHash !==
        challengeHash
    ) {
      return {
        success: false,

        code:
          "INVALID_CHALLENGE",

        message:
          "The login verification challenge is invalid.",
      };
    }

    // ----------------------------------------------------------
    // EXPIRATION
    // ----------------------------------------------------------

    if (
      !user.loginOtpExpiresAt ||
      user.loginOtpExpiresAt <=
        new Date()
    ) {
      await clearLoginOtpChallenge(
        user
      );

      return {
        success: false,

        code:
          "PHONE_OTP_EXPIRED",

        message:
          "The verification code has expired. Please request a new code.",
      };
    }

    // ----------------------------------------------------------
    // ATTEMPT LIMIT
    // ----------------------------------------------------------

    if (
      user.loginOtpAttempts >=
      MAX_LOGIN_OTP_ATTEMPTS
    ) {
      await clearLoginOtpChallenge(
        user
      );

      return {
        success: false,

        code:
          "TOO_MANY_ATTEMPTS",

        message:
          "Too many incorrect verification attempts. Please request a new code.",
      };
    }

    // ----------------------------------------------------------
    // VERIFY WITH ARKESEL
    // ----------------------------------------------------------

    let verificationResult;

    try {
      verificationResult =
        await verifyOTP({
          userId:
            user._id,

          purpose:
            "login",

          channel:
            "phone",

          code:
            String(code).trim(),
        });
    } catch (error) {
      console.error(
        "PoliSync login OTP verification error:",
        error
      );

      return {
        success: false,

        code:
          "OTP_SERVICE_ERROR",

        message:
          "Unable to verify the phone code at this time.",
      };
    }

    if (
      !verificationResult ||
      verificationResult.success !==
        true
    ) {
      user.loginOtpAttempts =
        (user.loginOtpAttempts || 0) +
        1;

      await user.save();

      const remainingAttempts =
        Math.max(
          0,
          MAX_LOGIN_OTP_ATTEMPTS -
            user.loginOtpAttempts
        );

      if (
        user.loginOtpAttempts >=
        MAX_LOGIN_OTP_ATTEMPTS
      ) {
        await clearLoginOtpChallenge(
          user
        );

        return {
          success: false,

          code:
            "TOO_MANY_ATTEMPTS",

          message:
            "Too many incorrect verification attempts. Please request a new code.",
        };
      }

      return {
        success: false,

        code:
          "INVALID_PHONE_OTP",

        message:
          "Invalid or expired verification code.",

        remainingAttempts,
      };
    }

    // ----------------------------------------------------------
    // SUCCESS
    // ----------------------------------------------------------

    user.phoneVerified =
      true;

    user.lastPhoneVerificationAt =
      new Date();

    user.loginOtpChallengeHash =
      null;

    user.loginOtpExpiresAt =
      null;

    user.loginOtpAttempts = 0;

    await user.save();

    return {
      success: true,

      code:
        "PHONE_OTP_VERIFIED",

      message:
        "Phone verification successful.",

      userId:
        user._id,

      lastPhoneVerificationAt:
        user.lastPhoneVerificationAt,
    };
  };


// ============================================================
// RESEND LOGIN OTP
// ============================================================

const resendLoginOtp =
  async ({
    userId,
    challengeId,
  }) => {
    if (
      !userId ||
      !challengeId
    ) {
      return {
        success: false,

        code:
          "INVALID_REQUEST",

        message:
          "User ID and challenge ID are required.",
      };
    }

    const user =
      await User.findById(
        userId
      ).select(
        "+loginOtpChallengeHash +loginOtpExpiresAt"
      );

    if (!user) {
      return {
        success: false,

        code:
          "USER_NOT_FOUND",

        message:
          "Account not found.",
      };
    }

    const challengeHash =
      crypto
        .createHash("sha256")
        .update(
          String(challengeId)
        )
        .digest("hex");

    if (
      !user.loginOtpChallengeHash ||
      user.loginOtpChallengeHash !==
        challengeHash
    ) {
      return {
        success: false,

        code:
          "INVALID_CHALLENGE",

        message:
          "The login verification challenge is invalid.",
      };
    }

    if (
      user.loginOtpAttempts >=
      MAX_LOGIN_OTP_ATTEMPTS
    ) {
      await clearLoginOtpChallenge(
        user
      );

      return {
        success: false,

        code:
          "TOO_MANY_ATTEMPTS",

        message:
          "Please start a new login verification request.",
      };
    }

    // Generate a fresh challenge so an old challenge cannot
    // remain active indefinitely.

    const newChallengeId =
      await createLoginOtpChallenge(
        user
      );

    try {
      await sendLoginOtp(
        user
      );
    } catch (error) {
      await clearLoginOtpChallenge(
        user
      );

      throw error;
    }

    return {
      success: true,

      code:
        "PHONE_OTP_RESENT",

      challengeId:
        newChallengeId,

      expiresIn:
        Math.floor(
          LOGIN_OTP_EXPIRY_MS /
            1000
        ),

      message:
        "A new verification code has been sent to your registered phone number.",
    };
  };


// ============================================================
// RECORD INITIAL PHONE VERIFICATION
// ============================================================
//
// This is called by the existing registration phone-verification
// flow after Arkesel successfully verifies the user's phone.
//
// It establishes the first 24-hour security window.
// ============================================================

const recordInitialPhoneVerification =
  async (user) => {
    if (!user) {
      throw new Error(
        "User is required."
      );
    }

    user.phoneVerified =
      true;

    user.lastPhoneVerificationAt =
      new Date();

    await user.save();

    return user;
  };


// ============================================================
// REQUIRE PHONE OTP AFTER 24 HOURS
// ============================================================

const requirePhoneOtpIfExpired =
  async (user) => {
    if (
      isPhoneVerificationValid(
        user
      )
    ) {
      return {
        required: false,

        user,
      };
    }

    const challenge =
      await startLoginOtpChallenge(
        user
      );

    return {
      required: true,

      ...challenge,

      user,
    };
  };


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  PHONE_VERIFICATION_WINDOW_MS,

  LOGIN_OTP_EXPIRY_MS,

  MAX_LOGIN_OTP_ATTEMPTS,

  isPhoneVerificationValid,

  createLoginOtpChallenge,

  clearLoginOtpChallenge,

  sendLoginOtp,

  startLoginOtpChallenge,

  verifyLoginOtp,

  resendLoginOtp,

  recordInitialPhoneVerification,

  requirePhoneOtpIfExpired,
};
