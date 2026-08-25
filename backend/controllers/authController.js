const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");

// ============================================================
// GENERATE JWT
// ============================================================

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      platformRole: user.platformRole,
      email: user.email,
      username: user.username,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// ============================================================
// CREATE USERNAME
// ============================================================

const createUsername = async (
  firstName,
  lastName
) => {
  const base =
    `${firstName}.${lastName}`
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "")
      .slice(0, 24) || "user";

  let username = base;
  let counter = 1;

  while (await User.findOne({ username })) {
    username = `${base}${counter}`;
    counter++;
  }

  return username;
};

// ============================================================
// SAFE PUBLIC USER
// ============================================================

const getSafeUser = (user) => {
  if (user.platformRole === "super_admin") {
    return {
      id: user._id,
      displayName: "POLISYNC AFRICA",
      username: "polisync.africa",
      platformRole: "super_admin",
      accountStatus: user.accountStatus,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      profilePhoto: user.profilePhoto,
      isPlatformAccount: true,
      isOnline: user.isOnline,
      lastSeenAt: user.lastSeenAt,
    };
  }

  return {
    id: user._id,

    displayName:
      user.displayName ||
      `${user.firstName} ${user.lastName}`.trim(),

    username: user.username,

    firstName: user.firstName,

    middleName: user.middleName,

    lastName: user.lastName,

    email: user.email,

    phone: user.phone,

    platformRole: user.platformRole,

    accountStatus: user.accountStatus,

    emailVerified: user.emailVerified,

    phoneVerified: user.phoneVerified,

    twoFactorEnabled:
      user.twoFactorEnabled,

    profilePhoto:
      user.profilePhoto,

    isPlatformAccount: false,

    isOnline: user.isOnline,

    lastSeenAt: user.lastSeenAt,
  };
};

// ============================================================
// REGISTER USER
// ============================================================

exports.register = async (req, res) => {
  try {
    const {
      username,
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      nationality,
      identificationType,
      identificationNumber,
      email,
      phone,
      password,
    } = req.body;

    // --------------------------------------------------------
    // REQUIRED FIELDS
    // --------------------------------------------------------

    if (
      !firstName ||
      !lastName ||
      !dateOfBirth ||
      !identificationType ||
      !identificationNumber ||
      !email ||
      !phone ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "First name, last name, date of birth, identification details, email, phone and password are required.",
      });
    }

    // --------------------------------------------------------
    // IDENTIFICATION TYPE
    // --------------------------------------------------------

    const allowedIdentificationTypes = [
      "passport",
      "ghana_card",
      "voter_id",
    ];

    if (
      !allowedIdentificationTypes.includes(
        identificationType
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid identification type.",
      });
    }

    // --------------------------------------------------------
    // PHONE
    // --------------------------------------------------------

    const normalizedPhone =
      phone.trim();

    if (
      !/^\+233\d{9}$/.test(
        normalizedPhone
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Phone number must be in Ghana format, for example +233XXXXXXXXX.",
      });
    }

    // --------------------------------------------------------
    // EMAIL
    // --------------------------------------------------------

    const normalizedEmail =
      email.trim().toLowerCase();

    // --------------------------------------------------------
    // DUPLICATE EMAIL
    // --------------------------------------------------------

    const existingEmail =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    // --------------------------------------------------------
    // DUPLICATE PHONE
    // --------------------------------------------------------

    const existingPhone =
      await User.findOne({
        phone: normalizedPhone,
      });

    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this phone number already exists.",
      });
    }

    // --------------------------------------------------------
    // IDENTIFICATION DUPLICATE
    // --------------------------------------------------------

    const normalizedIdentification =
      identificationNumber.trim();

    const existingIdentification =
      await User.findOne({
        identificationNumber:
          normalizedIdentification,
      });

    if (existingIdentification) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this identification number already exists.",
      });
    }

    // --------------------------------------------------------
    // USERNAME
    // --------------------------------------------------------

    let finalUsername = username
      ? username.toLowerCase().trim()
      : await createUsername(
          firstName,
          lastName
        );

    if (
      !/^[a-z0-9._-]+$/.test(
        finalUsername
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Username may only contain lowercase letters, numbers, dots, underscores and hyphens.",
      });
    }

    const existingUsername =
      await User.findOne({
        username: finalUsername,
      });

    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message:
          "Username is already taken.",
      });
    }

    // --------------------------------------------------------
    // PASSWORD
    // --------------------------------------------------------

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters.",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );

    // --------------------------------------------------------
    // CREATE USER
    // --------------------------------------------------------

    const user =
      await User.create({
        platformRole: "user",

        displayName: null,

        username:
          finalUsername,

        firstName:
          firstName.trim(),

        middleName:
          middleName
            ? middleName.trim()
            : "",

        lastName:
          lastName.trim(),

        dateOfBirth,

        nationality:
          nationality
            ? nationality.trim()
            : "Ghanaian",

        profilePhoto: null,

        identificationType,

        identificationNumber:
          normalizedIdentification,

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
          "pending",

        approvedAt:
          null,

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

          showOnlineStatus:
            true,

          showLastSeen:
            true,

          shareLocation:
            false,

          locationVisibility:
            "nobody",

          locationPrecision:
            "approximate",

          locationSharingDuration:
            "until_turned_off",
        },

        locationPermissionGranted:
          false,

        currentLocation: {
          latitude: null,
          longitude: null,
          accuracy: null,
          updatedAt: null,
        },

        locationExpiresAt:
          null,

        isOnline:
          false,

        lastLoginAt:
          null,

        lastSeenAt:
          null,
      });

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.status(201).json({
      success: true,

      message:
        "Account created successfully. Your account is pending approval.",

      user: getSafeUser(user),
    });
  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Registration failed.",
    });
  }
};

