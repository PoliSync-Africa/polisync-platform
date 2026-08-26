const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const VerificationToken = require("../models/VerificationToken");

const {
  sendEmailVerification,
  sendPhoneVerification,
  sendPasswordReset,
  sendPasswordChanged,
  sendSecurityAlert,
} = require("../services/notificationService");

const {
  verifyOTP,
} = require("../services/arkeselOtpService");

// ============================================================
// POLISYNC AFRICA AUTHENTICATION CONTROLLER
// ============================================================
//
// Handles:
// - Registration
// - Login
// - Email verification
// - Phone verification through Arkesel
// - Resending verification codes
// - Forgot password
// - Password reset
// - Password change
// - Security notifications
// - JWT authentication
//
// IMPORTANT:
//
// EMAIL OTP:
// PoliSync generates and securely stores the email verification
// code through VerificationToken.
//
// PHONE/SMS OTP:
// Arkesel generates, delivers, expires and verifies the OTP.
//
// PoliSync only updates:
//
//     user.phoneVerified = true
//
// after Arkesel confirms the OTP.
//
// SMS delivery failures do NOT cancel account creation.
// ============================================================

// ============================================================
// CONFIGURATION
// ============================================================

const VERIFICATION_CODE_EXPIRY_MINUTES = 10;

const PASSWORD_RESET_EXPIRY_MINUTES = 15;

const MAX_TOKEN_ATTEMPTS = 5;

const PASSWORD_MIN_LENGTH = 8;

// ============================================================
// GENERATE JWT
// ============================================================

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET is not configured."
    );
  }

  return jwt.sign(
    {
      id: user._id,

      platformRole:
        user.platformRole,

      email:
        user.email,

      username:
        user.username,
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
  const safeFirstName =
    String(firstName || "")
      .toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        ""
      );

  const safeLastName =
    String(lastName || "")
      .toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        ""
      );

  const base =
    `${safeFirstName}.${safeLastName}`
      .replace(
        /[^a-z0-9._-]/g,
        ""
      )
      .slice(0, 24) ||
    "user";

  let username = base;

  let counter = 1;

  while (
    await User.findOne({
      username,
    })
  ) {
    username =
      `${base}${counter}`
        .slice(0, 30);

    counter++;
  }

  return username;
};

// ============================================================
// GENERATE VERIFICATION CODE
// ============================================================
//
// Used ONLY for PoliSync-managed codes such as email
// verification and password reset.
//
// DO NOT use this for SMS OTP.
// Arkesel generates SMS OTPs.
// ============================================================

const generateVerificationCode =
  () => {
    return crypto
      .randomInt(
        100000,
        1000000
      )
      .toString();
  };

// ============================================================
// HASH VERIFICATION CODE
// ============================================================

const hashVerificationCode =
  (code) => {
    return crypto
      .createHash("sha256")
      .update(
        String(code)
      )
      .digest("hex");
  };

// ============================================================
// GET EXPIRATION DATE
// ============================================================

const getExpirationDate = (
  minutes
) => {
  return new Date(
    Date.now() +
      minutes *
        60 *
        1000
  );
};

// ============================================================
// CREATE POLISYNC VERIFICATION TOKEN
// ============================================================
//
// Used for:
// - Email verification
// - Password reset
//
// NOT used for Arkesel SMS OTP.
// ============================================================

const createVerificationToken =
  async ({
    userId,
    purpose,
    channel,
    requestedIp = null,
    userAgent = null,
    expiryMinutes,
  }) => {
    await VerificationToken.deleteMany(
      {
        userId,

        purpose,

        usedAt: null,
      }
    );

    const code =
      generateVerificationCode();

    const tokenHash =
      hashVerificationCode(
        code
      );

    const token =
      await VerificationToken.create(
        {
          userId,

          purpose,

          tokenHash,

          channel,

          expiresAt:
            getExpirationDate(
              expiryMinutes
            ),

          attempts: 0,

          maxAttempts:
            MAX_TOKEN_ATTEMPTS,

          requestedIp,

          userAgent,
        }
      );

    return {
      token,

      code,
    };
  };

// ============================================================
// FIND ACTIVE POLISYNC TOKEN
// ============================================================

