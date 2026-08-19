const mongoose = require("mongoose");

const candidateResultSchema = new mongoose.Schema(
  {
    candidateId: {
      type: String,
      required: true,
      trim: true,
    },

    candidateName: {
      type: String,
      required: true,
      trim: true,
    },

    votes: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const resultSchema = new mongoose.Schema(
  {
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      required: true,
    },

    pollingStationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PollingStation",
      required: true,
    },

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    candidateResults: {
      type: [candidateResultSchema],
      validate: [
        (value) => value.length > 0,
        "At least one candidate result is required",
      ],
    },

    totalValidVotes: {
      type: Number,
      required: true,
      min: 0,
    },

    rejectedVotes: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalBallots: {
      type: Number,
      required: true,
      min: 0,
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected", "disputed"],
      default: "pending",
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Result", resultSchema);
