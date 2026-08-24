const mongoose = require("mongoose");

// ============================================================
// PERMANENT GHANA POLITICAL PARTIES
// ============================================================

const PERMANENT_POLITICAL_PARTIES = [
  "NPP",
  "NDC",
  "CPP",
  "LPG",
  "GUM",
  "PNC",
  "PPP",
  "The Base Party",
  "UP (Movement for Change)",
  "The New Force",
  "Independent",
];

// ============================================================
// ORGANIZATION SCHEMA
// ============================================================

const organizationSchema = new mongoose.Schema(
  {
    // ============================================================
    // BASIC ORGANIZATION IDENTITY
    // ============================================================

    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    organizationType: {
      type: String,
      required: true,
      enum: [
        "political_party",
        "observer_organization",
        "parliamentary_candidate",
        "research",
      ],
    },

    // ============================================================
    // RESEARCH TYPE
    // Only used when organizationType = "research"
    // ============================================================

    researchType: {
      type: String,
      enum: [
        "individual_researcher",
        "research_institution",
        null,
      ],
      default: null,
    },

    // ============================================================
    // POLITICAL PARTY
    // ============================================================

    politicalPartyName: {
      type: String,
      enum: PERMANENT_POLITICAL_PARTIES,
      default: null,
    },

    isPermanentParty: {
      type: Boolean,
      default: false,
    },

    isNewPartyRequest: {
      type: Boolean,
      default: false,
    },

    // ============================================================
    // PARLIAMENTARY CANDIDATE
    // ============================================================

    candidate: {
      // Existing PoliSync personal account, if candidate
      // already has one.
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      username: {
        type: String,
        default: null,
        trim: true,
      },

      fullName: {
        type: String,
        default: null,
        trim: true,
      },

      profilePhoto: {
        type: String,
        default: null,
      },

      // Official/imported registration information
      registrationSource: {
        type: String,
        enum: [
          "polisync_user",
          "official_source",
          "manual",
          null,
        ],
        default: null,
      },

      registrationReference: {
        type: String,
        default: null,
        trim: true,
      },

      registrationStatus: {
        type: String,
        enum: [
          "not_verified",
          "pending",
          "verified",
          "rejected",
        ],
        default: "not_verified",
      },

      // Candidate-editable information
      biography: {
        type: String,
        default: "",
        trim: true,
      },

      campaignProfile: {
        type: String,
        default: "",
        trim: true,
      },
    },

    // ============================================================
    // PARTY / INDEPENDENT STATUS FOR CANDIDATES
    // ============================================================

    candidateParty: {
      type: String,
      default: null,
      trim: true,
    },

    candidateIsIndependent: {
      type: Boolean,
      default: false,
    },

    // ============================================================
    // ELECTION / GEOGRAPHIC FOUNDATION
    // Candidate workspace can later be linked to the
    // Election model and official geographic database.
    // ============================================================

    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      default: null,
    },

    region: {
      type: String,
      default: null,
      trim: true,
    },

    constituency: {
      type: String,
      default: null,
      trim: true,
    },

    // ============================================================
    // ORGANIZATION CONTACT
    // ============================================================

    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },

    phone: {
      type: String,
      trim: true,
      default: null,
      match: /^\+233\d{9}$/,
    },

    website: {
      type: String,
      default: null,
      trim: true,
    },

    logo: {
      type: String,
      default: null,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    // ============================================================
    // ORGANIZATION ACCOUNT STATUS
    // ============================================================

    organizationStatus: {
      type: String,
      required: true,
      enum: [
        "pending",
        "approved",
        "rejected",
        "suspended",
        "deactivated",
      ],
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
    // PLATFORM DATES
    // ============================================================

    joinedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    // ============================================================
    // ORGANIZATION SETTINGS
    // ============================================================

    settings: {
      timezone: {
        type: String,
        default: "Africa/Accra",
      },

      defaultLanguage: {
        type: String,
        default: "en",
      },
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// SLUG NORMALIZATION
// ============================================================

organizationSchema.pre("save", function (next) {
  if (this.slug) {
    this.slug = this.slug.toLowerCase().trim();
  }

  next();
});

// ============================================================
// EXPORT MODEL
// ============================================================

module.exports =
  mongoose.models.Organization ||
  mongoose.model("Organization", organizationSchema);

// Export permanent party list for use by controllers/services.
module.exports.PERMANENT_POLITICAL_PARTIES =
  PERMANENT_POLITICAL_PARTIES;
