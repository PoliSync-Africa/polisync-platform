const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

const SUPER_ADMIN_EMAIL = "danielamonyamekye@gmail.com";
const SUPER_ADMIN_PHONE = "+233540992581";
const SUPER_ADMIN_USERNAME = "polisync.africa";

router.get("/bootstrap-super-admin", async (req, res) => {
  try {
    const existing = await User.exists({ platformRole: "super_admin" });
    return res.json({
      success: true,
      bootstrapAvailable: !existing,
      message: existing ? "A Super Admin account already exists." : "Super Admin bootstrap is available.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to check Super Admin bootstrap status." });
  }
});

router.post("/bootstrap-super-admin", async (req, res) => {
  try {
    const setupSecret = String(process.env.SETUP_SECRET || "").trim();
    const suppliedSecret = String(req.headers["x-setup-secret"] || req.body?.setupSecret || "").trim();

    if (!setupSecret || suppliedSecret !== setupSecret) {
      return res.status(403).json({ success: false, message: "Valid setup authorization is required." });
    }

    const existing = await User.findOne({ platformRole: "super_admin" });
    if (existing) {
      return res.status(409).json({ success: false, message: "A Super Admin account already exists." });
    }

    const password = String(process.env.SUPER_ADMIN_PASSWORD || "");
    if (password.length < 8) {
      return res.status(500).json({ success: false, message: "SUPER_ADMIN_PASSWORD must contain at least 8 characters." });
    }

    const emailConflict = await User.findOne({ email: SUPER_ADMIN_EMAIL });
    if (emailConflict) return res.status(409).json({ success: false, message: "The Super Admin email already belongs to another account." });

    const phoneConflict = await User.findOne({ phone: SUPER_ADMIN_PHONE });
    if (phoneConflict) return res.status(409).json({ success: false, message: "The Super Admin phone already belongs to another account." });

    const usernameConflict = await User.findOne({ username: SUPER_ADMIN_USERNAME });
    if (usernameConflict) return res.status(409).json({ success: false, message: "The Super Admin username already exists." });

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      platformRole: "super_admin",
      displayName: "POLISYNC AFRICA",
      username: SUPER_ADMIN_USERNAME,
      firstName: "POLISYNC",
      middleName: "",
      lastName: "AFRICA",
      email: SUPER_ADMIN_EMAIL,
      phone: SUPER_ADMIN_PHONE,
      password: hashedPassword,
      emailVerified: true,
      phoneVerified: true,
      accountStatus: "approved",
      approvedAt: new Date(),
      lastPhoneVerificationAt: null,
    });

    return res.status(201).json({
      success: true,
      message: "Super Admin created successfully. The first login will require phone OTP verification.",
      user: {
        id: user._id,
        displayName: user.displayName,
        username: user.username,
        platformRole: user.platformRole,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error) {
    console.error("Super Admin bootstrap error:", error);
    return res.status(500).json({ success: false, message: error.message || "Unable to bootstrap Super Admin." });
  }
});

module.exports = router;
