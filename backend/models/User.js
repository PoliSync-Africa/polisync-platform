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
    // PHONE SECURITY VERIFICATION
    // ============================================================
    //
    // phoneVerified:
    //   Confirms that the registered phone number has been
    //   successfully verified.
    //
    // lastPhoneVerificationAt:
    //   Records the most recent successful SMS OTP verification
    //   used for authentication security.
    //
    // PoliSync requires a new phone OTP when more than 24 hours
    // have passed since the last successful phone verification.
    //
    // IMPORTANT:
    // This field does NOT replace phoneVerified.
    // ============================================================

    lastPhoneVerificationAt: {
      type: Date,
      default: null,
    },

    // ============================================================
    // LOGIN OTP SECURITY CHALLENGE
    // ============================================================
    //
    // These fields are used to protect a login OTP challenge.
    //
    // The actual SMS OTP must NEVER be stored in plain text.
    //
    // The OTP itself is handled by the SMS verification provider.
    // PoliSync stores only the protected challenge information.
    // ============================================================

    loginOtpChallengeHash: {
      type: String,
      default: null,
      select: false,
    },

    loginOtpExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },

    loginOtpAttempts: {
      type: Number,
      default: 0,
      min: 0,
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
    // VERIFICATION
    // ============================================================
    // Every account may request a verified badge.
    //
    // ONLY the PoliSync Africa Super Admin can:
    // - approve
    // - reject
    // - revoke
    //
    // The verification controller enforces this authorization
    // server-side.
    // ============================================================

    verification: {
      // ----------------------------------------------------------
      // VERIFIED STATE
      // ----------------------------------------------------------

      isVerified: {
        type: Boolean,
        default: false,
        index: true,
      },

      // ----------------------------------------------------------
      // VERIFICATION STATUS
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
        trim: true,
        maxlength: 2000,
        default: null,
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
      // REJECTION
      // ----------------------------------------------------------

      rejectionReason: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
      },

      // ----------------------------------------------------------
      // REVOCATION
      // ----------------------------------------------------------

      revocationReason: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: null,
      },

      // ----------------------------------------------------------
      // BADGE
      // ----------------------------------------------------------
      // This points to the official PoliSync verified badge asset.
      // ----------------------------------------------------------

      badgeAsset: {
        type: String,
        default: "/verified-badge.png",
      },
    },

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
      // PROFILE VIEWERS
      // ----------------------------------------------------------

      showProfileViewers: {
        type: Boolean,
        default: true,
      },

      // ----------------------------------------------------------
      // PROFILE VIEW PRIVACY
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

    locationPermissionGranted: {
      type: Boolean,
      default: false,
    },

    // ============================================================
    // CURRENT LOCATION
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

userSchema.pre(
  "validate",
  function (next) {
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
  }
);

// ============================================================
// SUPER ADMIN PLATFORM IDENTITY
// ============================================================

userSchema.pre(
  "validate",
  function (next) {
    if (
      this.platformRole ===
      "super_admin"
    ) {
      // --------------------------------------------------------
      // PLATFORM PUBLIC IDENTITY
      // --------------------------------------------------------

      this.displayName =
        "POLISYNC AFRICA";

      this.username =
        "polisync.africa";

      this.firstName =
        "POLISYNC";

      this.middleName =
        "";

      this.lastName =
        "AFRICA";

      // --------------------------------------------------------
      // NO ORDINARY IDENTIFICATION
      // --------------------------------------------------------

      this.identificationType =
        null;

      this.identificationNumber =
        null;

      this.dateOfBirth =
        null;

      // --------------------------------------------------------
      // PLATFORM IS PERMANENTLY VERIFIED
      // --------------------------------------------------------

      if (!this.verification) {
        this.verification = {};
      }

      this.verification.isVerified =
        true;

      this.verification.status =
        "approved";

      this.verification.verificationType =
        "platform";

      this.verification.badgeAsset =
        "/verified-badge.png";

      // --------------------------------------------------------
      // PLATFORM HAS NO PERSONAL LOCATION
      // --------------------------------------------------------

      this.locationPermissionGranted =
        false;

      this.privacy.shareLocation =
        false;

      this.privacy.locationVisibility =
        "nobody";

      this.currentLocation = {
        latitude: null,
        longitude: null,
        accuracy: null,
        updatedAt: null,
      };

      this.locationExpiresAt =
        null;
    }

    next();
  }
);

