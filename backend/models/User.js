const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // ============================================================
    // PLATFORM ROLE
    // ============================================================
    // "user"        = ordinary PoliSync Africa account
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
      enum: [
        "passport",
        "ghana_card",
        "voter_id",
        null,
      ],
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
      enum: [
        "authenticator",
        "sms",
        "email",
        null,
      ],
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
    // VERIFICATION
    // ============================================================
    // Verification is separate from email/phone verification.
    //
    // Ordinary users must REQUEST verification.
    //
    // ONLY the PoliSync Africa Super Admin may approve, reject,
    // or revoke a verification request.
    //
    // The controller/service layer must enforce the Super Admin
    // authorization before changing reviewed fields.
    // ============================================================

    verification: {
      // ----------------------------------------------------------
      // VERIFIED BADGE
      // ----------------------------------------------------------

      isVerified: {
        type: Boolean,
        default: false,
        index: true,
      },

      // ----------------------------------------------------------
      // VERIFICATION REQUEST STATUS
      // ----------------------------------------------------------

      status: {
        type: String,
        enum: [
          "not_requested",
          "pending",
          "approved",
          "rejected",
          "revoked",
        ],
        default: "not_requested",
        index: true,
      },

      // ----------------------------------------------------------
      // VERIFICATION TYPE
      // ----------------------------------------------------------

      verificationType: {
        type: String,
        enum: [
          "individual",
          "candidate",
          "organization",
          "political_party",
          "public_figure",
          "platform",
        ],
        default: "individual",
      },

      // ----------------------------------------------------------
      // REQUEST INFORMATION
      // ----------------------------------------------------------

      requestedAt: {
        type: Date,
        default: null,
      },

      requestReason: {
        type: String,
        default: null,
        trim: true,
        maxlength: 2000,
      },

      // ----------------------------------------------------------
      // REVIEW INFORMATION
      // ----------------------------------------------------------

      reviewedAt: {
        type: Date,
        default: null,
      },

      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      // ----------------------------------------------------------
      // REJECTION / REVOCATION INFORMATION
      // ----------------------------------------------------------

      rejectionReason: {
        type: String,
        default: null,
        trim: true,
        maxlength: 2000,
      },

      revocationReason: {
        type: String,
        default: null,
        trim: true,
        maxlength: 2000,
      },

      // ----------------------------------------------------------
      // OFFICIAL BADGE
      // ----------------------------------------------------------
      // This is the official PoliSync Africa verification badge.
      // The frontend can use this asset when isVerified = true.
      // ----------------------------------------------------------

      badgeAsset: {
        type: String,
        default: "/verified-badge.png",
      },
    },

    // ============================================================
    // PRIVACY
    // ============================================================

    privacy: {
      // ----------------------------------------------------------
      // MESSAGE PRIVACY
      // ----------------------------------------------------------

      messagePrivacy: {
        type: String,
        enum: [
          "everyone",
          "organizations_only",
          "nobody",
        ],
        default: "nobody",
      },

      // ----------------------------------------------------------
      // PROFILE VISIBILITY
      // ----------------------------------------------------------

      profileVisibility: {
        type: String,
        enum: [
          "everyone",
          "organizations_only",
          "nobody",
        ],
        default: "nobody",
      },

      // ----------------------------------------------------------
      // ONLINE STATUS
      // ----------------------------------------------------------

      showOnlineStatus: {
        type: Boolean,
        default: true,
      },

      // ----------------------------------------------------------
      // LAST SEEN
      // ----------------------------------------------------------

      showLastSeen: {
        type: Boolean,
        default: true,
      },

      // ----------------------------------------------------------
      // LOCATION SHARING
      // ----------------------------------------------------------

      shareLocation: {
        type: Boolean,
        default: false,
      },

      // ----------------------------------------------------------
      // LOCATION VISIBILITY
      // ----------------------------------------------------------

      locationVisibility: {
        type: String,
        enum: [
          "everyone",
          "organizations_only",
          "selected_people",
          "nobody",
        ],
        default: "nobody",
      },

      // ----------------------------------------------------------
      // LOCATION PRECISION
      // ----------------------------------------------------------

      locationPrecision: {
        type: String,
        enum: [
          "exact",
          "approximate",
        ],
        default: "approximate",
      },

      // ----------------------------------------------------------
      // LOCATION SHARING DURATION
      // ----------------------------------------------------------

      locationSharingDuration: {
        type: String,
        enum: [
          "until_turned_off",
          "one_hour",
          "eight_hours",
          "twenty_four_hours",
        ],
        default: "until_turned_off",
      },

      // ----------------------------------------------------------
      // PROFILE VIEW HISTORY
      // ----------------------------------------------------------
      // Controls whether the owner can see who viewed the profile.
      // ----------------------------------------------------------

      showProfileViewers: {
        type: Boolean,
        default: true,
      },

      // ----------------------------------------------------------
      // PROFILE VIEW PRIVACY
      // ----------------------------------------------------------
      // Controls whether this user appears in another person's
      // profile-view history.
      // ----------------------------------------------------------

      profileViewPrivacy: {
        type: String,
        enum: [
          "everyone",
          "organizations_only",
          "nobody",
        ],
        default: "everyone",
      },
    },

    // ============================================================
    // LOCATION PERMISSION
    // ============================================================
    // Records whether the user has granted location permission
    // to PoliSync.
    //
    // It does NOT override browser/device permissions.
    // ============================================================

    locationPermissionGranted: {
      type: Boolean,
      default: false,
    },

    // ============================================================
    // CURRENT LOCATION
    // ============================================================
    // Coordinates are stored only when location sharing has been
    // explicitly enabled.
    //
    // Google Maps can use permitted coordinates to display the
    // user's location.
    // ============================================================

    currentLocation: {
      latitude: {
        type: Number,
        default: null,
        min: -90,
        max: 90,
      },

      longitude: {
        type: Number,
        default: null,
        min: -180,
        max: 180,
      },

      accuracy: {
        type: Number,
        default: null,
        min: 0,
      },

      updatedAt: {
        type: Date,
        default: null,
      },
    },

    // ============================================================
    // LOCATION EXPIRATION
    // ============================================================

    locationExpiresAt: {
      type: Date,
      default: null,
    },

    // ============================================================
    // PLATFORM ACTIVITY / PRESENCE
    // ============================================================

    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    lastSeenAt: {
      type: Date,
      default: null,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
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
// The Super Admin represents the entire PoliSync Africa
// platform.
//
// Public identity:
//   POLISYNC AFRICA
//   @polisync.africa
//
// The private administrator's personal identity must never
// become the platform's public identity.
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

    // ----------------------------------------------------------
    // SUPER ADMIN IS THE OFFICIAL PLATFORM ACCOUNT
    // ----------------------------------------------------------

    this.verification.isVerified = true;

    this.verification.status = "approved";

    this.verification.verificationType =
      "platform";

    this.verification.badgeAsset =
      "/verified-badge.png";

    // ----------------------------------------------------------
    // PLATFORM ACCOUNT HAS NO PERSONAL LOCATION
    // ----------------------------------------------------------

    this.locationPermissionGranted = false;

    this.privacy.shareLocation = false;

    this.privacy.locationVisibility =
      "nobody";

    this.currentLocation = {
      latitude: null,
      longitude: null,
      accuracy: null,
      updatedAt: null,
    };

    this.locationExpiresAt = null;
  }

  next();
});

