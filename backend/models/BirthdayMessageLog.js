const mongoose = require("mongoose");

const birthdayMessageLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  birthdayDate: { type: String, required: true },
  phone: { type: String, required: true },
  status: { type: String, enum: ["sent", "failed"], required: true },
  provider: { type: String, default: "arkesel" },
  providerCode: { type: String, default: null },
  providerMessage: { type: String, default: null },
  sentAt: { type: Date, default: null },
  error: { type: String, default: null },
}, { timestamps: true });

birthdayMessageLogSchema.index({ user: 1, birthdayDate: 1 }, { unique: true });

module.exports = mongoose.models.BirthdayMessageLog || mongoose.model("BirthdayMessageLog", birthdayMessageLogSchema);
