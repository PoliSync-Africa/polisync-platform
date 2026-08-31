const crypto = require("crypto");
const User = require("../models/User");
const { sendLoginOTP, verifyOTP } = require("../services/arkeselOtpService");

const PHONE_VERIFICATION_WINDOW_MS = 24 * 60 * 60 * 1000;
const LOGIN_OTP_EXPIRY_MS = 5 * 60 * 1000;
const MAX_LOGIN_OTP_ATTEMPTS = 5;

const isPhoneVerificationValid = (user) => {
  if (!user || !user.phoneVerified || !user.lastPhoneVerificationAt) return false;
  const lastVerification = new Date(user.lastPhoneVerificationAt).getTime();
  return !Number.isNaN(lastVerification) && Date.now() - lastVerification < PHONE_VERIFICATION_WINDOW_MS;
};

const createLoginOtpChallenge = async (user) => {
  if (!user?.phone) throw new Error("A registered phone number is required.");
  const challengeId = crypto.randomBytes(32).toString("hex");
  user.loginOtpChallengeHash = crypto.createHash("sha256").update(challengeId).digest("hex");
  user.loginOtpExpiresAt = new Date(Date.now() + LOGIN_OTP_EXPIRY_MS);
  user.loginOtpAttempts = 0;
  await user.save();
  return challengeId;
};

const clearLoginOtpChallenge = async (user) => {
  if (!user) return;
  user.loginOtpChallengeHash = null;
  user.loginOtpExpiresAt = null;
  user.loginOtpAttempts = 0;
  await user.save();
};

const sendLoginOtp = async (user) => {
  if (!user?.phone) throw new Error("No registered phone number is available.");
  return sendLoginOTP({ phone: user.phone, firstName: user.firstName, expiry: 5, length: 6 });
};

const startLoginOtpChallenge = async (user) => {
  if (!user) throw new Error("User is required.");
  if (!user.phoneVerified) {
    return { success: false, code: "PHONE_NOT_VERIFIED", message: "The registered phone number must be verified before login security can be completed." };
  }
  const challengeId = await createLoginOtpChallenge(user);
  try {
    await sendLoginOtp(user);
  } catch (error) {
    await clearLoginOtpChallenge(user);
    throw error;
  }
  return { success: true, code: "PHONE_OTP_REQUIRED", challengeId, expiresIn: 300, message: "A verification code has been sent to your registered phone number." };
};

const verifyLoginOtp = async ({ userId, challengeId, code }) => {
  if (!userId || !challengeId || !code) return { success: false, code: "INVALID_REQUEST", message: "User ID, challenge ID and OTP are required." };
  const user = await User.findById(userId).select("+loginOtpChallengeHash +loginOtpExpiresAt");
  if (!user) return { success: false, code: "USER_NOT_FOUND", message: "Account not found." };
  if (["suspended", "deactivated", "rejected"].includes(user.accountStatus)) return { success: false, code: `ACCOUNT_${String(user.accountStatus).toUpperCase()}`, message: `This account has been ${user.accountStatus}.` };

  const challengeHash = crypto.createHash("sha256").update(String(challengeId)).digest("hex");
  if (!user.loginOtpChallengeHash || user.loginOtpChallengeHash !== challengeHash) return { success: false, code: "INVALID_CHALLENGE", message: "The login verification challenge is invalid." };
  if (!user.loginOtpExpiresAt || user.loginOtpExpiresAt <= new Date()) {
    await clearLoginOtpChallenge(user);
    return { success: false, code: "PHONE_OTP_EXPIRED", message: "The verification code has expired. Please request a new code." };
  }
  if (user.loginOtpAttempts >= MAX_LOGIN_OTP_ATTEMPTS) {
    await clearLoginOtpChallenge(user);
    return { success: false, code: "TOO_MANY_ATTEMPTS", message: "Too many incorrect verification attempts. Please request a new code." };
  }

  let verificationResult;
  try {
    verificationResult = await verifyOTP({ phone: user.phone, code: String(code).trim() });
  } catch (error) {
    console.error("PoliSync login OTP verification error:", error);
    return { success: false, code: "OTP_SERVICE_ERROR", message: "Unable to verify the phone code at this time." };
  }

  if (!verificationResult?.success) {
    user.loginOtpAttempts = (user.loginOtpAttempts || 0) + 1;
    await user.save();
    if (user.loginOtpAttempts >= MAX_LOGIN_OTP_ATTEMPTS) {
      await clearLoginOtpChallenge(user);
      return { success: false, code: "TOO_MANY_ATTEMPTS", message: "Too many incorrect verification attempts. Please request a new code." };
    }
    return { success: false, code: "INVALID_PHONE_OTP", message: "Invalid or expired verification code.", remainingAttempts: MAX_LOGIN_OTP_ATTEMPTS - user.loginOtpAttempts };
  }

  user.phoneVerified = true;
  user.lastPhoneVerificationAt = new Date();
  user.loginOtpChallengeHash = null;
  user.loginOtpExpiresAt = null;
  user.loginOtpAttempts = 0;
  await user.save();
  return { success: true, code: "PHONE_OTP_VERIFIED", message: "Phone verification successful.", userId: user._id, lastPhoneVerificationAt: user.lastPhoneVerificationAt };
};

const resendLoginOtp = async ({ userId, challengeId }) => {
  if (!userId || !challengeId) return { success: false, code: "INVALID_REQUEST", message: "User ID and challenge ID are required." };
  const user = await User.findById(userId).select("+loginOtpChallengeHash +loginOtpExpiresAt");
  if (!user) return { success: false, code: "USER_NOT_FOUND", message: "Account not found." };
  const challengeHash = crypto.createHash("sha256").update(String(challengeId)).digest("hex");
  if (!user.loginOtpChallengeHash || user.loginOtpChallengeHash !== challengeHash) return { success: false, code: "INVALID_CHALLENGE", message: "The login verification challenge is invalid." };
  if (user.loginOtpAttempts >= MAX_LOGIN_OTP_ATTEMPTS) {
    await clearLoginOtpChallenge(user);
    return { success: false, code: "TOO_MANY_ATTEMPTS", message: "Please start a new login verification request." };
  }
  const newChallengeId = await createLoginOtpChallenge(user);
  try {
    await sendLoginOtp(user);
  } catch (error) {
    await clearLoginOtpChallenge(user);
    throw error;
  }
  return { success: true, code: "PHONE_OTP_RESENT", challengeId: newChallengeId, expiresIn: 300, message: "A new verification code has been sent to your registered phone number." };
};

const recordInitialPhoneVerification = async (user) => {
  if (!user) throw new Error("User is required.");
  user.phoneVerified = true;
  user.lastPhoneVerificationAt = new Date();
  await user.save();
  return user;
};

const requirePhoneOtpIfExpired = async (user) => {
  if (isPhoneVerificationValid(user)) return { required: false, user };
  const challenge = await startLoginOtpChallenge(user);
  return { required: true, ...challenge, user };
};

module.exports = { PHONE_VERIFICATION_WINDOW_MS, LOGIN_OTP_EXPIRY_MS, MAX_LOGIN_OTP_ATTEMPTS, isPhoneVerificationValid, createLoginOtpChallenge, clearLoginOtpChallenge, sendLoginOtp, startLoginOtpChallenge, verifyLoginOtp, resendLoginOtp, recordInitialPhoneVerification, requirePhoneOtpIfExpired };
