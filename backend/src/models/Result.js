const mongoose = require("mongoose");

const CandidateResultSchema = new mongoose.Schema({
  candidateId: String,
  candidateName: String,
  party: String,
  votes: { type: Number, default: 0 }
}, { _id: false });

const ResultSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true
  },
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Election",
    required: true
  },
  pollingStationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PollingStation",
    required: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  candidateResults: [CandidateResultSchema],
  totalValidVotes: Number,
  rejectedVotes: Number,
  totalBallots: Number,
  evidence: [String],
  verificationStatus: {
    type: String,
    enum: ["pending", "verified"],
    default: "pending"
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  verifiedAt: Date
}, { timestamps: true });

module.exports = mongoose.model("Result", ResultSchema);