const findActiveToken =
  async ({
    userId,
    purpose,
    channel,
  }) => {
    return VerificationToken.findOne(
      {
        userId,

        purpose,

        channel,

        usedAt: null,

        expiresAt: {
          $gt: new Date(),
        },

        $expr: {
          $lt: [
            "$attempts",

            "$maxAttempts",
          ],
        },
      }
    ).sort({
      createdAt: -1,
    });
  };

// ============================================================
// VERIFY POLISYNC CODE
// ============================================================
//
// Used ONLY for email/password-reset codes.
// ============================================================

const verifyCode =
  async ({
    userId,
    purpose,
    channel,
    code,
  }) => {
    const token =
      await findActiveToken({
        userId,

        purpose,

        channel,
      });

    if (!token) {
      return {
        success: false,

        reason:
          "expired_or_missing",
      };
    }

    token.attempts += 1;

    const suppliedHash =
      hashVerificationCode(
        code
      );

    if (
      suppliedHash !==
      token.tokenHash
    ) {
      await token.save();

      return {
        success: false,

        reason:
          token.attempts >=
          token.maxAttempts
            ? "too_many_attempts"
            : "invalid_code",
      };
    }

    token.usedAt =
      new Date();

    await token.save();

    return {
      success: true,

      token,
    };
  };

// ============================================================
// NORMALIZE GHANA PHONE
// ============================================================

const normalizeGhanaPhone = (
  phone
) => {
  let normalized =
    String(phone || "")
      .trim();

  if (
    /^0\d{9}$/.test(
      normalized
    )
  ) {
    normalized =
      "233" +
      normalized.slice(1);
  }

  if (
    /^\+233\d{9}$/.test(
      normalized
    )
  ) {
    normalized =
      normalized.slice(1);
  }

  if (
    !/^233\d{9}$/.test(
      normalized
    )
  ) {
    return null;
  }

  return normalized;
};

// ============================================================
// REGISTER USER
// ============================================================

