const mongoose = require("mongoose");

const personalFieldTaskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 1200, default: "" },
  area: { type: String, trim: true, maxlength: 160, default: "" },
  taskType: { type: String, enum: ["canvass", "community_visit", "meeting", "survey", "polling_station", "logistics", "other"], default: "other" },
  status: { type: String, enum: ["planned", "in_progress", "completed", "cancelled"], default: "planned" },
  dueDate: { type: Date, default: null },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
}, { timestamps: true });

personalFieldTaskSchema.index({ userId: 1, status: 1, dueDate: 1 });

module.exports = mongoose.models.PersonalFieldTask || mongoose.model("PersonalFieldTask", personalFieldTaskSchema);
