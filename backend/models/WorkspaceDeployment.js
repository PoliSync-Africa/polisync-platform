const mongoose = require("mongoose");

const geographySchema = new mongoose.Schema({
  level: { type: String, enum: ["national", "region", "constituency", "polling_station"], required: true },
  regionId: { type: mongoose.Schema.Types.ObjectId, ref: "Region", default: null },
  regionName: { type: String, trim: true, default: "" },
  constituencyId: { type: mongoose.Schema.Types.ObjectId, ref: "Constituency", default: null },
  constituencyName: { type: String, trim: true, default: "" },
  pollingStationId: { type: mongoose.Schema.Types.ObjectId, ref: "PollingStation", default: null },
  pollingStationName: { type: String, trim: true, default: "" },
  pollingStationCode: { type: String, trim: true, default: "" },
}, { _id: false });

const schema = new mongoose.Schema({
  targetType: { type: String, enum: ["campaign", "event", "election"], required: true, index: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  electionId: { type: mongoose.Schema.Types.ObjectId, ref: "Election", default: null, index: true },
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  ownerOrganizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null, index: true },
  ownerType: { type: String, enum: ["person", "candidate", "political_party", "organization"], default: "person", index: true },
  kind: { type: String, enum: ["role", "assignment"], required: true },
  roleName: { type: String, required: true, trim: true, maxlength: 120 },
  roleDescription: { type: String, trim: true, maxlength: 500, default: "" },
  personId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  personName: { type: String, trim: true, default: "" },
  location: { type: geographySchema, default: null },
  responsibilities: { type: String, trim: true, maxlength: 1500, default: "" },
  status: { type: String, enum: ["assigned", "active", "completed", "removed"], default: "assigned" },
}, { timestamps: true });

schema.index({ targetType: 1, targetId: 1, ownerUserId: 1, updatedAt: -1 });
schema.index({ electionId: 1, ownerUserId: 1, updatedAt: -1 });

module.exports = mongoose.models.WorkspaceDeployment || mongoose.model("WorkspaceDeployment", schema);