exports.register = async (
  req,
  res
) => {
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

    const allowedIdentificationTypes =
      [
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
      String(phone).trim();

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
      String(email)
        .trim()
        .toLowerCase();

    // --------------------------------------------------------
    // CHECK EMAIL
    // --------------------------------------------------------

    const existingEmail =
      await User.findOne({
        email:
          normalizedEmail,
      });

    if (existingEmail) {
      return res.status(409).json({
        success: false,

        message:
          "An account with this email already exists.",
      });
    }

    // --------------------------------------------------------
    // CHECK PHONE
    // --------------------------------------------------------

    const existingPhone =
      await User.findOne({
        phone:
          normalizedPhone,
      });

    if (existingPhone) {
      return res.status(409).json({
        success: false,

        message:
          "An account with this phone number already exists.",
      });
    }

    // --------------------------------------------------------
    // CHECK IDENTIFICATION
    // --------------------------------------------------------

    const normalizedIdentification =
      String(
        identificationNumber
      ).trim();

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

    let finalUsername =
      username
        ? String(username)
            .toLowerCase()
            .trim()
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

    if (
      finalUsername.length < 3 ||
      finalUsername.length > 30
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Username must contain between 3 and 30 characters.",
      });
    }

    const existingUsername =
      await User.findOne({
        username:
          finalUsername,
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

    if (
      String(password).length <
      PASSWORD_MIN_LENGTH
    ) {
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
        platformRole:
          "user",

        username:
          finalUsername,

        firstName:
          String(firstName).trim(),

        middleName:
          middleName
            ? String(
                middleName
              ).trim()
            : "",

        lastName:
          String(lastName).trim(),

        dateOfBirth,

        nationality:
          nationality
            ? String(
                nationality
              ).trim()
            : "Ghanaian",

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

        verification: {
          isVerified:
            false,

          status:
            "not_requested",

          verificationType:
            "individual",

          requestedAt:
            null,

          requestReason:
            null,

          reviewedAt:
            null,

          reviewedBy:
            null,

          rejectionReason:
            null,

          revocationReason:
            null,

          badgeAsset:
            "/verified-badge.png",
        },
      });

    // ========================================================
    // EMAIL VERIFICATION
    // ========================================================

    const emailVerification =
      await createVerificationToken(
        {
          userId:
            user._id,

          purpose:
            "email_verification",

          channel:
            "email",

          requestedIp:
            req.ip,

          userAgent:
            req.get(
              "user-agent"
            ),

          expiryMinutes:
            VERIFICATION_CODE_EXPIRY_MINUTES,
        }
      );

    // ========================================================
    // SEND EMAIL VERIFICATION
    // ========================================================

    let emailNotification =
      null;

    try {
      emailNotification =
        await sendEmailVerification({
          user,

          code:
            emailVerification.code,
        });
    } catch (
      notificationError
    ) {
      console.error(
        "Registration email notification failed:",
        notificationError
      );
    }

    // ========================================================
    // SEND ARKESEL PHONE OTP
    // ========================================================
    //
    // IMPORTANT:
    //
    // We do NOT call createVerificationToken()
    // for SMS.
    //
    // Arkesel generates the OTP.
    //
    // notificationService.sendPhoneVerification()
    // receives:
    //
    // phone
    // firstName
    //
    // so the SMS remains personalized using FIRST NAME ONLY.
    // ========================================================

    let phoneNotification =
      null;

    try {
      phoneNotification =
        await sendPhoneVerification({
          phone:
            user.phone,

          firstName:
            user.firstName,
        });
    } catch (
      notificationError
    ) {
      console.error(
        "Registration SMS notification failed:",
        notificationError
      );
    }

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.status(201).json({
      success: true,

      message:
        "Account created successfully. Verification codes have been sent to your email and phone. Your account is pending approval.",

      user: {
        id:
          user._id,

        username:
          user.username,

        firstName:
          user.firstName,

        middleName:
          user.middleName,

        lastName:
          user.lastName,

        email:
          user.email,

        phone:
          user.phone,

        platformRole:
          user.platformRole,

        accountStatus:
          user.accountStatus,

        emailVerified:
          user.emailVerified,

        phoneVerified:
          user.phoneVerified,

        verification:
          user.getPublicVerification(),
      },

      notifications: {
        email:
          Boolean(
            emailNotification?.success
          ),

        sms:
          Boolean(
            phoneNotification?.success
          ),
      },
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
// VERIFY EMAIL
// ============================================================

exports.verifyEmail = async (
  req,
  res
) => {
  try {
    const {
      email,
      code,
    } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,

        message:
          "Email and verification code are required.",
      });
    }

    const normalizedEmail =
      String(email)
        .trim()
        .toLowerCase();

    const user =
      await User.findOne({
        email:
          normalizedEmail,
      });

    if (!user) {
      return res.status(404).json({
        success: false,

        message:
          "Account not found.",
      });
    }

    if (
      user.emailVerified
    ) {
      return res.status(200).json({
        success: true,

        message:
          "Email address is already verified.",
      });
    }

    const result =
      await verifyCode({
        userId:
          user._id,

        purpose:
          "email_verification",

        channel:
          "email",

        code:
          String(code).trim(),
      });

    if (!result.success) {
      return res.status(400).json({
        success: false,

        message:
          result.reason ===
          "too_many_attempts"
            ? "Too many incorrect attempts. Please request a new verification code."
            : result.reason ===
              "expired_or_missing"
            ? "Verification code has expired or is no longer available."
            : "Invalid verification code.",
      });
    }

    user.emailVerified =
      true;

    await user.save();

    return res.status(200).json({
      success: true,

      message:
        "Email address verified successfully.",

      user: {
        id:
          user._id,

        email:
          user.email,

        emailVerified:
          user.emailVerified,

        phoneVerified:
          user.phoneVerified,

        accountStatus:
          user.accountStatus,
      },
    });
  } catch (error) {
    console.error(
      "Email verification error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Email verification failed.",
    });
  }
};

// ============================================================
// VERIFY PHONE THROUGH ARKESEL
// ============================================================
//
// Arkesel is authoritative for the SMS OTP.
//
// PoliSync does NOT compare the OTP against MongoDB.
//
// Successful Arkesel verification causes:
//
//     user.phoneVerified = true
//
// ============================================================

