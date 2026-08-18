const mongoose = require("mongoose");

const ResultSchema = new mongoose.Schema(
  {
    electionYear: {
      type: Number,
      required: true
    },

    electionType: {
      type: String,
      enum: ["Presidential", "Parliamentary", "Local"],
      required: true
    },

    pollingStationCode: {
      type: String,
      required: true
    },

    pollingStationName: {
      type: String,
      required: true
    },

    constituency: {
      type: String,
      required: true
    },

    region: {
      type: String,
      required: true
    },

    votes: {
      type: Map,
      of: Number,
      default: {}
    },

    rejectedVotes: {
      type: Number,
      default: 0
    },

    totalVotes: {
      type: Number,
      required: true
    },

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    evidenceImage: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Result", ResultSchema);