// ============================================================
// VERIFICATION SAFETY VALIDATION
// ============================================================

userSchema.pre(
  "validate",
  function (next) {
    // ----------------------------------------------------------
    // SUPER ADMIN
    // ----------------------------------------------------------

    if (
      this.platformRole ===
      "super_admin"
    ) {
      this.verification.isVerified =
        true;

      this.verification.status =
        "approved";

      this.verification.verificationType =
        "platform";

      this.verification.badgeAsset =
        "/verified-badge.png";

      return next();
    }

    // ----------------------------------------------------------
    // ORDINARY USERS
    // ----------------------------------------------------------

    if (
      this.verification.isVerified &&
      this.verification.status !==
        "approved"
    ) {
      this.invalidate(
        "verification.isVerified",
        "An account cannot be verified unless its verification status is approved."
      );
    }

    if (
      this.verification.status ===
      "approved"
    ) {
      this.verification.isVerified =
        true;
    }

    if (
      this.verification.status ===
        "rejected" ||
      this.verification.status ===
        "revoked"
    ) {
      this.verification.isVerified =
        false;
    }

    if (
      this.verification.isVerified
    ) {
      this.verification.badgeAsset =
        "/verified-badge.png";
    }

    next();
  }
);

// ============================================================
// LOCATION SAFETY VALIDATION
// ============================================================

userSchema.pre(
  "validate",
  function (next) {
    if (
      !this.privacy.shareLocation
    ) {
      this.privacy.locationVisibility =
        "nobody";

      this.locationExpiresAt =
        null;
    }

    if (
      this.privacy.shareLocation &&
      !this.locationPermissionGranted
    ) {
      this.privacy.shareLocation =
        false;

      this.privacy.locationVisibility =
        "nobody";

      this.locationExpiresAt =
        null;
    }

    next();
  }
);

// ============================================================
// PROFILE VIEW PRIVACY VALIDATION
// ============================================================

userSchema.pre(
  "validate",
  function (next) {
    const allowedValues = [
      "everyone",
      "organizations_only",
      "nobody",
    ];

    if (
      !allowedValues.includes(
        this.privacy.profileViewPrivacy
      )
    ) {
      this.privacy.profileViewPrivacy =
        "everyone";
    }

    next();
  }
);

// ============================================================
// LOCATION EXPIRATION VALIDATION
// ============================================================

userSchema.pre(
  "save",
  function (next) {
    if (
      this.privacy &&
      this.privacy.shareLocation &&
      this.locationExpiresAt &&
      this.locationExpiresAt <=
        new Date()
    ) {
      this.privacy.shareLocation =
        false;

      this.privacy.locationVisibility =
        "nobody";

      this.locationExpiresAt =
        null;
    }

    next();
  }
);

// ============================================================
// NORMALIZATION
// ============================================================

userSchema.pre(
  "save",
  function (next) {
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
  }
);

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

        verified: true,

        verificationBadge:
          "/verified-badge.png",
      };
    }

    const isVerified =
      Boolean(
        this.verification &&
          this.verification
            .isVerified &&
          this.verification.status ===
            "approved"
      );

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

      verified:
        isVerified,

      verificationBadge:
        isVerified
          ? "/verified-badge.png"
          : null,
    };
  };

// ============================================================
// VERIFICATION PUBLIC IDENTITY
// ============================================================

