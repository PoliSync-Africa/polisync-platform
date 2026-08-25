const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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

const createUsername = async (firstName, lastName) => {
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
    // REQUIRED FIELD VALIDATION
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
    // VALIDATE IDENTIFICATION TYPE
    // --------------------------------------------------------

    const allowedIdentificationTypes = [
      "passport",
      "ghana_card",
      "voter_id",
    ];

    if (!allowedIdentificationTypes.includes(identificationType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid identification type.",
      });
    }

    // --------------------------------------------------------
    // VALIDATE PHONE
    // --------------------------------------------------------

    const normalizedPhone = phone.trim();

    if (!/^\+233\d{9}$/.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message:
          "Phone number must be in Ghana format, for example +233XXXXXXXXX.",
      });
    }

    // --------------------------------------------------------
    // NORMALIZE EMAIL
    // --------------------------------------------------------

    const normalizedEmail = email.trim().toLowerCase();

    // --------------------------------------------------------
    // CHECK EXISTING EMAIL
    // --------------------------------------------------------

    const existingEmail = await User.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // --------------------------------------------------------
    // CHECK EXISTING PHONE
    // --------------------------------------------------------

    const existingPhone = await User.findOne({
      phone: normalizedPhone,
    });

    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: "An account with this phone number already exists.",
      });
    }

    // --------------------------------------------------------
    // CHECK IDENTIFICATION NUMBER
    // --------------------------------------------------------

    const existingIdentification = await User.findOne({
      identificationNumber: identificationNumber.trim(),
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
      : await createUsername(firstName, lastName);

    if (!/^[a-z0-9._-]+$/.test(finalUsername)) {
      return res.status(400).json({
        success: false,
        message:
          "Username may only contain lowercase letters, numbers, dots, underscores and hyphens.",
      });
    }

    const existingUsername = await User.findOne({
      username: finalUsername,
    });

    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: "Username is already taken.",
      });
    }

    // --------------------------------------------------------
    // PASSWORD
    // --------------------------------------------------------

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // --------------------------------------------------------
    // CREATE USER
    // --------------------------------------------------------

    const user = await User.create({
      platformRole: "user",

      username: finalUsername,

      firstName: firstName.trim(),

      middleName: middleName
        ? middleName.trim()
        : "",

      lastName: lastName.trim(),

      dateOfBirth,

      nationality: nationality
        ? nationality.trim()
        : "Ghanaian",

      identificationType,

      identificationNumber:
        identificationNumber.trim(),

      email: normalizedEmail,

      phone: normalizedPhone,

      password: hashedPassword,

      emailVerified: false,

      phoneVerified: false,

      twoFactorEnabled: false,

      twoFactorMethod: null,

      passcodeEnabled: false,

      biometricEnabled: false,

      accountStatus: "pending",

      approvedAt: null,

      approvedBy: null,

      suspendedAt: null,

      suspensionReason: null,
    });

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.status(201).json({
      success: true,

      message:
        "Account created successfully. Your account is pending approval.",

      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        platformRole: user.platformRole,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Registration failed.",
    });
  }
};

// ============================================================
// LOGIN USER
// ============================================================

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

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
    // password is select:false in User.js,
    // therefore explicitly request it.
    // --------------------------------------------------------

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // --------------------------------------------------------
    // CHECK ACCOUNT STATUS
    // --------------------------------------------------------

    if (
      user.accountStatus === "suspended"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been suspended.",
      });
    }

    if (
      user.accountStatus === "deactivated"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been deactivated.",
      });
    }

    if (
      user.accountStatus === "rejected"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account registration was rejected.",
      });
    }

    // --------------------------------------------------------
    // VERIFY PASSWORD
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
    // UPDATE LAST LOGIN
    // --------------------------------------------------------

    user.lastLoginAt = new Date();

    await user.save();

    // --------------------------------------------------------
    // GENERATE TOKEN
    // --------------------------------------------------------

    const token = generateToken(user);

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,

      message: "Login successful.",

      token,

      user: {
        id: user._id,
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
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Login failed.",
    });
  }
};

// ============================================================
// FORGOT PASSWORD
// ============================================================

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // --------------------------------------------------------
    // PASSWORD RESET WILL BE IMPLEMENTED NEXT
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,
      message:
        "Password reset request received.",
    });
  } catch (error) {
    console.error(
      "Forgot password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Password reset failed.",
    });
  }
};
