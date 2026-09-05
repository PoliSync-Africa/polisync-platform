const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const VerificationToken = require("../models/VerificationToken");
const { sendPasswordResetEmail } = require("../services/emailService");

const router = express.Router();
const EXPIRY_MINUTES = 15;
const MAX_ATTEMPTS = 5;
const MIN_PASSWORD_LENGTH = 8;

const hashCode = (code) => crypto.createHash("sha256").update(String(code)).digest("hex");
const generateCode = () => crypto.randomInt(100000, 1000000).toString();

const activeToken = (userId) => VerificationToken.findOne({
  userId,
  purpose: "password_reset",
  channel: "email",
  usedAt: null,
  expiresAt: { $gt: new Date() },
  $expr: { $lt: ["$attempts", "$maxAttempts"] },
}).sort({ createdAt: -1 });

router.post("/forgot-password", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ success: false, message: "Email is required." });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ success: true, message: "If an account exists for this email, a password reset code has been sent." });
    }

    await VerificationToken.deleteMany({ userId: user._id, purpose: "password_reset", channel: "email", usedAt: null });

    const code = generateCode();
    await VerificationToken.create({
      userId: user._id,
      purpose: "password_reset",
      tokenHash: hashCode(code),
      channel: "email",
      expiresAt: new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000),
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      requestedIp: req.ip,
      userAgent: req.get("user-agent"),
    });

    const delivery = await sendPasswordResetEmail({ user, code });
    if (!delivery?.success) {
      await VerificationToken.deleteMany({ userId: user._id, purpose: "password_reset", channel: "email", usedAt: null });
      throw new Error(delivery?.message || "Password reset email could not be sent.");
    }

    return res.status(200).json({ success: true, message: "If an account exists for this email, a password reset code has been sent." });
  } catch (error) {
    console.error("Password reset request error:", error);
    return res.status(500).json({ success: false, message: "Password reset request failed. Please try again." });
  }
});

router.post("/verify-password-reset", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const code = String(req.body?.code || "").trim();
    if (!email || !/^\d{6}$/.test(code)) return res.status(400).json({ success: false, message: "Email and a valid 6-digit reset code are required." });

    const user = await User.findOne({ email });
    const token = user ? await activeToken(user._id) : null;
    if (!token) return res.status(400).json({ success: false, message: "Invalid or expired password reset code." });

    token.attempts += 1;
    const valid = hashCode(code) === token.tokenHash;
    await token.save();
    if (!valid) return res.status(400).json({ success: false, message: token.attempts >= token.maxAttempts ? "Too many attempts. Request a new code." : "Invalid or expired password reset code." });

    return res.status(200).json({ success: true, message: "Password reset code verified." });
  } catch (error) {
    console.error("Password reset verification error:", error);
    return res.status(500).json({ success: false, message: "Password reset verification failed." });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const code = String(req.body?.code || "").trim();
    const newPassword = String(req.body?.newPassword || "");

    if (!email || !/^\d{6}$/.test(code) || !newPassword) return res.status(400).json({ success: false, message: "Email, 6-digit reset code and new password are required." });
    if (newPassword.length < MIN_PASSWORD_LENGTH) return res.status(400).json({ success: false, message: "New password must contain at least 8 characters." });

    const user = await User.findOne({ email }).select("+password");
    const token = user ? await activeToken(user._id) : null;
    if (!token) return res.status(400).json({ success: false, message: "Invalid or expired password reset code." });

    token.attempts += 1;
    if (hashCode(code) !== token.tokenHash) {
      await token.save();
      return res.status(400).json({ success: false, message: token.attempts >= token.maxAttempts ? "Too many attempts. Request a new code." : "Invalid or expired password reset code." });
    }

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