exports.verifyPhone = async (
  req,
  res
) => {
  try {
    const {
      phone,
      code,
    } = req.body;

    if (!phone || !code) {
      return res.status(400).json({
        success: false,

        message:
          "Phone number and verification code are required.",
      });
    }

    const normalizedPhone =
      String(phone).trim();

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

    const user =
      await User.findOne({
        phone:
          normalizedPhone,
      });

    if (!user) {
      return res.status(404).json({
        success: false,

        message:
          "Account not found.",
      });
    }

    if (
      user.phoneVerified
    ) {
      return res.status(200).json({
        success: true,

        verified: true,

        message:
          "Phone number is already verified.",
      });
    }

    const normalizedCode =
      String(code).trim();

    if (
      !/^\d{4,15}$/.test(
        normalizedCode
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid OTP format.",
      });
    }

    // --------------------------------------------------------
    // VERIFY WITH ARKESEL
    // --------------------------------------------------------

    let arkeselResult;

    try {
      arkeselResult =
        await verifyOTP({
          phone:
            normalizedPhone,

          code:
            normalizedCode,
        });
    } catch (
      arkeselError
    ) {
      console.error(
        "Arkesel phone OTP verification error:",
        arkeselError
      );

      return res.status(502).json({
        success: false,

        message:
          "Unable to verify the phone verification code right now. Please try again.",
      });
    }

    if (
      !arkeselResult?.success ||
      !arkeselResult?.verified
    ) {
      return res.status(400).json({
        success: false,

        verified: false,

        message:
          arkeselResult?.message ||
          "Invalid or expired verification code.",

        provider:
          "arkesel",

        providerCode:
          arkeselResult?.providerCode ||
          null,
      });
    }

    // --------------------------------------------------------
    // ARKESEL CONFIRMED OTP
    // --------------------------------------------------------

    user.phoneVerified =
      true;

    await user.save();

    return res.status(200).json({
      success: true,

      verified: true,

      message:
        "Phone number verified successfully.",

      user: {
        id:
          user._id,

        emailVerified:
          user.emailVerified,

        phoneVerified:
          user.phoneVerified,

        accountStatus:
          user.accountStatus,
      },
    });
  } catch (error) {
    console.error(
      "Phone verification error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Phone verification failed.",
    });
  }
};

// ============================================================
// RESEND EMAIL VERIFICATION
// ============================================================

exports.resendEmailVerification =
  async (
    req,
    res
  ) => {
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
        String(email)
          .trim()
          .toLowerCase();

      const user =
        await User.findOne({
          email:
            normalizedEmail,
        });

      if (!user) {
        return res.status(404).json({
          success: false,

          message:
            "Account not found.",
        });
      }

      if (
        user.emailVerified
      ) {
        return res.status(200).json({
          success: true,

          message:
            "Email is already verified.",
        });
      }

      const {
        code,
      } =
        await createVerificationToken(
          {
            userId:
              user._id,

            purpose:
              "email_verification",

            channel:
              "email",

            requestedIp:
              req.ip,

            userAgent:
              req.get(
                "user-agent"
              ),

            expiryMinutes:
              VERIFICATION_CODE_EXPIRY_MINUTES,
          }
        );

      await sendEmailVerification({
        user,

        code,
      });

      return res.status(200).json({
        success: true,

        message:
          "A new email verification code has been sent.",
      });
    } catch (error) {
      console.error(
        "Resend email verification error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to resend email verification code.",
      });
    }
  };

// ============================================================
// RESEND PHONE VERIFICATION THROUGH ARKESEL
// ============================================================

exports.resendPhoneVerification =
  async (
    req,
    res
  ) => {
    try {
      const {
        phone,
      } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,

          message:
            "Phone number is required.",
        });
      }

      const normalizedPhone =
        String(phone).trim();

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

      const user =
        await User.findOne({
          phone:
            normalizedPhone,
        });

      if (!user) {
        return res.status(404).json({
          success: false,

          message:
            "Account not found.",
        });
      }

      if (
        user.phoneVerified
      ) {
        return res.status(200).json({
          success: true,

          message:
            "Phone number is already verified.",
        });
      }

      // --------------------------------------------------------
      // ARKESEL GENERATES AND SENDS A NEW OTP
      // --------------------------------------------------------

      let notification;

      try {
        notification =
          await sendPhoneVerification({
            phone:
              user.phone,

            firstName:
              user.firstName,
          });
      } catch (
        notificationError
      ) {
        console.error(
          "Resend SMS notification failed:",
          notificationError
        );

        return res.status(502).json({
          success: false,

          message:
            "Unable to send a new phone verification code. Please try again.",
        });
      }

      return res.status(200).json({
        success: true,

        message:
          "A new phone verification code has been sent.",

        notification:
          Boolean(
            notification?.success
          ),
      });
    } catch (error) {
      console.error(
        "Resend phone verification error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Unable to resend phone verification code.",
      });
    }
  };

