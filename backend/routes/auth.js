const express = require("express");

const {
  register,
  login,
  forgotPassword,
} = require("../controllers/authController");

const router = express.Router();

// ============================================================
// AUTH STATUS
// ============================================================

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "PoliSync Africa Authentication API is running.",
  });
});

// ============================================================
// AUTHENTICATION
// ============================================================

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);

// ============================================================
// TEMPORARY SUPER ADMIN BOOTSTRAP
// ============================================================
//
// This route will be used ONCE to create the
// POLISYNC AFRICA Super Admin account.
//
// IMPORTANT:
// After the account is successfully created,
// we will REMOVE this route.
//
// ============================================================

router.post("/bootstrap-super-admin", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const bcrypt = require("bcryptjs");
    const User = require("../models/User");

    // --------------------------------------------------------
    // SECURITY KEY
    // --------------------------------------------------------

    const bootstrapKey =
      process.env.SUPER_ADMIN_BOOTSTRAP_KEY;

    if (!bootstrapKey) {
      return res.status(500).json({
        success: false,
        message:
          "Super Admin bootstrap is not configured.",
      });
    }

    const providedKey =
      req.headers["x-super-admin-bootstrap-key"];

    if (
      !providedKey ||
      providedKey !== bootstrapKey
    ) {
      return res.status(403).json({
        success: false,
        message: "Invalid bootstrap key.",
      });
    }

    // --------------------------------------------------------
    // CHECK EXISTING SUPER ADMIN
    // --------------------------------------------------------

    const existingSuperAdmin =
      await User.findOne({
        platformRole: "super_admin",
      });

    if (existingSuperAdmin) {
      return res.status(409).json({
        success: false,
        message:
          "A Super Admin already exists.",
        user: {
          displayName:
            existingSuperAdmin.displayName ||
            "POLISYNC AFRICA",
          username:
            existingSuperAdmin.username,
        },
      });
    }

    // --------------------------------------------------------
    // READ ENVIRONMENT VARIABLES
    // --------------------------------------------------------

    const email =
      process.env.SUPER_ADMIN_EMAIL;

    const phone =
      process.env.SUPER_ADMIN_PHONE;

    const password =
      process.env.SUPER_ADMIN_PASSWORD;

    if (
      !email ||
      !phone ||
      !password
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Super Admin environment variables are incomplete.",
      });
    }

    if (password.length < 8) {
      return res.status(500).json({
        success: false,
        message:
          "SUPER_ADMIN_PASSWORD must contain at least 8 characters.",
      });
    }

    // --------------------------------------------------------
    // CHECK EMAIL
    // --------------------------------------------------------

    const existingEmail =
      await User.findOne({
        email: email.toLowerCase().trim(),
      });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message:
          "The Super Admin email already belongs to an account.",
      });
    }

    // --------------------------------------------------------
    // CHECK PHONE
    // --------------------------------------------------------

    const existingPhone =
      await User.findOne({
        phone: phone.trim(),
      });

    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message:
          "The Super Admin phone number already belongs to an account.",
      });
    }

    // --------------------------------------------------------
    // HASH PASSWORD
    // --------------------------------------------------------

    const hashedPassword =
      await bcrypt.hash(password, 12);

    // --------------------------------------------------------
    // CREATE POLISYNC AFRICA SUPER ADMIN
    // --------------------------------------------------------

    const user =
      await User.create({
        platformRole: "super_admin",

        displayName:
          "POLISYNC AFRICA",

        username:
          "polisync.africa",

        firstName:
          "POLISYNC",

        middleName:
          "",

        lastName:
          "AFRICA",

        dateOfBirth:
          null,

        nationality:
          "Ghanaian",

        identificationType:
          null,

        identificationNumber:
          null,

        email:
          email.toLowerCase().trim(),

        phone:
          phone.trim(),

        password:
          hashedPassword,

        emailVerified:
          false,

        phoneVerified:
          false,

        twoFactorEnabled:
          false,

        twoFactorMethod:
          null,

        passcodeEnabled:
          false,

        biometricEnabled:
          false,

        accountStatus:
          "approved",

        approvedAt:
          new Date(),

        approvedBy:
          null,

        suspendedAt:
          null,

        suspensionReason:
          null,

        privacy: {
          messagePrivacy:
            "nobody",

          profileVisibility:
            "nobody",
        },

        displaySettings: {
          skin:
            "default",

          theme:
            "system",

          fontStyle:
            "default",

          fontSize:
            "medium",
        },

        lastLoginAt:
          null,
      });

    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    return res.status(201).json({
      success: true,

      message:
        "POLISYNC AFRICA Super Admin created successfully.",

      user: {
        id:
          user._id,

        displayName:
          "POLISYNC AFRICA",

        username:
          "polisync.africa",

        platformRole:
          "super_admin",

        accountStatus:
          "approved",
      },
    });
  } catch (error) {
    console.error(
      "Super Admin bootstrap error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Super Admin bootstrap failed.",
    });
  }
});

// ============================================================
// EXPORT
// ============================================================

module.exports = router;
