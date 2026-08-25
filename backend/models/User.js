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
      // Controls whether other permitted users can see
      // "Online".
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
    },

    // ============================================================
    // LOCATION PERMISSION
    // ============================================================
    // This records whether the user has granted location
    // permission to PoliSync.
    //
    // It does NOT override the browser/device permission.
    // ============================================================

    locationPermissionGranted: {
      type: Boolean,
      default: false,
    },

    // ============================================================
    // CURRENT LOCATION
    // ============================================================
    // Location coordinates are stored only when location sharing
    // has been explicitly enabled.
    //
    // Google Maps can use these coordinates to display the
    // permitted user's current location.
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
    // Used for temporary location sharing.
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
//
//   Display name: POLISYNC AFRICA
//   Username:     polisync.africa
//
// The private controller's personal identity must never become
// the platform's public identity.
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

    // The platform account does not expose a personal location.
    this.locationPermissionGranted = false;

    this.privacy.shareLocation = false;
    this.privacy.locationVisibility = "nobody";

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
// LOCATION SAFETY VALIDATION
// ============================================================

userSchema.pre("validate", function (next) {
  // If location sharing is disabled, location should not remain
  // publicly usable.

  if (!this.privacy.shareLocation) {
    this.privacy.locationVisibility = "nobody";
    this.locationExpiresAt = null;
  }

  // A user cannot claim location sharing without permission.
  if (
    this.privacy.shareLocation &&
    !this.locationPermissionGranted
  ) {
    this.privacy.shareLocation = false;
    this.privacy.locationVisibility = "nobody";
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
    this.privacy.locationVisibility = "nobody";
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
// Determines the identity other users should see.
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
    };
  };

// ============================================================
// LOCATION VISIBILITY CHECK
// ============================================================
// This method determines whether a viewer is allowed to see
// the user's location.
//
// Actual authorization based on organization membership or
// selected users should be implemented in the service/controller
// layer.
// ============================================================

userSchema.methods.canShareLocationWith =
  function ({
    viewerId = null,
    viewerIsOrganizationMember = false,
  } = {}) {
    // Platform Super Admin has no personal location.
    if (
      this.platformRole ===
      "super_admin"
    ) {
      return false;
    }

    // Location sharing must be enabled.
    if (
      !this.privacy.shareLocation
    ) {
      return false;
    }

    // Device/browser permission must exist.
    if (
      !this.locationPermissionGranted
    ) {
      return false;
    }

    // Check expiration.
    if (
      this.locationExpiresAt &&
      this.locationExpiresAt <= new Date()
    ) {
      return false;
    }

    const visibility =
      this.privacy.locationVisibility;

    if (visibility === "nobody") {
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
      // Selected-person authorization should be checked by the
      // controller/service against an access list.
      return false;
    }

    return false;
  };

// ============================================================
// PUBLIC LOCATION
// ============================================================
// Never expose raw location unless the viewer has already passed
// the privacy/authorization check.
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
      this.currentLocation.latitude === null ||
      this.currentLocation.longitude === null
    ) {
      return null;
    }

    const precision =
      this.privacy.locationPrecision;

    // ----------------------------------------------------------
    // APPROXIMATE LOCATION
    // ----------------------------------------------------------
    // Reduce precision before sending coordinates to the client.
    // ----------------------------------------------------------

    if (
      precision === "approximate"
    ) {
      const latitude =
        Math.round(
          this.currentLocation.latitude *
            100
        ) / 100;

      const longitude =
        Math.round(
          this.currentLocation.longitude *
            100
        ) / 100;

      return {
        latitude,
        longitude,
        precision: "approximate",
        updatedAt:
          this.currentLocation.updatedAt,
      };
    }

    // ----------------------------------------------------------
    // EXACT LOCATION
    // ----------------------------------------------------------

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
// Determines what another user may see about online/last-seen
// activity.
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
// SAFE PUBLIC USER PROFILE
// ============================================================
// Never expose:
// - password
// - identification number
// - private email
// - private phone
// - private security settings
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