// ============================================================
// LOGIN USER
// ============================================================

exports.login = async (
  req,
  res
) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,

        message:
          "Email and password are required.",
      });
    }

    const normalizedEmail =
      String(email)
        .trim()
        .toLowerCase();

    const user =
      await User.findOne({
        email:
          normalizedEmail,
      }).select(
        "+password"
      );

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

    user.lastLoginAt =
      new Date();

    user.lastSeenAt =
      new Date();

    user.isOnline =
      true;

    await user.save();

    // --------------------------------------------------------
    // GENERATE JWT
    // --------------------------------------------------------

    const token =
      generateToken(user);

    // --------------------------------------------------------
    // SECURITY ALERT
    // --------------------------------------------------------

    try {
      await sendSecurityAlert({
        user,

        message:
          "A successful login to your PoliSync Africa account was detected.",
      });
    } catch (
      notificationError
    ) {
      console.error(
        "Login security notification failed:",
        notificationError
      );
    }

    // --------------------------------------------------------
    // PUBLIC IDENTITY
    // --------------------------------------------------------

    const identity =
      user.getPublicIdentity();

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        "Login successful.",

      token,

      user: {
        id:
          user._id,

        displayName:
          identity.displayName,

        username:
          identity.username,

        firstName:
          user.firstName,

        middleName:
          user.middleName,

        lastName:
          user.lastName,

        email:
          user.email,

        phone:
          user.phone,

        platformRole:
          user.platformRole,

        accountStatus:
          user.accountStatus,

        emailVerified:
          user.emailVerified,

        phoneVerified:
          user.phoneVerified,

        twoFactorEnabled:
          user.twoFactorEnabled,

        verification:
          user.getPublicVerification(),

        presence:
          user.getPublicPresence(),
      },
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
// LOGOUT / PRESENCE
// ============================================================

exports.logout = async (
  req,
  res
) => {
  try {
    const userId =
      req.user?.id;

    if (userId) {
      await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            isOnline:
              false,

            lastSeenAt:
              new Date(),
          },
        }
      );
    }

    return res.status(200).json({
      success: true,

      message:
        "Logout successful.",
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
  async (
    req,
    res
  ) => {
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
        String(email)
          .trim()
          .toLowerCase();

      const user =
        await User.findOne({
          email:
            normalizedEmail,
        });

      // ------------------------------------------------------
      // SECURITY
      // ------------------------------------------------------

      if (!user) {
        return res.status(200).json({
          success: true,

          message:
            "If an account exists for this email, a password reset code has been sent.",
        });
      }

      // ------------------------------------------------------
      // CREATE RESET TOKEN
      // ------------------------------------------------------

      const {
        code,
      } =
        await createVerificationToken(
          {
            userId:
              user._id,

            purpose:
              "password_reset",

            channel:
              "email",

            requestedIp:
              req.ip,

            userAgent:
              req.get(
                "user-agent"
              ),

            expiryMinutes:
              PASSWORD_RESET_EXPIRY_MINUTES,
          }
        );

      // ------------------------------------------------------
      // SEND RESET NOTIFICATION
      // ------------------------------------------------------

      try {
        await sendPasswordReset({
          user,

          code,
        });
      } catch (
        notificationError
      ) {
        console.error(
          "Password reset notification failed:",
          notificationError
        );
      }

      return res.status(200).json({
        success: true,

        message:
          "If an account exists for this email, a password reset code has been sent.",
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
          "Password reset request failed.",
      });
    }
  };

// ============================================================
// VERIFY PASSWORD RESET CODE
// ============================================================

exports.verifyPasswordReset =
  async (
    req,
    res
  ) => {
    try {
      const {
        email,
        code,
      } = req.body;

      if (!email || !code) {
        return res.status(400).json({
          success: false,

          message:
            "Email and password reset code are required.",
        });
      }

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      const user =
        await User.findOne({
          email:
            normalizedEmail,
        });

      if (!user) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid or expired password reset code.",
        });
      }

      const result =
        await verifyCode({
          userId:
            user._id,

          purpose:
            "password_reset",

          channel:
            "email",

          code:
            String(code).trim(),
        });

      if (!result.success) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid or expired password reset code.",
        });
      }

      return res.status(200).json({
        success: true,

        message:
          "Password reset code verified. You may now create a new password.",

        resetToken:
          result.token._id,
      });
    } catch (error) {
      console.error(
        "Verify password reset error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Password reset verification failed.",
      });
    }
  };

