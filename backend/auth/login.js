const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ============================================================
// POLISYNC AFRICA — LOGIN CONTROLLER
// ============================================================
// Login:
//   1. Email
//   2. Password
//
// Platform roles:
//   - super_admin
//   - user
//
// Organization roles are handled separately through
// OrganizationMembership.
//
// Organization roles:
//   - national_party_admin
//   - regional_admin
//   - constituency_admin
//   - polling_station_agent
//
// NO:
//   - Google login
//   - Apple ID login
//   - Facebook login
//   - Country Admin
// ============================================================

const login = async (req, res) => {
  try {
    // ----------------------------------------------------------
    // 1. READ LOGIN DETAILS
    // ----------------------------------------------------------

    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    // ----------------------------------------------------------
    // 2. NORMALIZE EMAIL
    // ----------------------------------------------------------

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Email address is required."
      });
    }

    if (!String(password).trim()) {
      return res.status(400).json({
        success: false,
        message: "Password is required."
      });
    }

    // ----------------------------------------------------------
    // 3. CHECK JWT SECRET
    // ----------------------------------------------------------

    if (!process.env.JWT_SECRET) {
      console.error(
        "POLISYNC AUTH ERROR: JWT_SECRET is not configured."
      );

      return res.status(500).json({
        success: false,
        message:
          "Authentication service is not properly configured."
      });
    }

    // ----------------------------------------------------------
    // 4. FIND USER
    // ----------------------------------------------------------
    // User.password uses select:false, so explicitly request it.
    // ----------------------------------------------------------

    const user = await User.findOne({
      email: normalizedEmail
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    // ----------------------------------------------------------
    // 5. VERIFY PASSWORD
    // ----------------------------------------------------------

    const passwordMatches = await bcrypt.compare(
      String(password),
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    // ----------------------------------------------------------
    // 6. ACCOUNT STATUS
    // ----------------------------------------------------------

    if (user.accountStatus === "suspended") {
      return res.status(403).json({
        success: false,
        message: "This account has been suspended."
      });
    }

    if (user.accountStatus === "deactivated") {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated."
      });
    }

    if (user.accountStatus === "rejected") {
      return res.status(403).json({
        success: false,
        message: "This account has been rejected."
      });
    }

    // ----------------------------------------------------------
    // 7. SUPER ADMIN
    // ----------------------------------------------------------
    // Super Admin is the platform authority.
    //
    // Super Admin does not require an organization membership
    // to access the PoliSync Africa platform.
    // ----------------------------------------------------------

    if (user.platformRole === "super_admin") {
      // Super Admin must be approved.
      if (user.accountStatus !== "approved") {
        return res.status(403).json({
          success: false,
          message:
            "The Super Admin account is not approved."
        });
      }

      // --------------------------------------------------------
      // EMAIL VERIFICATION
      // --------------------------------------------------------
      // Login must NOT automatically verify the account.
      // The email confirmation process must do that.
      // --------------------------------------------------------

      if (!user.emailVerified) {
        return res.status(403).json({
          success: false,
          code: "EMAIL_NOT_VERIFIED",
          message:
            "Please verify your email before accessing PoliSync Africa."
        });
      }

      // --------------------------------------------------------
      // UPDATE LOGIN INFORMATION
      // --------------------------------------------------------

      user.lastLoginAt = new Date();
      user.isOnline = true;

      await user.save();

      // --------------------------------------------------------
      // CREATE SUPER ADMIN TOKEN
      // --------------------------------------------------------

      const token = jwt.sign(
        {
          userId: user._id.toString(),
          platformRole: "super_admin"
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d"
        }
      );

      // --------------------------------------------------------
      // SUPER ADMIN RESPONSE
      // --------------------------------------------------------

      return res.status(200).json({
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

          verified:
            true,

          verificationBadge:
            "/verified-badge.png",

          accountStatus:
            "approved"
        },

        workspace: {
          type:
            "super_admin",

          name:
            "PoliSync Africa Super Admin"
        }
      });
    }

    // ----------------------------------------------------------
    // 8. ORDINARY USER
    // ----------------------------------------------------------

    if (user.platformRole !== "user") {
      return res.status(403).json({
        success: false,
        message:
          "This account has an invalid platform role."
      });
    }

    // ----------------------------------------------------------
    // 9. ORDINARY USER ACCOUNT APPROVAL
    // ----------------------------------------------------------

    if (user.accountStatus !== "approved") {
      return res.status(403).json({
        success: false,
        message:
          "Your account has not yet been approved."
      });
    }

    // ----------------------------------------------------------
    // 10. ORDINARY USER EMAIL VERIFICATION
    // ----------------------------------------------------------

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message:
          "Please verify your email before logging in."
      });
    }

    // ----------------------------------------------------------
    // 11. UPDATE LOGIN INFORMATION
    // ----------------------------------------------------------

    user.lastLoginAt = new Date();
    user.isOnline = true;

    await user.save();

    // ----------------------------------------------------------
    // 12. CREATE ORDINARY USER TOKEN
    // ----------------------------------------------------------

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        platformRole: "user"
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    // ----------------------------------------------------------
    // 13. ORDINARY USER RESPONSE
    // ----------------------------------------------------------
    //
    // OrganizationMembership determines whether the user is:
    //
    // National Party Admin
    // Regional Admin
    // Constituency Admin
    // Polling Station Agent
    //
    // There is deliberately NO Country Admin.
    // ----------------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        "Login successful.",

      token,

      user: {
        id:
          user._id,

        displayName:
          user.displayName ||
          `${user.firstName} ${user.lastName}`.trim(),

        username:
          user.username,

        platformRole:
          "user",

        isPlatformAccount:
          false,

        verified:
          Boolean(
            user.verification &&
            user.verification.isVerified &&
            user.verification.status === "approved"
          ),

        verificationBadge:
          user.verification &&
          user.verification.isVerified
            ? "/verified-badge.png"
            : null,

        accountStatus:
          user.accountStatus
      },

      workspace: {
        type:
          "organization",

        requiresMembership:
          true
      }
    });

  } catch (error) {
    console.error(
      "PoliSync login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to complete login at this time."
    });
  }
};

module.exports = login;
