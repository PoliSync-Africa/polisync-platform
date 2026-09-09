const mongoose = require("mongoose");
const { processCandidateFields } = require("../utils/candidateImageProcessor");

const partySchema = new mongoose.Schema({
  partyId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
  name: { type: String, required: true, trim: true },
  logoUrl: { type: String, default: "", trim: true },
}, { _id: false });

const candidateSchema = new mongoose.Schema({
  firstName: { type: String, default: "", trim: true },
  surname: { type: String, default: "", trim: true },
  name: { type: String, required: true, trim: true },
  partyId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
  party: { type: String, default: "", trim: true },
  partyLogoUrl: { type: String, default: "", trim: true },
  profilePictureUrl: { type: String, default: "", trim: true },
  constituencyId: { type: mongoose.Schema.Types.ObjectId, ref: "Constituency", default: null },
  position: { type: String, enum: ["president", "parliamentary", "local"], default: "president" },
  ballotNumber: { type: Number, default: null, min: 1 },
}, { _id: false });

const ElectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  year: { type: Number, required: true },
  startDateTime: { type: Date, default: null },
  endDateTime: { type: Date, default: null },
  type: { type: String, enum: ["Presidential", "Parliamentary", "Local"], required: true },
  country: { type: String, default: "Ghana" },
  status: { type: String, enum: ["Draft", "Active", "Closed"], default: "Draft" },
  totalRegions: { type: Number, default: 0 },
  totalConstituencies: { type: Number, default: 0 },
  totalPollingStations: { type: Number, default: 0 },
  geographySynchronizedAt: { type: Date, default: null },
  parties: { type: [partySchema], default: [] },
  candidates: { type: [candidateSchema], default: [] },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  managedBy: { type: String, enum: ["platform", "organization"], default: "platform", index: true },
}, { timestamps: true });

ElectionSchema.pre("save", async function processCandidatePhotos(next) {
  if (!this.isModified("candidates")) return next();
  try {
    await processCandidateFields(this.candidates);
    next();
  } catch (error) {
    next(error);
  }
});

ElectionSchema.index({ organizationId: 1, year: -1, status: 1 });
module.exports = mongoose.models.Election || mongoose.model("Election", ElectionSchema);
