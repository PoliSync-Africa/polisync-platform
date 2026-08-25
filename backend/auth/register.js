const bcrypt = require("bcryptjs");
const User = require("../models/User");

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
    } = userData;

    // ============================================================
    // REQUIRED FIELDS
    // ============================================================

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
      return {
        success: false,
        message:
          "First name, last name, date of birth, identification details, email, phone and password are required.",
      };
    }

    // ============================================================
    // IDENTIFICATION TYPE
    // ============================================================

    const allowedIdentificationTypes = [
      "passport",
      "ghana_card",
      "voter_id",
    ];

    if (!allowedIdentificationTypes.includes(identificationType)) {
      return {
        success: false,
        message: "Invalid identification type.",
      };
    }

    // ============================================================
    // PHONE
    // ============================================================

    const normalizedPhone = phone.trim();

    if (!/^\+233\d{9}$/.test(normalizedPhone)) {
      return {
        success: false,
        message:
          "Phone number must be in Ghana format, for example +233XXXXXXXXX.",
      };
    }

    // ============================================================
    // EMAIL
    // ============================================================

    const normalizedEmail = email.trim().toLowerCase();

    const existingEmail = await User.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      return {
        success: false,
        message: "An account with this email already exists.",
      };
    }

    // ============================================================
    // PHONE DUPLICATE CHECK
    // ============================================================

    const existingPhone = await User.findOne({
      phone: normalizedPhone,
    });

    if (existingPhone) {
      return {
        success: false,
        message:
          "An account with this phone number already exists.",
      };
    }

    // ============================================================
    // IDENTIFICATION DUPLICATE CHECK
    // ============================================================

    const normalizedIdentification =
      identificationNumber.trim();

    const existingIdentification =
      await User.findOne({
        identificationNumber:
          normalizedIdentification,
      });

    if (existingIdentification) {
      return {
        success: false,
        message:
          "An account with this identification number already exists.",
      };
    }

    // ============================================================
    // USERNAME
    // ============================================================

    let finalUsername = username
      ? username.toLowerCase().trim()
      : await createUsername(
          firstName,
          lastName
        );

    if (!/^[a-z0-9._-]+$/.test(finalUsername)) {
      return {
        success: false,
        message:
          "Username may only contain lowercase letters, numbers, dots, underscores and hyphens.",
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

    // ============================================================
    // PASSWORD
    // ============================================================

    if (password.length < 8) {
      return {
        success: false,
        message:
          "Password must contain at least 8 characters.",
      };
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    // ============================================================
    // CREATE USER
    // ============================================================

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
        normalizedIdentification,

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

    // ============================================================
    // RETURN SAFE USER DATA
    // ============================================================

    return {
      success: true,

      message:
        "Registration successful. Your account is pending approval.",

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
    };
  } catch (error) {
    console.error(
      "Registration service error:",
      error
    );

    return {
      success: false,
      message:
        error.message ||
        "Registration failed.",
    };
  }
};

module.exports = register;
