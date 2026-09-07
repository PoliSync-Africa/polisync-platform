const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  tokenHash: { type: String, required: true, unique: true, index: true },
  role: { type: String, required: true, enum: ["national_party_admin", "regional_party_admin", "constituency_admin", "polling_station_agent"] },
  level: { type: String, required: true, enum: ["national", "regional", "constituency", "polling_station"] },
  regionId: { type: mongoose.Schema.Types.ObjectId, ref: "Region", default: null, index: true },
  constituencyId: { type: mongoose.Schema.Types.ObjectId, ref: "Constituency", default: null, index: true },
  pollingStationId: { type: mongoose.Schema.Types.ObjectId, ref: "PollingStation", default: null, index: true },
  maxUses: { type: Number, default: 1, min: 1, max: 1000 },
  uses: { type: Number, default: 0, min: 0 },
  expiresAt: { type: Date, required: true, index: true },
  revokedAt: { type: Date, default: null },
  acceptedAt: { type: Date, default: null },
  lastAcceptedUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

invitationSchema.index({ organizationId: 1, status: 1, createdAt: -1 });

invitationSchema.virtual("status").get(function () {
  if (this.revokedAt) return "revoked";
  if (this.expiresAt <= new Date()) return "expired";
  if (this.uses >= this.maxUses) return "used";
  return "active";
});

module.exports = mongoose.models.Invitation || mongoose.model("Invitation", invitationSchema);
