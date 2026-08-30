const bcrypt = require("bcryptjs");
const User = require("../models/User");
const PersonalWorkspaceProfile = require("../models/PersonalWorkspaceProfile");

const PASSWORD_MIN_LENGTH = 8;
const ALLOWED_IDENTIFICATION_TYPES = ["passport", "ghana_card", "voter_id"];
const PERSONAL_PURPOSES = ["personal_use", "researcher", "journalist"];

const ROLE_ACCESS = {
  personal_use: {
    accessProfile: "public_read",
    permissions: ["view_public_data", "explore_electoral_geography", "view_results", "view_candidates", "save_items", "use_ai_analyzer"],
  },
  researcher: {
    accessProfile: "research_read",
    permissions: ["view_public_data", "explore_electoral_geography", "view_results", "view_candidates", "compare_regions", "save_research", "export_public_data", "use_ai_analyzer"],
  },
  journalist: {
    accessProfile: "journalist_read",
    permissions: ["view_public_data", "explore_electoral_geography", "view_results", "view_candidates", "source_verification", "fact_check", "press_calendar", "use_ai_analyzer"],
  },
};

const normalizePhone = (phone) => {
  let value = String(phone || "").trim().replace(/\s+/g, "");
  if (/^0\d{9}$/.test(value)) value = "+233" + value.slice(1);
  if (/^233\d{9}$/.test(value)) value = "+" + value;
  return /^\+233\d{9}$/.test(value) ? value : null;
};

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const normalizeText = (value) => String(value || "").trim();

const createUsername = async (firstName, lastName) => {
  const first = String(firstName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const last = String(lastName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const base = `${first}.${last}`.replace(/[^a-z0-9._-]/g, "").slice(0, 24) || "user";
  let username = base;
  let counter = 1;
  while (await User.findOne({ username })) {
    username = `${base}${counter}`.slice(0, 30);
    counter += 1;
  }
  return username;
};

const register = async (userData = {}) => {
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
      registrationType,
      personalPurpose,
      purpose,
      scopeLevel,
      regionIds,
      constituencyIds,
      pollingStationIds,
      researchFields,
      journalismBeat,
    } = userData;

    const normalizedFirstName = normalizeText(firstName);
    const normalizedMiddleName = normalizeText(middleName);
    const normalizedLastName = normalizeText(lastName);
    const normalizedDateOfBirth = normalizeText(dateOfBirth);
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);
    const normalizedIdentification = normalizeText(identificationNumber);

    if (!normalizedFirstName || !normalizedLastName || !normalizedDateOfBirth || !identificationType || !normalizedIdentification || !normalizedEmail || !normalizedPhone || !password) {
      return { success: false, message: "First name, last name, date of birth, identification details, email, phone and password are required." };
    }
    if (normalizedFirstName.length > 80 || normalizedLastName.length > 80 || normalizedMiddleName.length > 80) {
      return { success: false, message: "Name fields are too long." };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { success: false, message: "Please provide a valid email address." };
    }
    if (!ALLOWED_IDENTIFICATION_TYPES.includes(identificationType)) {
      return { success: false, message: "Invalid identification type." };
    }
    if (String(password).length < PASSWORD_MIN_LENGTH) {
      return { success: false, message: "Password must contain at least 8 characters." };
    }

    const selectedPurpose = personalPurpose || purpose || (registrationType === "personal" ? "personal_use" : null);
    if (!selectedPurpose || !PERSONAL_PURPOSES.includes(selectedPurpose)) {
      return { success: false, message: "Please select Personal Use, Researcher or Journalist." };
    }

    const [existingEmail, existingPhone, existingIdentification] = await Promise.all([
      User.findOne({ email: normalizedEmail }),
      User.findOne({ phone: normalizedPhone }),
      User.findOne({ identificationNumber: normalizedIdentification }),
    ]);
    if (existingEmail) return { success: false, message: "An account with this email already exists." };
    if (existingPhone) return { success: false, message: "An account with this phone number already exists." };
    if (existingIdentification) return { success: false, message: "An account with this identification number already exists." };

    let finalUsername;
    if (username) {
      finalUsername = String(username).trim().toLowerCase();
      if (!/^[a-z0-9._-]+$/.test(finalUsername) || finalUsername.length < 3 || finalUsername.length > 30) {
        return { success: false, message: "Username must contain 3-30 lowercase letters, numbers, dots, underscores or hyphens." };
      }
      if (await User.findOne({ username: finalUsername })) return { success: false, message: "Username is already taken." };
    } else {
      finalUsername = await createUsername(normalizedFirstName, normalizedLastName);
    }

    const hashedPassword = await bcrypt.hash(String(password), 12);
    const user = await User.create({
      platformRole: "user",
      username: finalUsername,
      firstName: normalizedFirstName,
      middleName: normalizedMiddleName,
      lastName: normalizedLastName,
      dateOfBirth: normalizedDateOfBirth,
      nationality: normalizeText(nationality) || "Ghanaian",
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
      // Personal accounts are self-created and automatically approved.
      // Email/phone verification remains a security requirement before login.
      accountStatus: "approved",
    });

    const access = ROLE_ACCESS[selectedPurpose];
    await PersonalWorkspaceProfile.create({
      userId: user._id,
      purpose: selectedPurpose,
      scopeLevel: scopeLevel || "public_platform",
      regionIds: Array.isArray(regionIds) ? regionIds : [],
      constituencyIds: Array.isArray(constituencyIds) ? constituencyIds : [],
      pollingStationIds: Array.isArray(pollingStationIds) ? pollingStationIds : [],
      organizationName: "",
      researchFields: Array.isArray(researchFields) ? researchFields : [],
      journalismBeat: normalizeText(journalismBeat),
      accessProfile: access.accessProfile,
      permissions: access.permissions,
      onboardingComplete: true,
    });

    return {
      success: true,
      message: "Registration successful. Verify your phone and email to activate sign-in.",
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
        personalPurpose: selectedPurpose,
        accessProfile: access.accessProfile,
      },
    };
  } catch (error) {
    console.error("Registration service error:", error);
    if (error?.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      const messages = {
        email: "An account with this email already exists.",
        phone: "An account with this phone number already exists.",
        username: "Username is already taken.",
        identificationNumber: "An account with this identification number already exists.",
        userId: "A personal workspace profile already exists for this account.",
      };
      return { success: false, message: messages[duplicateField] || "An account with these details already exists." };
    }
    return { success: false, message: error.message || "Registration failed." };
  }
};

module.exports = register;
