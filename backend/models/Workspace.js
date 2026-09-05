const mongoose = require("mongoose");

const workspaceSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    level: {
      type: String,
      enum: [
        "National",
        "Regional",
        "Constituency",
        "District",
        "PollingStation",
        "Research",
        "Observer",
      ],
      required: true,
    },

    country: {
      type: String,
      required: true,
    },

    region: {
      type: String,
    },

    constituency: {
      type: String,
    },

    district: {
      type: String,
    },

    description: String,

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Workspace", workspaceSchema);
