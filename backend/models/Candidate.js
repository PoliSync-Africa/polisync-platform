const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      default: null,
      index: true,
    },

    constituencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Constituency",
      default: null,
      index: true,
    },

    regionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Region",
      default: null,
      index: true,
    },

    pollingStationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PollingStation",
      default: null,
    },

    partyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    party: {
      type: String,
      default: null,
      trim: true,
    },

    partyName: {
      type: String,
      default: null,
      trim: true,
    },

    constituencyName: {
      type: String,
      default: null,
      trim: true,
    },

    regionName: {
      type: String,
      default: null,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "active", "inactive"],
      default: "pending",
    },

    position: {
      type: String,
      enum: ["president", "parliamentary", "local", null],
      default: null,
    },

    ballotNumber: {
      type: Number,
      default: null,
      min: 1,
    },

    photoUrl: {
      type: String,
      default: null,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: null,
      trim: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

candidateSchema.index({ organizationId: 1, electionId: 1 });
candidateSchema.index({ electionId: 1, constituencyId: 1 });

module.exports =
  mongoose.models.Candidate || mongoose.model("Candidate", candidateSchema);
