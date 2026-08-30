const mongoose = require("mongoose");

const candidateResultSchema = new mongoose.Schema(
  {
    candidateId: { type: String, required: true, trim: true },
    candidateName: { type: String, required: true, trim: true },
    party: { type: String, default: "", trim: true },
    manualVotes: { type: Number, required: true, min: 0 },
    pinkSheetVotes: { type: Number, default: null, min: 0 },
    comparisonStatus: {
      type: String,
      enum: ["not_checked", "match", "discrepancy", "unreadable"],
      default: "not_checked",
    },
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true },
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: "Election", required: true, index: true },
    pollingStationId: { type: mongoose.Schema.Types.ObjectId, ref: "PollingStation", required: true, index: true },
    regionId: { type: mongoose.Schema.Types.ObjectId, ref: "Region", required: true, index: true },
    constituencyId: { type: mongoose.Schema.Types.ObjectId, ref: "Constituency", required: true, index: true },
    pollingStationCode: { type: String, required: true, trim: true, uppercase: true, index: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // The agent's typed figures are retained independently from document analysis.
    candidateResults: { type: [candidateResultSchema], required: true, validate: v => v.length > 0 },
    manualTotals: {
      totalValidVotes: { type: Number, required: true, min: 0 },
      rejectedVotes: { type: Number, default: 0, min: 0 },
      totalBallots: { type: Number, required: true, min: 0 },
    },

    // AI/document extraction is retained as structured verification data only.
    // The uploaded pink-sheet file itself is NOT stored by default.
    pinkSheetAnalysis: {
      supplied: { type: Boolean, default: false },
      status: { type: String, enum: ["not_supplied", "processing", "complete", "failed"], default: "not_supplied" },
      extractedCandidates: { type: [candidateResultSchema], default: [] },
      extractedTotals: {
        totalValidVotes: { type: Number, default: null },
        rejectedVotes: { type: Number, default: null },
        totalBallots: { type: Number, default: null },
      },
      confidence: { type: Number, default: null, min: 0, max: 1 },
      checkedAt: { type: Date, default: null },
      documentName: { type: String, default: "" },
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "discrepancy", "disputed", "rejected"],
      default: "pending",
      index: true,
    },
    verificationSummary: { type: String, default: "" },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

resultSchema.index({ electionId: 1, pollingStationId: 1 }, { unique: true });
resultSchema.index({ organizationId: 1, electionId: 1, regionId: 1, constituencyId: 1 });

module.exports = mongoose.model("Result", resultSchema);
