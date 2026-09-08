const mongoose = require("mongoose");

const personalEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  type: { type: String, enum: ["Executive Meeting", "Campaign Strategy", "Polling Agent Training", "Community Engagement", "Election Operations", "Research Meeting", "Press Conference", "Virtual Meeting"], default: "Executive Meeting" },
  date: { type: String, required: true, match: /^\\d{4}-\\d{2}-\\d{2}$/ },
  startTime: { type: String, required: true, match: /^\\d{2}:\\d{2}$/ },
  endTime: { type: String, required: true, match: /^\\d{2}:\\d{2}$/ },
  location: { type: String, trim: true, maxlength: 240, default: "Location not specified" },
  organizer: { type: String, trim: true, maxlength: 160, default: "Current User" },
  priority: { type: String, enum: ["Low", "Normal", "High", "Urgent"], default: "Normal" },
  status: { type: String, enum: ["Scheduled", "Confirmed", "Pending", "Cancelled"], default: "Scheduled" },
}, { timestamps: true });

personalEventSchema.index({ userId: 1, date: 1, startTime: 1 });
personalEventSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.models.PersonalEvent || mongoose.model("PersonalEvent", personalEventSchema);
