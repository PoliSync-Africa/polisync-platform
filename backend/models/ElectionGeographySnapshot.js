const mongoose = require("mongoose");

const electionGeographySnapshotSchema = new mongoose.Schema(
  {
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: "Election", required: true, unique: true, index: true },
    source: { type: String, default: "PoliSync official electoral geography", trim: true },
    sourceYear: { type: Number, default: null },
    synchronizedAt: { type: Date, default: Date.now },
    regions: { type: Number, default: 0 },
    constituencies: { type: Number, default: 0 },
    pollingStations: { type: Number, default: 0 },
    geographyVersion: { type: String, default: "current" },
    status: { type: String, enum: ["synchronized", "failed"], default: "synchronized" },
    error: { type: String, default: "" },
  },
  { timestamps: true }
);

electionGeographySnapshotSchema.index({ electionId: 1, synchronizedAt: -1 });

module.exports = mongoose.models.ElectionGeographySnapshot || mongoose.model("ElectionGeographySnapshot", electionGeographySnapshotSchema);
