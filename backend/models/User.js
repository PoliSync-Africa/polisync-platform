const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // ============================================================
    // PLATFORM ROLE
    // ============================================================
    // "user"        = ordinary platform user
    // "super_admin" = PoliSync Africa platform authority
    //
    // Organization roles belong to OrganizationMembership.js.
    // ============================================================

    platformRole: {
      type: String,
      enum: ["user", "super_admin"],
      required: true,
      default: "user",
      index: true,
    },

    // ============================================================
    // PLATFORM / PUBLIC IDENTITY
    // ============================================================

    displayName: {
      type: String,
      trim: true,
      default: null,
    },

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

    // ============================================================
    // PERSONAL IDENTITY
    // ============================================================

    firstName: {
      type: String,
      trim: true,
      default: "",
    },

    middleName: {
      type: String,
      trim: true,
      default: "",
    },

    lastName: {
      type: String,
      trim: true,
      default: "",
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    nationality: {
      type: String,
      trim: true,
      default: "Ghanaian",
    },

    profilePhoto: {
      type: String,
      default: null,
    },

    // ============================================================
    // IDENTIFICATION
    // ============================================================
    // Required for ordinary users.
    //
    // Super Admin represents POLISYNC AFRICA and therefore does
    // not require ordinary-user identification information.
    // ============================================================

    identificationType: {
      type: String,
      enum: ["passport", "ghana_card", "voter_id", null],
      default: null,
    },

    identificationNumber: {
      type: String,
      trim: true,
      default: null,
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
    // Actual fingerprint / Face ID biometric data is NEVER stored
    // in MongoDB. The device operating system handles it.
    // ============================================================

    // ============================================================
    // ACCOUNT STATUS
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
      index: true,
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
        enum: [
          "everyone",
          "organizations_only",
          "nobody",
        ],
        default: "nobody",
      },

      profileVisibility: {
        type: String,
        enum: [
          "everyone",
          "organizations_only",
          "nobody",
        ],
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
        enum: [
          "system",
          "light",
          "dark",
        ],
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
// ORDINARY USER VALIDATION
// ============================================================

userSchema.pre("validate", function (next) {
  if (this.platformRole === "user") {
    if (!this.firstName) {
      this.invalidate(
        "firstName",
        "First name is required."
      );
    }

    if (!this.lastName) {
      this.invalidate(
        "lastName",
        "Last name is required."
      );
    }

    if (!this.dateOfBirth) {
      this.invalidate(
        "dateOfBirth",
        "Date of birth is required."
      );
    }

    if (!this.identificationType) {
      this.invalidate(
        "identificationType",
        "Identification type is required."
      );
    }

    if (!this.identificationNumber) {
      this.invalidate(
        "identificationNumber",
        "Identification number is required."
      );
    }
  }

  next();
});

// ============================================================
// SUPER ADMIN PLATFORM IDENTITY
// ============================================================
// The Super Admin represents the entire PoliSync Africa platform.
//
// Public identity:
//   Display name: POLISYNC AFRICA
//   Username:     polisync.africa
//
// The real person's personal identity is NOT used as the
// platform's public identity.
// ============================================================

userSchema.pre("validate", function (next) {
  if (this.platformRole === "super_admin") {
    this.displayName = "POLISYNC AFRICA";

    this.username = "polisync.africa";

    this.firstName = "POLISYNC";
    this.middleName = "";
    this.lastName = "AFRICA";

    this.identificationType = null;
    this.identificationNumber = null;
    this.dateOfBirth = null;
  }

  next();
});

// ============================================================
// NORMALIZATION
// ============================================================

userSchema.pre("save", function (next) {
  if (this.username) {
    this.username = this.username
      .toLowerCase()
      .trim();
  }

  if (this.email) {
    this.email = this.email
      .toLowerCase()
      .trim();
  }

  if (this.phone) {
    this.phone = this.phone.trim();
  }

  if (this.identificationNumber) {
    this.identificationNumber =
      this.identificationNumber.trim();
  }

  if (this.firstName) {
    this.firstName =
      this.firstName.trim();
  }

  if (this.middleName) {
    this.middleName =
      this.middleName.trim();
  }

  if (this.lastName) {
    this.lastName =
      this.lastName.trim();
  }

  if (this.displayName) {
    this.displayName =
      this.displayName.trim();
  }

  next();
});

// ============================================================
// PUBLIC IDENTITY
// ============================================================
// Use this whenever the platform needs to determine what name
// other users should see.
// ============================================================

userSchema.methods.getPublicIdentity =
  function () {
    if (this.platformRole === "super_admin") {
      return {
        displayName: "POLISYNC AFRICA",
        username: "polisync.africa",
        platformRole: "super_admin",
        isPlatformAccount: true,
      };
    }

    return {
      displayName:
        this.displayName ||
        `${this.firstName} ${this.lastName}`.trim(),

      username: this.username,

      platformRole: this.platformRole,

      isPlatformAccount: false,
    };
  };

// ============================================================
// SAFE PUBLIC USER PROFILE
// ============================================================
// Never expose password, identification numbers or private
// authentication information through this method.
// ============================================================

userSchema.methods.toPublicProfile =
  function () {
    const identity =
      this.getPublicIdentity();

    return {
      id: this._id,

      displayName:
        identity.displayName,

      username:
        identity.username,

      platformRole:
        identity.platformRole,

      isPlatformAccount:
        identity.isPlatformAccount,

      profilePhoto:
        this.profilePhoto,
    };
  };

// ============================================================
// MODEL
// ============================================================

module.exports =
  mongoose.models.User ||
  mongoose.model("User", userSchema);
