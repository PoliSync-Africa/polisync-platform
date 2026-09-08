const mongoose = require("mongoose");

const ComplaintReportSchema = new mongoose.Schema({
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["complaint", "report", "incident", "technical", "security"], required: true, index: true },
  subject: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium", index: true },
  status: { type: String, enum: ["pending", "under_review", "resolved", "rejected"], default: "pending", index: true },
  adminNote: { type: String, trim: true, maxlength: 3000, default: "" },
  resolvedAt: { type: Date, default: null },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

ComplaintReportSchema.index({ status: 1, createdAt: -1 });
ComplaintReportSchema.index({ priority: 1, createdAt: -1 });

module.exports = mongoose.models.ComplaintReport || mongoose.model("ComplaintReport", ComplaintReportSchema);
