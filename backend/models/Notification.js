const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: "CalendarEvent", default: null },
  type: { type: String, enum: ["system", "message", "security", "verification", "organization", "election", "calendar", "result"], default: "system", index: true },
  channel: { type: String, enum: ["in_app", "email", "sms", "push"], default: "in_app" },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  status: { type: String, enum: ["pending", "sent", "failed", "cancelled"], default: "pending", index: true },
  scheduledFor: { type: Date, default: null },
  read: { type: Boolean, default: false, index: true },
  readAt: { type: Date, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
