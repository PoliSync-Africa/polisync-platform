const mongoose = require("mongoose");

// ============================================================
// ORGANIZATION MEMBERSHIP SCHEMA
// ============================================================
//
// Connects:
// PERSONAL ACCOUNT → ORGANIZATION → ROLE → SCOPE
//
// A person can belong to multiple organizations without
// creating multiple personal accounts.
//
// Super Admin is NOT stored here.
// Super Admin is a platform-level role stored in User.js.
// ============================================================

const organizationMembershipSchema = new mongoose.Schema(
  {
    // ============================================================
    // PERSON
    // ============================================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ============================================================
    // ORGANIZATION
    // ============================================================

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    // ============================================================
    // ORGANIZATIONAL ROLE
    // ============================================================

    role: {
      type: String,
      required: true,

      enum: [
        // --------------------------------------------------------
        // POLITICAL PARTY
        // --------------------------------------------------------

        "national_party_admin",
        "regional_party_admin",
        "constituency_admin",
        "polling_station_agent",

        // --------------------------------------------------------
        // OBSERVER ORGANIZATION
        // --------------------------------------------------------

        "national_observer_admin",
        "regional_observer_admin",
        "constituency_observer_admin",
        "observer_polling_station_agent",

        // --------------------------------------------------------
        // CANDIDATES
        // --------------------------------------------------------

        "presidential_candidate",
        "parliamentary_candidate",

        // --------------------------------------------------------
        // RESEARCH
        // --------------------------------------------------------

        "individual_researcher",
        "research_institution_admin",
        "researcher",

        // --------------------------------------------------------
        // GENERAL ORGANIZATION MEMBER
        // --------------------------------------------------------

        "organization_member",
      ],
    },

    // ============================================================
    // ORGANIZATIONAL LEVEL
    // ============================================================

    level: {
      type: String,
      required: true,

      enum: [
        "national",
        "regional",
        "constituency",
        "polling_station",
        "candidate",
        "research",
        "member",
      ],
    },

    // ============================================================
    // GEOGRAPHIC SCOPE
    // ============================================================

    // National-level membership has no region restriction.

    regionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Region",
      default: null,
      index: true,
    },

    // Constituency-level membership belongs to one constituency.

    constituencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Constituency",
      default: null,
      index: true,
    },

    // Polling-station-level membership belongs to one station.

    pollingStationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PollingStation",
      default: null,
      index: true,
    },

    // Retain the EC polling-station code for quick identification.

    pollingStationCode: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },

    // ============================================================
    // MEMBERSHIP / ASSIGNMENT STATUS
    // ============================================================

    status: {
      type: String,

      enum: [
        "pending",
        "approved",
        "rejected",
        "suspended",
        "revoked",
        "inactive",
      ],

      default: "pending",
      required: true,
      index: true,
    },

    // ============================================================
    // APPROVAL
    // ============================================================

    approvedAt: {
      type: Date,
      default: null,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    rejectionReason: {
      type: String,
      default: null,
      trim: true,
    },

    suspensionReason: {
      type: String,
      default: null,
      trim: true,
    },

    // ============================================================
    // INVITATION
    // ============================================================

    invitationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invitation",
      default: null,
      index: true,
    },

    invitedAt: {
      type: Date,
      default: null,
    },

    // ============================================================
    // MEMBERSHIP DATE
    // ============================================================

    joinedAt: {
      type: Date,
      default: null,
    },

    // ============================================================
    // ADMINISTRATIVE NOTES
    // ============================================================

    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// MEMBERSHIP INDEX
// ============================================================
//
// Prevents duplicate active/pending memberships with the same
// person, organization, role and geographic assignment.
//
// We intentionally do not make this a MongoDB unique index
// because null geographic fields can create unwanted conflicts
// between national-level memberships.
//
// Duplicate prevention will also be enforced by the service
// layer when memberships are created.
// ============================================================

organizationMembershipSchema.index({
  userId: 1,
  organizationId: 1,
  role: 1,
  status: 1,
});

// ============================================================
// ORGANIZATION SEARCH INDEXES
// ============================================================

organizationMembershipSchema.index({
  organizationId: 1,
  status: 1,
});

organizationMembershipSchema.index({
  organizationId: 1,
  level: 1,
});

organizationMembershipSchema.index({
  organizationId: 1,
  regionId: 1,
  constituencyId: 1,
  pollingStationId: 1,
});

// ============================================================
// USER MEMBERSHIP SEARCH
// ============================================================

organizationMembershipSchema.index({
  userId: 1,
  status: 1,
});

// ============================================================
// MODEL
// ============================================================

module.exports =
  mongoose.models.OrganizationMembership ||
  mongoose.model(
    "OrganizationMembership",
    organizationMembershipSchema
  );