// ============================================================
// VERIFICATION STATE SAFETY
// ============================================================
// Ordinary users cannot become verified merely by setting
// isVerified=true during ordinary account creation.
//
// Approval/rejection/revocation must be performed through the
// protected Super Admin verification controller.
// ============================================================

userSchema.pre("validate", function (next) {
  if (this.platformRole === "user") {
    if (
      this.verification.status ===
      "not_requested"
    ) {
      this.verification.isVerified = false;
    }

    if (
      this.verification.status ===
      "pending"
    ) {
      this.verification.isVerified = false;
    }

    if (
      this.verification.status ===
        "rejected" ||
      this.verification.status ===
        "revoked"
    ) {
      this.verification.isVerified = false;
    }

    if (
      this.verification.status ===
      "approved"
    ) {
      this.verification.isVerified = true;
    }
  }

  next();
});

// ============================================================
// LOCATION SAFETY VALIDATION
// ============================================================

userSchema.pre("validate", function (next) {
  if (!this.privacy.shareLocation) {
    this.privacy.locationVisibility =
      "nobody";

    this.locationExpiresAt = null;
  }

  if (
    this.privacy.shareLocation &&
    !this.locationPermissionGranted
  ) {
    this.privacy.shareLocation = false;

    this.privacy.locationVisibility =
      "nobody";

    this.locationExpiresAt = null;
  }

  next();
});

