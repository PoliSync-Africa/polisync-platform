const mongoose = require("mongoose");

const profileViewSchema = new mongoose.Schema(
  {
    // ============================================================
    // PROFILE OWNER
    // ============================================================
    // The user whose profile was viewed.
    // ============================================================

    profileOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ============================================================
    // VIEWER
    // ============================================================
    // The user who opened the profile.
    // ============================================================

    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ============================================================
    // VIEW TIME
    // ============================================================

    viewedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // ============================================================
    // VIEWER PLATFORM ROLE
    // ============================================================
    // Snapshot of the viewer's platform role at the time of the
    // view. This helps with analytics and historical records.
    // ============================================================

    viewerPlatformRole: {
      type: String,
      enum: ["user", "super_admin"],
      default: "user",
    },

    // ============================================================
    // ORGANIZATION CONTEXT
    // ============================================================
    // Organization membership/authorization is handled by the
    // organization system. These fields provide context for the
    // profile-view event.
    // ============================================================

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },

    viewerIsOrganizationMember: {
      type: Boolean,
      default: false,
    },

    // ============================================================
    // PRIVACY SNAPSHOT
    // ============================================================
    // Records whether the viewer was permitted to appear in the
    // profile owner's viewer history at the time of the view.
    // ============================================================

    viewerVisible: {
      type: Boolean,
      default: true,
    },

    // ============================================================
    // OPTIONAL DEVICE / SESSION INFORMATION
    // ============================================================
    // Do NOT store passwords, authentication tokens, or sensitive
    // device secrets here.
    // ============================================================

    deviceType: {
      type: String,
      enum: [
        "mobile",
        "tablet",
        "desktop",
        "unknown",
      ],
      default: "unknown",
    },

    // ============================================================
    // SOURCE
    // ============================================================
    // Where the profile was opened from.
    // ============================================================

    source: {
      type: String,
      enum: [
        "search",
        "message",
        "organization",
        "candidate",
        "party",
        "notification",
        "direct",
        "other",
      ],
      default: "direct",
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// PREVENT SELF PROFILE VIEWS
// ============================================================
// A user viewing their own profile should not create a viewer
// history event.
// ============================================================

profileViewSchema.pre(
  "validate",
  function (next) {
    if (
      this.profileOwner &&
      this.viewer &&
      this.profileOwner.toString() ===
        this.viewer.toString()
    ) {
      return next(
        new Error(
          "Users cannot create profile-view records for their own profile."
        )
      );
    }

    next();
  }
);

// ============================================================
// INDEXES
// ============================================================

// Quickly retrieve recent viewers of a profile.
profileViewSchema.index({
  profileOwner: 1,
  viewedAt: -1,
});

// Quickly determine a viewer's profile-view activity.
profileViewSchema.index({
  viewer: 1,
  viewedAt: -1,
});

// Prevent excessive duplicate events from the same viewer
// within the same short period at the database-query layer.
// The controller/service should still apply the actual
// deduplication window.
profileViewSchema.index({
  profileOwner: 1,
  viewer: 1,
  viewedAt: -1,
});

// ============================================================
// PUBLIC VIEWER IDENTITY
// ============================================================
// Returns only safe information suitable for the
// "Who viewed my profile?" interface.
// ============================================================

profileViewSchema.methods.getPublicViewer =
  function () {
    if (
      !this.viewer ||
      typeof this.viewer !== "object"
    ) {
      return null;
    }

    if (
      this.viewer.platformRole ===
      "super_admin"
    ) {
      return {
        id: this.viewer._id,

        displayName:
          "POLISYNC AFRICA",

        username:
          "polisync.africa",

        platformRole:
          "super_admin",

        isPlatformAccount:
          true,

        verified: true,

        profilePhoto:
          this.viewer.profilePhoto ||
          null,
      };
    }

    return {
      id: this.viewer._id,

      displayName:
        this.viewer.displayName ||
        `${this.viewer.firstName || ""} ${
          this.viewer.lastName || ""
        }`.trim(),

      username:
        this.viewer.username,

      platformRole:
        this.viewer.platformRole,

      isPlatformAccount:
        false,

      verified:
        Boolean(
          this.viewer.verification &&
            this.viewer.verification
              .isVerified
        ),

      profilePhoto:
        this.viewer.profilePhoto ||
        null,
    };
  };

// ============================================================
// SAFE PROFILE VIEW RESPONSE
// ============================================================

profileViewSchema.methods.toPublicView =
  function () {
    return {
      id: this._id,

      viewedAt:
        this.viewedAt,

      viewer:
        this.getPublicViewer(),

      source:
        this.source,

      organizationId:
        this.organizationId,
    };
  };

// ============================================================
// MODEL
// ============================================================

module.exports =
  mongoose.models.ProfileView ||
  mongoose.model(
    "ProfileView",
    profileViewSchema
  );
