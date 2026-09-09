const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const VerificationToken = require("../models/VerificationToken");
const { sendPasswordResetOTP, verifyOTP, normalizeGhanaPhone } = require("../services/arkeselOtpService");

const router = express.Router();
const EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const MIN_PASSWORD_LENGTH = 8;

const hashValue = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");
const generateChallenge = () => crypto.randomBytes(32).toString("hex");

const activeToken = (userId) => VerificationToken.findOne({
  userId,
  purpose: "password_reset",
  channel: "sms",
  usedAt: null,
  expiresAt: { $gt: new Date() },
  $expr: { $lt: ["$attempts", "$maxAttempts"] },
}).sort({ createdAt: -1 });

router.post("/forgot-password", async (req, res) => {
  try {
    const phone = normalizeGhanaPhone(req.body?.phone);
    if (!phone) return res.status(400).json({ success: false, message: "Enter a valid Ghana mobile number." });

    const user = await User.findOne({ phone });
    // Do not reveal whether a phone number is registered.
    if (!user) {
      return res.status(200).json({ success: true, message: "If an account exists for this mobile number, a password reset code has been sent by SMS." });
    }

    await VerificationToken.deleteMany({ userId: user._id, purpose: "password_reset", channel: "sms", usedAt: null });

    const challenge = generateChallenge();
    await VerificationToken.create({
      userId: user._id,
      purpose: "password_reset",
      tokenHash: hashValue(challenge),
      channel: "sms",
      expiresAt: new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000),
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      requestedIp: req.ip,
      userAgent: req.get("user-agent"),
    });

    const delivery = await sendPasswordResetOTP({ phone: user.phone, firstName: user.firstName || user.name || "there" });
    if (!delivery?.success) {
      await VerificationToken.deleteMany({ userId: user._id, purpose: "password_reset", channel: "sms", usedAt: null });
      throw new Error("Password reset SMS could not be sent.");
    }

    return res.status(200).json({ success: true, message: "If an account exists for this mobile number, a password reset code has been sent by SMS." });
  } catch (error) {
    console.error("Password reset SMS request error:", error);
    return res.status(500).json({ success: false, message: "Password reset request failed. Please try again." });
  }
});

router.post("/verify-password-reset", async (req, res) => {
  try {
    const phone = normalizeGhanaPhone(req.body?.phone);
    const code = String(req.body?.code || "").trim();
    if (!phone || !/^\d{6}$/.test(code)) return res.status(400).json({ success: false, message: "Mobile number and a valid 6-digit reset code are required." });

    const user = await User.findOne({ phone });
    const token = user ? await activeToken(user._id) : null;
    if (!token) return res.status(400).json({ success: false, message: "Invalid or expired password reset code." });

    token.attempts += 1;
    const result = await verifyOTP({ phone, code });
    if (!result?.verified) {
      await token.save();
      return res.status(400).json({ success: false, message: token.attempts >= token.maxAttempts ? "Too many attempts. Request a new code." : "Invalid or expired password reset code." });
    }

    token.verifiedAt = new Date();
    await token.save();
    return res.status(200).json({ success: true, message: "Password reset code verified." });
  } catch (error) {
    console.error("Password reset SMS verification error:", error);
    return res.status(500).json({ success: false, message: "Password reset verification failed." });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const phone = normalizeGhanaPhone(req.body?.phone);
    const newPassword = String(req.body?.newPassword || "");
    if (!phone || !newPassword) return res.status(400).json({ success: false, message: "Mobile number and new password are required." });
    if (newPassword.length < MIN_PASSWORD_LENGTH) return res.status(400).json({ success: false, message: "New password must contain at least 8 characters." });

    const user = await User.findOne({ phone }).select("+password");
    const token = user ? await activeToken(user._id) : null;
    if (!token || !token.verifiedAt) return res.status(400).json({ success: false, message: "Verify your password reset code before creating a new password." });

    user.password = await bcrypt.hash(newPassword, 12);
    user.lastSeenAt = new Date();
    await user.save();

    token.usedAt = new Date();
    await token.save();

    return res.status(200).json({ success: true, message: "Password reset successfully. You can now log in with your new password." });
  } catch (error) {
    console.error("Password reset error:", error);
    return res.status(500).json({ success: false, message: "Password reset failed. Please try again." });
  }
});

module.exports = router;
