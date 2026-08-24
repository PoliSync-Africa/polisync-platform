const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // ============================================================
    // PLATFORM ROLE
    // ============================================================
    // This is separate from organization roles.
    //
    // "super_admin" = PoliSync Africa platform authority
    // "user"        = normal personal account
    //
    // Organization roles such as Party Admin, Observer Admin,
    // Polling Agent, Parliamentary Candidate, etc. belong in
    // OrganizationMembership.js.
    // ============================================================

    platformRole: {
      type: String,
      enum: ["user", "super_admin"],
      required: true,
      default: "user",
    },

    // ============================================================
    // PERSONAL IDENTITY
    // ============================================================

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9._-]+$/,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    middleName: {
      type: String,
      trim: true,
      default: "",
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    dateOfBirth: {
      type: Date,
      required: true,
    },

    nationality: {
      type: String,
      required: true,
      default: "Ghanaian",
      trim: true,
    },

    profilePhoto: {
      type: String,
      default: null,
    },

    // ============================================================
    // IDENTIFICATION
    // ============================================================
    // Exactly one of the supported identification types is
    // required when creating the account.
    // ============================================================

    identificationType: {
      type: String,
      required: true,
      enum: ["passport", "ghana_card", "voter_id"],
    },

    identificationNumber: {
      type: String,
      required: true,
      trim: true,
    },

    // ============================================================
    // CONTACT INFORMATION
    // ============================================================

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^\+233\d{9}$/,
    },

    // ============================================================
    // AUTHENTICATION
    // ============================================================

    password: {
      type: String,
      required: true,
      select: false,
    },

    emailVerified: {
      type: Boolean,
      required: true,
      default: false,
    },

    phoneVerified: {
      type: Boolean,
      required: true,
      default: false,
    },

    // ============================================================
    // TWO-FACTOR AUTHENTICATION
    // ============================================================

    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    twoFactorMethod: {
      type: String,
      enum: ["authenticator", "sms", "email", null],
      default: null,
    },

    // ============================================================
    // APP SECURITY
    // ============================================================

    passcodeEnabled: {
      type: Boolean,
      default: false,
    },

    biometricEnabled: {
      type: Boolean,
      default: false,
    },

    // IMPORTANT:
    // We never store actual fingerprint or Face ID biometric
    // data in MongoDB. The device operating system handles
    // biometric authentication.

    // ============================================================
    // ACCOUNT APPROVAL / STATUS
    // ============================================================

    accountStatus: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "suspended",
        "deactivated",
      ],
      required: true,
      default: "pending",
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    suspendedAt: {
      type: Date,
      default: null,
    },

    suspensionReason: {
      type: String,
      default: null,
      trim: true,
    },

    // ============================================================
    // PRIVACY
    // ============================================================

    privacy: {
      messagePrivacy: {
        type: String,
        enum: ["everyone", "organizations_only", "nobody"],
        default: "nobody",
      },

      profileVisibility: {
        type: String,
        enum: ["everyone", "organizations_only", "nobody"],
        default: "nobody",
      },
    },

    // ============================================================
    // DISPLAY SETTINGS
    // ============================================================

    displaySettings: {
      skin: {
        type: String,
        default: "default",
      },

      theme: {
        type: String,
        enum: ["system", "light", "dark"],
        default: "system",
      },

      fontStyle: {
        type: String,
        default: "default",
      },

      fontSize: {
        type: String,
        enum: [
          "small",
          "medium",
          "large",
          "extra_large",
        ],
        default: "medium",
      },
    },

    // ============================================================
    // PLATFORM ACTIVITY
    // ============================================================

    lastLoginAt: {
      type: Date,
      default: null,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// NORMALIZE USERNAME
// ============================================================

userSchema.pre("save", function (next) {
  if (this.username) {
    this.username = this.username.toLowerCase().trim();
  }

  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }

  if (this.phone) {
    this.phone = this.phone.trim();
  }

  if (this.identificationNumber) {
    this.identificationNumber =
      this.identificationNumber.trim();
  }

  next();
});

// ============================================================
// MODEL
// ============================================================

module.exports =
  mongoose.models.User ||
  mongoose.model("User", userSchema);
