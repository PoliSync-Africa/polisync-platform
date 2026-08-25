const express = require("express");

const {
  register,
  login,
  forgotPassword,
} = require("../controllers/authController");

const router = express.Router();

// ============================================================
// FORM DATA SUPPORT
// ============================================================

router.use(express.urlencoded({ extended: false }));

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
// TEMPORARY SUPER ADMIN BOOTSTRAP PAGE
// ============================================================
//
// This is temporary.
// After POLISYNC AFRICA is successfully created,
// this entire bootstrap section will be removed.
//
// ============================================================

router.get("/bootstrap-super-admin", (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>PoliSync Africa Super Admin</title>
      </head>

      <body style="
        font-family: Arial, sans-serif;
        max-width: 500px;
        margin: 50px auto;
        padding: 20px;
      ">

        <h1>PoliSync Africa</h1>

        <h2>Super Admin Bootstrap</h2>

        <p>
          This page creates the initial POLISYNC AFRICA
          platform Super Admin account.
        </p>

        <form method="POST" action="/api/auth/bootstrap-super-admin">

          <label>
            Bootstrap Security Key
          </label>

          <br><br>

          <input
            type="password"
            name="bootstrapKey"
            required
            autocomplete="off"
            style="
              width: 100%;
              padding: 12px;
              box-sizing: border-box;
            "
          />

          <br><br>

          <button
            type="submit"
            style="
              padding: 12px 20px;
              font-size: 16px;
            "
          >
            Create Super Admin
          </button>

        </form>

      </body>
    </html>
  `);
});

// ============================================================
// CREATE SUPER ADMIN
// ============================================================

router.post("/bootstrap-super-admin", async (req, res) => {
  try {
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

    const headerKey =
      req.headers["x-super-admin-bootstrap-key"];

    const formKey =
      req.body?.bootstrapKey;

    const providedKey =
      headerKey || formKey;

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
      return res.status(409).send(`
        <h2>Super Admin already exists.</h2>
        <p>POLISYNC AFRICA is already configured.</p>
      `);
    }

    // --------------------------------------------------------
    // ENVIRONMENT VARIABLES
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

    const normalizedEmail =
      email.toLowerCase().trim();

    const existingEmail =
      await User.findOne({
        email: normalizedEmail,
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

    const normalizedPhone =
      phone.trim();

    const existingPhone =
      await User.findOne({
        phone: normalizedPhone,
      });

    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message:
          "The Super Admin phone number already belongs to an account.",
      });
    }

    // --------------------------------------------------------
    // CHECK USERNAME
    // --------------------------------------------------------

    const existingUsername =
      await User.findOne({
        username: "polisync.africa",
      });

    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message:
          "The POLISYNC AFRICA username already exists.",
      });
    }

    // --------------------------------------------------------
    // HASH PASSWORD
    // --------------------------------------------------------

    const hashedPassword =
      await bcrypt.hash(password, 12);

    // --------------------------------------------------------
    // CREATE PLATFORM SUPER ADMIN
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
          normalizedEmail,

        phone:
          normalizedPhone,

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

    return res.status(201).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Super Admin Created</title>
        </head>

        <body style="
          font-family: Arial, sans-serif;
          max-width: 500px;
          margin: 50px auto;
          padding: 20px;
        ">

          <h1>✓ Super Admin Created</h1>

          <h2>POLISYNC AFRICA</h2>

          <p>
            The PoliSync Africa platform Super Admin
            has been created successfully.
          </p>

          <p>
            <strong>Username:</strong>
            polisync.africa
          </p>

          <p>
            <strong>Platform Role:</strong>
            super_admin
          </p>

          <p>
            <strong>Status:</strong>
            approved
          </p>

          <p>
            The private account email and phone number
            are not the public platform identity.
          </p>

        </body>
      </html>
    `);

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