// ============================================================
// RESET PASSWORD
// ============================================================

exports.resetPassword =
  async (
    req,
    res
  ) => {
    try {
      const {
        email,
        code,
        newPassword,
      } = req.body;

      if (
        !email ||
        !code ||
        !newPassword
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Email, reset code and new password are required.",
        });
      }

      if (
        String(newPassword).length <
        PASSWORD_MIN_LENGTH
      ) {
        return res.status(400).json({
          success: false,

          message:
            "New password must contain at least 8 characters.",
        });
      }

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      const user =
        await User.findOne({
          email:
            normalizedEmail,
        }).select(
          "+password"
        );

      if (!user) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid or expired password reset code.",
        });
      }

      const result =
        await verifyCode({
          userId:
            user._id,

          purpose:
            "password_reset",

          channel:
            "email",

          code:
            String(code).trim(),
        });

      if (!result.success) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid or expired password reset code.",
        });
      }

      user.password =
        await bcrypt.hash(
          newPassword,
          12
        );

      user.lastSeenAt =
        new Date();

      await user.save();

      try {
        await sendPasswordChanged({
          user,
        });
      } catch (
        notificationError
      ) {
        console.error(
          "Password changed notification failed:",
          notificationError
        );
      }

      return res.status(200).json({
        success: true,

        message:
          "Password reset successfully. You can now log in with your new password.",
      });
    } catch (error) {
      console.error(
        "Reset password error:",
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

// ============================================================
// CHANGE PASSWORD
// ============================================================

exports.changePassword =
  async (
    req,
    res
  ) => {
    try {
      const {
        currentPassword,
        newPassword,
      } = req.body;

      if (
        !currentPassword ||
        !newPassword
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Current password and new password are required.",
        });
      }

      if (
        String(newPassword).length <
        PASSWORD_MIN_LENGTH
      ) {
        return res.status(400).json({
          success: false,

          message:
            "New password must contain at least 8 characters.",
        });
      }

      const userId =
        req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,

          message:
            "Authentication is required.",
        });
      }

      const user =
        await User.findById(
          userId
        ).select(
          "+password"
        );

      if (!user) {
        return res.status(404).json({
          success: false,

          message:
            "Account not found.",
        });
      }

      const validPassword =
        await bcrypt.compare(
          currentPassword,
          user.password
        );

      if (!validPassword) {
        return res.status(401).json({
          success: false,

          message:
            "Current password is incorrect.",
        });
      }

      if (
        currentPassword ===
        newPassword
      ) {
        return res.status(400).json({
          success: false,

          message:
            "New password must be different from your current password.",
        });
      }

      user.password =
        await bcrypt.hash(
          newPassword,
          12
        );

      await user.save();

      try {
        await sendPasswordChanged({
          user,
        });
      } catch (
        notificationError
      ) {
        console.error(
          "Password changed notification failed:",
          notificationError
        );
      }

      return res.status(200).json({
        success: true,

        message:
          "Password changed successfully.",
      });
    } catch (error) {
      console.error(
        "Change password error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Password change failed.",
      });
    }
  };

// ============================================================
// GET AUTHENTICATED USER
// ============================================================

exports.me = async (
  req,
  res
) => {
  try {
    const userId =
      req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,

        message:
          "Authentication is required.",
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
          "Account not found.",
      });
    }

    const identity =
      user.getPublicIdentity();

    return res.status(200).json({
      success: true,

      user: {
        id:
          user._id,

        displayName:
          identity.displayName,

        username:
          identity.username,

        firstName:
          user.firstName,

        middleName:
          user.middleName,

        lastName:
          user.lastName,

        email:
          user.email,

        phone:
          user.phone,

        profilePhoto:
          user.profilePhoto,

        platformRole:
          user.platformRole,

        accountStatus:
          user.accountStatus,

        emailVerified:
          user.emailVerified,

        phoneVerified:
          user.phoneVerified,

        twoFactorEnabled:
          user.twoFactorEnabled,

        verification:
          user.getPublicVerification(),

        presence:
          user.getPublicPresence(),

        privacy:
          user.privacy,

        displaySettings:
          user.displaySettings,
      },
    });
  } catch (error) {
    console.error(
      "Get authenticated user error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Unable to retrieve account.",
    });
  }
};
