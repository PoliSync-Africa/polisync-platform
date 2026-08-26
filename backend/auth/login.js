const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ============================================================
// POLISYNC AFRICA — LOGIN CONTROLLER
// ============================================================
// Authentication:
//   1. Email
//   2. Password
//
// Platform roles:
//   - super_admin
//   - user
//
// Organization roles are NOT stored in User.platformRole.
// They are handled through OrganizationMembership.
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

    // ----------------------------------------------------------
    // 3. FIND USER
    // ----------------------------------------------------------
    // password has select:false in User.js, therefore we
    // explicitly request it.
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
    // 4. CHECK PASSWORD
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
    // 5. CHECK ACCOUNT STATUS
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
    // 6. SUPER ADMIN ACCESS
    // ----------------------------------------------------------
    // Super Admin is the PoliSync Africa platform authority.
    //
    // Super Admin does NOT need an organization membership
    // to access the platform.
    // ----------------------------------------------------------

    if (user.platformRole === "super_admin") {
      // Make sure the platform account is treated as approved.
      if (user.accountStatus !== "approved") {
        user.accountStatus = "approved";
        user.approvedAt = user.approvedAt || new Date();
        user.approvedBy = user.approvedBy || user._id;
      }

      user.emailVerified = true;
      user.phoneVerified = true;

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

      return res.status(200).json({
        success: true,

        message: "Welcome to PoliSync Africa.",

        token,

        user: {
          id: user._id,

          displayName: "POLISYNC AFRICA",

          username: "polisync.africa",

          platformRole: "super_admin",

          isPlatformAccount: true,

          verified: true,

          verificationBadge: "/verified-badge.png",

          accountStatus: "approved"
        },

        workspace: {
          type: "super_admin",
          name: "PoliSync Africa Super Admin"
        }
      });
    }

    // ----------------------------------------------------------
    // 7. ORDINARY USER ACCOUNT
    // ----------------------------------------------------------

    if (user.accountStatus !== "approved") {
      return res.status(403).json({
        success: false,
        message:
          "Your account has not yet been approved."
      });
    }

    // ----------------------------------------------------------
    // 8. UPDATE LOGIN INFORMATION
    // ----------------------------------------------------------

    user.lastLoginAt = new Date();
    user.isOnline = true;

    await user.save();

    // ----------------------------------------------------------
    // 9. CREATE ORDINARY USER TOKEN
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
    // 10. RETURN AUTHENTICATED USER
    // ----------------------------------------------------------
    //
    // Organization membership determines whether this user is:
    //
    // National Party Admin
    // Regional Admin
    // Constituency Admin
    // Polling Station Agent
    //
    // We deliberately do NOT create a Country Admin role.
    // ----------------------------------------------------------

    return res.status(200).json({
      success: true,

      message: "Login successful.",

      token,

      user: {
        id: user._id,

        displayName:
          user.displayName ||
          `${user.firstName} ${user.lastName}`.trim(),

        username: user.username,

        platformRole: "user",

        isPlatformAccount: false,

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
        type: "organization",
        requiresMembership: true
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