// ============================================================
// LOCATION EXPIRATION VALIDATION
// ============================================================

userSchema.pre("save", function (next) {
  if (
    this.privacy &&
    this.privacy.shareLocation &&
    this.locationExpiresAt &&
    this.locationExpiresAt <= new Date()
  ) {
    this.privacy.shareLocation = false;

    this.privacy.locationVisibility =
      "nobody";

    this.locationExpiresAt = null;
  }

  next();
});

// ============================================================
// NORMALIZATION
// ============================================================

userSchema.pre("save", function (next) {
  if (this.username) {
    this.username =
      this.username
        .toLowerCase()
        .trim();
  }

  if (this.email) {
    this.email =
      this.email
        .toLowerCase()
        .trim();
  }

  if (this.phone) {
    this.phone =
      this.phone.trim();
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

userSchema.methods.getPublicIdentity =
  function () {
    if (
      this.platformRole ===
      "super_admin"
    ) {
      return {
        displayName:
          "POLISYNC AFRICA",

        username:
          "polisync.africa",

        platformRole:
          "super_admin",

        isPlatformAccount:
          true,

        isVerified:
          true,

        verificationType:
          "platform",

        badgeAsset:
          "/verified-badge.png",
      };
    }

    return {
      displayName:
        this.displayName ||
        `${this.firstName} ${this.lastName}`.trim(),

      username:
        this.username,

      platformRole:
        this.platformRole,

      isPlatformAccount:
        false,

      isVerified:
        this.verification.isVerified,

      verificationType:
        this.verification.verificationType,

      badgeAsset:
        this.verification.isVerified
          ? this.verification.badgeAsset
          : null,
    };
  };

// ============================================================
// VERIFICATION PUBLIC STATUS
// ============================================================
// This exposes only safe public verification information.
// Private review information is never exposed.
// ============================================================

userSchema.methods.getPublicVerification =
  function () {
    const verified =
      this.platformRole ===
        "super_admin" ||
      this.verification.isVerified;

    if (!verified) {
      return {
        isVerified: false,
        badgeAsset: null,
        verificationType: null,
      };
    }

    return {
      isVerified: true,

      badgeAsset:
        this.verification.badgeAsset ||
        "/verified-badge.png",

      verificationType:
        this.platformRole ===
        "super_admin"
          ? "platform"
          : this.verification
              .verificationType,
    };
  };

// ============================================================
// LOCATION VISIBILITY CHECK
// ============================================================

userSchema.methods.canShareLocationWith =
  function ({
    viewerId = null,
    viewerIsOrganizationMember = false,
  } = {}) {
    if (
      this.platformRole ===
      "super_admin"
    ) {
      return false;
    }

    if (
      !this.privacy.shareLocation
    ) {
      return false;
    }

    if (
      !this.locationPermissionGranted
    ) {
      return false;
    }

    if (
      this.locationExpiresAt &&
      this.locationExpiresAt <= new Date()
    ) {
      return false;
    }

    const visibility =
      this.privacy.locationVisibility;

    if (
      visibility === "nobody"
    ) {
      return false;
    }

    if (
      visibility === "everyone"
    ) {
      return true;
    }

    if (
      visibility ===
        "organizations_only" &&
      viewerIsOrganizationMember
    ) {
      return true;
    }

    if (
      visibility ===
        "selected_people" &&
      viewerId
    ) {
      // Selected-person authorization must be checked by the
      // controller/service layer.
      return false;
    }

    return false;
  };

// ============================================================
// PUBLIC LOCATION
// ============================================================

userSchema.methods.getPublicLocation =
  function ({
    viewerId = null,
    viewerIsOrganizationMember = false,
  } = {}) {
    const allowed =
      this.canShareLocationWith({
        viewerId,
        viewerIsOrganizationMember,
      });

    if (!allowed) {
      return null;
    }

    if (
      !this.currentLocation ||
      this.currentLocation.latitude ===
        null ||
      this.currentLocation.longitude ===
        null
    ) {
      return null;
    }

    const precision =
      this.privacy.locationPrecision;

    if (
      precision === "approximate"
    ) {
      const latitude =
        Math.round(
          this.currentLocation
            .latitude * 100
        ) / 100;

      const longitude =
        Math.round(
          this.currentLocation
            .longitude * 100
        ) / 100;

      return {
        latitude,
        longitude,
        precision: "approximate",
        updatedAt:
          this.currentLocation.updatedAt,
      };
    }

    return {
      latitude:
        this.currentLocation.latitude,

      longitude:
        this.currentLocation.longitude,

      accuracy:
        this.currentLocation.accuracy,

      precision: "exact",

      updatedAt:
        this.currentLocation.updatedAt,
    };
  };

// ============================================================
// PUBLIC PRESENCE
// ============================================================

userSchema.methods.getPublicPresence =
  function () {
    const presence = {};

    if (
      this.privacy.showOnlineStatus
    ) {
      presence.isOnline =
        this.isOnline;
    }

    if (
      this.privacy.showLastSeen
    ) {
      presence.lastSeenAt =
        this.lastSeenAt;
    }

    return presence;
  };

// ============================================================
// PROFILE VIEW VISIBILITY
// ============================================================
// Determines whether this user may appear in another user's
// "Who viewed my profile" history.
//
// Detailed recording/query authorization belongs in
// ProfileView.js and the controller/service layer.
// ============================================================

userSchema.methods.canAppearInProfileViews =
  function ({
    viewerIsOrganizationMember = false,
  } = {}) {
    const privacy =
      this.privacy.profileViewPrivacy;

    if (
      privacy === "nobody"
    ) {
      return false;
    }

    if (
      privacy === "everyone"
    ) {
      return true;
    }

    if (
      privacy ===
        "organizations_only" &&
      viewerIsOrganizationMember
    ) {
      return true;
    }

    return false;
  };

// ============================================================
// SAFE PUBLIC USER PROFILE
// ============================================================
// Never expose:
// - password
// - identification number
// - private email
// - private phone
// - security secrets
// - verification review details
// - unauthorized location
// ============================================================

userSchema.methods.toPublicProfile =
  function ({
    viewerId = null,
    viewerIsOrganizationMember = false,
  } = {}) {
    const identity =
      this.getPublicIdentity();

    const presence =
      this.getPublicPresence();

    const location =
      this.getPublicLocation({
        viewerId,
        viewerIsOrganizationMember,
      });

    const verification =
      this.getPublicVerification();

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

      verified:
        verification.isVerified,

      verificationType:
        verification.verificationType,

      verificationBadge:
        verification.badgeAsset,

      ...presence,

      location,
    };
  };

// ============================================================
// MODEL
// ============================================================

module.exports =
  mongoose.models.User ||
  mongoose.model(
    "User",
    userSchema
  );
