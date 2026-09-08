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

const assignmentSchema = new mongoose.Schema({
  personId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  personName: { type: String, trim: true, default: "" },
  role: { type: String, required: true, trim: true, maxlength: 100 },
  location: { type: geographySchema, default: null },
  responsibilities: { type: String, trim: true, maxlength: 1000, default: "" },
  status: { type: String, enum: ["assigned", "active", "completed", "removed"], default: "assigned" },
}, { timestamps: true });

const budgetSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  category: { type: String, trim: true, maxlength: 100, default: "General" },
  amount: { type: Number, min: 0, default: 0 },
  notes: { type: String, trim: true, maxlength: 500, default: "" },
}, { timestamps: true });

const logisticsSchema = new mongoose.Schema({
  item: { type: String, required: true, trim: true, maxlength: 160 },
  category: { type: String, trim: true, maxlength: 100, default: "General" },
  quantity: { type: Number, min: 0, default: 1 },
  unitCost: { type: Number, min: 0, default: 0 },
  location: { type: geographySchema, default: null },
  status: { type: String, enum: ["planned", "ordered", "in_transit", "delivered", "cancelled"], default: "planned" },
  notes: { type: String, trim: true, maxlength: 500, default: "" },
}, { timestamps: true });

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 300, default: "" },
}, { timestamps: true });

const personalCampaignSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  election: { type: String, trim: true, maxlength: 160, default: "" },
  geography: { type: String, trim: true, maxlength: 160, default: "" },
  objective: { type: String, trim: true, maxlength: 1000, default: "" },
  status: { type: String, enum: ["planning", "active", "paused", "completed"], default: "planning" },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  roles: { type: [roleSchema], default: [] },
  assignments: { type: [assignmentSchema], default: [] },
  budgets: { type: [budgetSchema], default: [] },
  logistics: { type: [logisticsSchema], default: [] },
}, { timestamps: true });

personalCampaignSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.models.PersonalCampaign || mongoose.model("PersonalCampaign", personalCampaignSchema);