// ============================================================
// LOGIN USER
// ============================================================

exports.login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required.",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    // --------------------------------------------------------
    // FIND USER
    // --------------------------------------------------------

    const user =
      await User.findOne({
        email: normalizedEmail,
      }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    // --------------------------------------------------------
    // ACCOUNT STATUS
    // --------------------------------------------------------

    if (
      user.accountStatus ===
      "suspended"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been suspended.",
      });
    }

    if (
      user.accountStatus ===
      "deactivated"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been deactivated.",
      });
    }

    if (
      user.accountStatus ===
      "rejected"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account registration was rejected.",
      });
    }

    // --------------------------------------------------------
    // PASSWORD
    // --------------------------------------------------------

    const validPassword =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    // --------------------------------------------------------
    // UPDATE PRESENCE
    // --------------------------------------------------------

    const now =
      new Date();

    user.lastLoginAt = now;

    user.lastSeenAt = now;

    user.isOnline = true;

    await user.save();

    // --------------------------------------------------------
    // TOKEN
    // --------------------------------------------------------

    const token =
      generateToken(user);

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        "Login successful.",

      token,

      user:
        getSafeUser(user),
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Login failed.",
    });
  }
};

// ============================================================
// LOGOUT USER
// ============================================================

exports.logout = async (req, res) => {
  try {
    const userId =
      req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const user =
      await User.findById(
        userId
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    user.isOnline = false;

    user.lastSeenAt =
      new Date();

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Logged out successfully.",
    });
  } catch (error) {
    console.error(
      "Logout error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Logout failed.",
    });
  }
};

// ============================================================
// FORGOT PASSWORD
// ============================================================

exports.forgotPassword =
  async (req, res) => {
    try {
      const {
        email,
      } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message:
            "Email is required.",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      const user =
        await User.findOne({
          email: normalizedEmail,
        });

      // ------------------------------------------------------
      // SECURITY
      // ------------------------------------------------------
      // Do not reveal whether an email exists.
      // This prevents account enumeration.
      // ------------------------------------------------------

      if (!user) {
        return res.status(200).json({
          success: true,
          message:
            "If an account exists for this email, password reset instructions will be sent.",
        });
      }

      // ------------------------------------------------------
      // GENERATE RESET TOKEN
      // ------------------------------------------------------

      const resetToken =
        crypto.randomBytes(32)
          .toString("hex");

      const resetTokenHash =
        crypto
          .createHash("sha256")
          .update(resetToken)
          .digest("hex");

      // ------------------------------------------------------
      // TEMPORARY RESET STORAGE
      // ------------------------------------------------------
      // These fields will be added to User.js in the next
      // password-reset upgrade.
      //
      // For now we do not save them because the current model
      // does not yet contain reset-token fields.
      // ------------------------------------------------------

      console.log(
        "Password reset token generated for:",
        user.email
      );

      console.log(
        "Reset token hash:",
        resetTokenHash
      );

      // Prevent unused-variable warnings while the email
      // service is being built.
      void resetToken;

      return res.status(200).json({
        success: true,
        message:
          "If an account exists for this email, password reset instructions will be sent.",
      });
    } catch (error) {
      console.error(
        "Forgot password error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Password reset request failed.",
      });
    }
  };

// ============================================================
// EXPORT HELPERS
// ============================================================

exports.generateToken =
  generateToken;

exports.getSafeUser =
  getSafeUser;
