const bcrypt = require("bcryptjs");
const User = require("../models/User");

// ============================================================
// POLISYNC AFRICA REGISTRATION SERVICE
// ============================================================
//
// Handles:
// - User registration
// - Username generation
// - Email normalization
// - Ghana phone normalization
// - Duplicate protection
// - Identification validation
// - Password hashing
// - Account initialization
//
// IMPORTANT:
// Login remains:
// EMAIL + PASSWORD
//
// Username is generated/stored for the user's PoliSync identity
// but is NOT required for sign in.
//
// Email and phone verification are handled by the authentication
// controller / notification services.
// ============================================================

// ============================================================
// CONFIGURATION
// ============================================================

const PASSWORD_MIN_LENGTH = 8;

const ALLOWED_IDENTIFICATION_TYPES = ["passport", "ghana_card", "voter_id"];

// ============================================================
// CREATE UNIQUE USERNAME
// ============================================================

const createUsername = async (firstName, lastName) => {
  const safeFirstName = String(firstName || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const safeLastName = String(lastName || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const base =
    `${safeFirstName}.${safeLastName}`
      .replace(/[^a-z0-9._-]/g, "")
      .slice(0, 24) || "user";

  let username = base;

  let counter = 1;

  while (
    await User.findOne({
      username,
    })
  ) {
    username = `${base}${counter}`.slice(0, 30);

    counter++;
  }

  return username;
};

// ============================================================
// NORMALIZE GHANA PHONE
// ============================================================
//
// Accepted:
// 0241234567
// 233241234567
// +233241234567
//
// Stored:
// +233241234567
// ============================================================

const normalizeGhanaPhone = (phone) => {
  let value = String(phone || "")
    .trim()
    .replace(/\s+/g, "");

  if (/^0\d{9}$/.test(value)) {
    value = "+233" + value.slice(1);
  }

  if (/^233\d{9}$/.test(value)) {
    value = "+" + value;
  }

  if (!/^\+233\d{9}$/.test(value)) {
    return null;
  }

  return value;
};

// ============================================================
// NORMALIZE EMAIL
// ============================================================

const normalizeEmail = (email) => {
  return String(email || "")
    .trim()
    .toLowerCase();
};

// ============================================================
// NORMALIZE TEXT
// ============================================================

const normalizeText = (value) => {
  return String(value || "").trim();
};

// ============================================================
// REGISTER USER
// ============================================================

const register = async (userData) => {
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
    } = userData || {};

    // ==========================================================
    // NORMALIZE BASIC INFORMATION
    // ==========================================================

    const normalizedFirstName = normalizeText(firstName);

    const normalizedMiddleName = normalizeText(middleName);

    const normalizedLastName = normalizeText(lastName);

    const normalizedDateOfBirth = normalizeText(dateOfBirth);

    const normalizedEmail = normalizeEmail(email);

    const normalizedPhone = normalizeGhanaPhone(phone);

    const normalizedIdentification = normalizeText(identificationNumber);

    // ==========================================================
    // REQUIRED FIELDS
    // ==========================================================

    if (
      !normalizedFirstName ||
      !normalizedLastName ||
      !normalizedDateOfBirth ||
      !identificationType ||
      !normalizedIdentification ||
      !normalizedEmail ||
      !normalizedPhone ||
      !password
    ) {
      return {
        success: false,

        message:
          "First name, last name, date of birth, identification details, email, phone and password are required.",
      };
    }

    // ==========================================================
    // NAME VALIDATION
    // ==========================================================

    if (normalizedFirstName.length > 80) {
      return {
        success: false,

        message: "First name is too long.",
      };
    }

    if (normalizedLastName.length > 80) {
      return {
        success: false,

        message: "Last name is too long.",
      };
    }

    if (normalizedMiddleName.length > 80) {
      return {
        success: false,

        message: "Middle name is too long.",
      };
    }

    // ==========================================================
    // EMAIL VALIDATION
    // ==========================================================

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return {
        success: false,

        message: "Please provide a valid email address.",
      };
    }

    // ==========================================================
    // IDENTIFICATION TYPE
    // ==========================================================

    if (!ALLOWED_IDENTIFICATION_TYPES.includes(identificationType)) {
      return {
        success: false,

        message: "Invalid identification type.",
      };
    }

    // ==========================================================
    // PHONE VALIDATION
    // ==========================================================

    if (!normalizedPhone) {
      return {
        success: false,

        message: "Phone number must be a valid Ghana number.",
      };
    }

    // ==========================================================
    // PASSWORD VALIDATION
    // ==========================================================

    if (String(password).length < PASSWORD_MIN_LENGTH) {
      return {
        success: false,

        message: "Password must contain at least 8 characters.",
      };
    }

    // ==========================================================
    // EMAIL DUPLICATE CHECK
    // ==========================================================

    const existingEmail = await User.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      return {
        success: false,

        message: "An account with this email already exists.",
      };
    }

    // ==========================================================
    // PHONE DUPLICATE CHECK
    // ==========================================================

    const existingPhone = await User.findOne({
      phone: normalizedPhone,
    });

    if (existingPhone) {
      return {
        success: false,

        message: "An account with this phone number already exists.",
      };
    }

    // ==========================================================
    // IDENTIFICATION DUPLICATE CHECK
    // ==========================================================

    const existingIdentification = await User.findOne({
      identificationNumber: normalizedIdentification,
    });

    if (existingIdentification) {
      return {
        success: false,

        message: "An account with this identification number already exists.",
      };
    }

    // ==========================================================
    // USERNAME
    // ==========================================================
    //
    // Users do NOT need this username to sign in.
    //
    // Sign in remains:
    //
    // Email + Password
    //
    // ==========================================================

    let finalUsername;

    if (username) {
      finalUsername = String(username).trim().toLowerCase();

      if (!/^[a-z0-9._-]+$/.test(finalUsername)) {
        return {
          success: false,

          message:
            "Username may only contain lowercase letters, numbers, dots, underscores and hyphens.",
        };
      }

      if (finalUsername.length < 3 || finalUsername.length > 30) {
        return {
          success: false,

          message: "Username must contain between 3 and 30 characters.",
        };
      }

      const existingUsername = await User.findOne({
        username: finalUsername,
      });

      if (existingUsername) {
        return {
          success: false,

          message: "Username is already taken.",
        };
      }
    } else {
      finalUsername = await createUsername(
        normalizedFirstName,
        normalizedLastName
      );
    }

    // ==========================================================
    // HASH PASSWORD
    // ==========================================================

    const hashedPassword = await bcrypt.hash(String(password), 12);

    // ==========================================================
    // CREATE USER
    // ==========================================================

    const user = await User.create({
      platformRole: "user",

      username: finalUsername,

      firstName: normalizedFirstName,

      middleName: normalizedMiddleName,

      lastName: normalizedLastName,

      dateOfBirth: normalizedDateOfBirth,

      nationality: normalizeText(userData.nationality) || "Ghanaian",

      identificationType,

      identificationNumber: normalizedIdentification,

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

    // ==========================================================
    // RETURN SAFE USER DATA
    // ==========================================================
    //
    // NEVER return the password or password hash.
    // ==========================================================

    return {
      success: true,

      message: "Registration successful. Your account is pending approval.",

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
      },
    };
  } catch (error) {
    console.error("Registration service error:", error);

    // ==========================================================
    // MONGOOSE DUPLICATE KEY PROTECTION
    // ==========================================================

    if (error?.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];

      const messages = {
        email: "An account with this email already exists.",

        phone: "An account with this phone number already exists.",

        username: "Username is already taken.",

        identificationNumber:
          "An account with this identification number already exists.",
      };

      return {
        success: false,

        message:
          messages[duplicateField] ||
          "An account with these details already exists.",
      };
    }

    return {
      success: false,

      message: error.message || "Registration failed.",
    };
  }
};

module.exports = register;
