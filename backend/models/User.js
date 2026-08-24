const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
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
    // One identification document is required.
    // User chooses ONE:
    // Passport OR Ghana Card OR Voter ID
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
    // Recommended, but can be enabled later.
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

    /*
     * IMPORTANT:
     * We do NOT store Face ID or fingerprint data.
     * The device operating system handles biometric authentication.
     */

    // ============================================================
    // ACCOUNT APPROVAL / STATUS
    // Every new account starts as PENDING.
    // Super Admin controls approval.
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
      default: "pending",
      required: true,
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
    // DEFAULT:
    // Nobody can message the user.
    // Nobody can discover the user's profile.
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
        enum: ["small", "medium", "large", "extra_large"],
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

    /*
     * Automatically records the date the person joined PoliSync.
     * Users cannot change this value.
     */

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

  next();
});

// ============================================================
// MODEL
// ============================================================

module.exports =
  mongoose.models.User || mongoose.model("User", userSchema);
