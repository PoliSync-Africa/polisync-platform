const mongoose = require("mongoose");

const PERSONAL_PURPOSES = [
  "personal_use",
  "researcher",
  "journalist",
  "media_house",
];

const SCOPE_LEVELS = [
  "public_platform",
  "national",
  "regional",
  "constituency",
  "polling_station",
];

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: PERSONAL_PURPOSES,
      required: true,
      index: true,
    },
    scopeLevel: {
      type: String,
      enum: SCOPE_LEVELS,
      default: "public_platform",
      required: true,
    },
    regionIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Region",
    }],
    constituencyIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Constituency",
    }],
    pollingStationIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "PollingStation",
    }],
    organizationName: {
      type: String,
      trim: true,
      default: "",
      maxlength: 160,
    },
    researchFields: [{ type: String, trim: true, maxlength: 80 }],
    journalismBeat: {
      type: String,
      trim: true,
      default: "",
      maxlength: 120,
    },
    accessProfile: {
      type: String,
      enum: ["public_read", "research_read", "journalist_read", "media_read"],
      required: true,
    },
    permissions: [{ type: String, trim: true }],
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

profileSchema.index({ purpose: 1, scopeLevel: 1 });

module.exports =
  mongoose.models.PersonalWorkspaceProfile ||
  mongoose.model("PersonalWorkspaceProfile", profileSchema);
