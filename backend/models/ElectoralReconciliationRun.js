const mongoose = require("mongoose");

const electoralReconciliationRunSchema = new mongoose.Schema({
  source: { type: String, required: true },
  sourceYear: { type: Number, required: true },
  status: { type: String, enum: ["dry_run", "approved", "applied", "failed"], required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
  approvedAt: Date,
  appliedAt: Date,
  summary: {
    sourceRows: { type: Number, default: 0 },
    validRows: { type: Number, default: 0 },
    newStations: { type: Number, default: 0 },
    changedStations: { type: Number, default: 0 },
    unchangedStations: { type: Number, default: 0 },
    missingFromSource: { type: Number, default: 0 },
    unresolved: { type: Number, default: 0 },
    duplicateSourceCodes: { type: Number, default: 0 },
  },
  changes: [{
    pollingStationCode: String,
    changeType: { type: String, enum: ["new", "changed", "missing", "unresolved"] },
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    reason: String,
  }],
  errorMessage: String,
}, { timestamps: true });

electoralReconciliationRunSchema.index({ createdAt: -1 });
electoralReconciliationRunSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("ElectoralReconciliationRun", electoralReconciliationRunSchema);
