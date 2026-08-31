const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  action: { type: String, required: true, trim: true, index: true },
  resource: { type: String, trim: true, default: null },
  resourceId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, default: null },
  userAgent: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
