const mongoose = require("mongoose");

const electoralDataSyncRunSchema = new mongoose.Schema({
  source: { type: String, required: true, default: "Ghana Electoral Commission 2024 Polling Stations" },
  sourceYear: { type: Number, required: true, default: 2024 },
  status: { type: String, enum: ["running", "completed", "failed"], required: true, index: true },
  startedAt: { type: Date, required: true, default: Date.now, index: true },
  completedAt: { type: Date, default: null },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  matchedRows: { type: Number, default: 0 },
  activePollingStations: { type: Number, default: 0 },
  skipped: { type: Number, default: 0 },
  ambiguous: { type: Number, default: 0 },
  modified: { type: Number, default: 0 },
  upserted: { type: Number, default: 0 },
  errorMessage: { type: String, default: "" },
}, { timestamps: true });

electoralDataSyncRunSchema.index({ sourceYear: -1, startedAt: -1 });

module.exports = mongoose.models.ElectoralDataSyncRun || mongoose.model("ElectoralDataSyncRun", electoralDataSyncRunSchema);
