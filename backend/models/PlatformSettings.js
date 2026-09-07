const mongoose = require("mongoose");

const platformSettingsSchema = new mongoose.Schema(
  {
    singleton: { type: String, unique: true, default: "platform" },
    platformName: { type: String, trim: true, default: "PoliSync Africa" },
    defaultCountry: { type: String, trim: true, default: "Ghana" },
    defaultElectionStatus: { type: String, enum: ["Draft", "Active", "Closed"], default: "Draft" },
    allowPublicRegistration: { type: Boolean, default: true },
    requirePhoneVerification: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    publicResultsEnabled: { type: Boolean, default: true },
    auditLoggingEnabled: { type: Boolean, default: true },
    emailNotificationsEnabled: { type: Boolean, default: true },
    smsNotificationsEnabled: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PlatformSettings", platformSettingsSchema);
