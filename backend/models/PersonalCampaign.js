const mongoose = require("mongoose");

const personalCampaignSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  election: { type: String, trim: true, maxlength: 160, default: "" },
  geography: { type: String, trim: true, maxlength: 160, default: "" },
  objective: { type: String, trim: true, maxlength: 1000, default: "" },
  status: { type: String, enum: ["planning", "active", "paused", "completed"], default: "planning" },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
}, { timestamps: true });

personalCampaignSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.models.PersonalCampaign || mongoose.model("PersonalCampaign", personalCampaignSchema);