userSchema.methods.getPublicVerification =
  function () {
    if (
      this.platformRole ===
      "super_admin"
    ) {
      return {
        isVerified: true,

        status:
          "approved",

        verificationType:
          "platform",

        badgeAsset:
          "/verified-badge.png",
      };
    }

    if (
      !this.verification
    ) {
      return {
        isVerified: false,

        status:
          "not_requested",

        verificationType:
          null,

        badgeAsset:
          null,
      };
    }

    return {
      isVerified:
        Boolean(
          this.verification
            .isVerified
        ),

      status:
        this.verification
          .status,

      verificationType:
        this.verification
          .verificationType,

      badgeAsset:
        this.verification
          .isVerified
          ? "/verified-badge.png"
          : null,
    };
  };

// ============================================================
// CAN APPEAR IN PROFILE VIEW HISTORY
// ============================================================

userSchema.methods.canAppearInProfileViews =
  function ({
    viewerIsOrganizationMember = false,
  } = {}) {
    const privacy =
      this.privacy
        ?.profileViewPrivacy;

    if (
      privacy === "nobody"
    ) {
      return false;
    }

    if (
      privacy ===
        "organizations_only" &&
      !viewerIsOrganizationMember
    ) {
      return false;
    }

    return true;
  };

// ============================================================
// LOCATION VISIBILITY CHECK
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
      this.locationExpiresAt <=
        new Date()
    ) {
      return false;
    }

    const visibility =
      this.privacy
        .locationVisibility;

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
      // Selected-person authorization must be implemented in
      // the service/controller against an access list.
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
      this.currentLocation
        .latitude === null ||
      this.currentLocation
        .longitude === null
    ) {
      return null;
    }

    const precision =
      this.privacy
        .locationPrecision;

    // ----------------------------------------------------------
    // APPROXIMATE LOCATION
    // ----------------------------------------------------------

    if (
      precision ===
      "approximate"
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

        precision:
          "approximate",

        updatedAt:
          this.currentLocation
            .updatedAt,
      };
    }

    // ----------------------------------------------------------
    // EXACT LOCATION
    // ----------------------------------------------------------

    return {
      latitude:
        this.currentLocation
          .latitude,

      longitude:
        this.currentLocation
          .longitude,

      accuracy:
        this.currentLocation
          .accuracy,

      precision:
        "exact",

      updatedAt:
        this.currentLocation
          .updatedAt,
    };
  };

// ============================================================
// PUBLIC PRESENCE
// ============================================================

userSchema.methods.getPublicPresence =
  function () {
    const presence = {};

    if (
      this.privacy
        .showOnlineStatus
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
// - private authentication settings
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

      verificationBadge:
        verification.badgeAsset,

      verificationStatus:
        verification.status,

      ...presence,

      location,
    };
  };

// ============================================================
// SAFE ADMIN PROFILE
// ============================================================
// This is intended for authorized administrative interfaces.
// It should NOT be used as a public profile response.
// ============================================================

userSchema.methods.toAdminProfile =
  function () {
    const identity =
      this.getPublicIdentity();

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

      firstName:
        this.firstName,

      middleName:
        this.middleName,

      lastName:
        this.lastName,

      dateOfBirth:
        this.dateOfBirth,

      nationality:
        this.nationality,

      profilePhoto:
        this.profilePhoto,

      email:
        this.email,

      phone:
        this.phone,

      identificationType:
        this.identificationType,

      identificationNumber:
        this.identificationNumber,

      accountStatus:
        this.accountStatus,

      emailVerified:
        this.emailVerified,

      phoneVerified:
        this.phoneVerified,

      lastPhoneVerificationAt:
        this.lastPhoneVerificationAt,

      twoFactorEnabled:
        this.twoFactorEnabled,

      twoFactorMethod:
        this.twoFactorMethod,

      verification,

      privacy:
        this.privacy,

      locationPermissionGranted:
        this.locationPermissionGranted,

      currentLocation:
        this.currentLocation,

      locationExpiresAt:
        this.locationExpiresAt,

      isOnline:
        this.isOnline,

      lastLoginAt:
        this.lastLoginAt,

      lastSeenAt:
        this.lastSeenAt,

      joinedAt:
        this.joinedAt,

      createdAt:
        this.createdAt,

      updatedAt:
        this.updatedAt,
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
