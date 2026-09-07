const mongoose = require("mongoose");

const partySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  logoUrl: { type: String, default: "", trim: true },
}, { _id: false });

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  party: { type: String, default: "", trim: true },
  partyLogoUrl: { type: String, default: "", trim: true },
  profilePictureUrl: { type: String, default: "", trim: true },
  constituencyId: { type: mongoose.Schema.Types.ObjectId, ref: "Constituency", default: null },
}, { _id: false });

const ElectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    year: { type: Number, required: true },
    type: { type: String, enum: ["Presidential", "Parliamentary", "Local"], required: true },
    country: { type: String, default: "Ghana" },
    status: { type: String, enum: ["Draft", "Active", "Closed"], default: "Draft" },
    totalPollingStations: { type: Number, default: 0 },
    parties: { type: [partySchema], default: [] },
    candidates: { type: [candidateSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Election", ElectionSchema);
