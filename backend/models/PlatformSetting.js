const mongoose = require("mongoose");

const PlatformSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "platform" },
    platformName: { type: String, default: "PoliSync Africa" },
    defaultCountry: { type: String, default: "Ghana" },
    defaultElectionStatus: { type: String, enum: ["Draft", "Active", "Closed"], default: "Draft" },
    allowPublicRegistration: { type: Boolean, default: true },
    requirePhoneVerification: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    publicResultsEnabled: { type: Boolean, default: true },
    auditLoggingEnabled: { type: Boolean, default: true },
    emailNotificationsEnabled: { type: Boolean, default: true },
    smsNotificationsEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PlatformSetting", PlatformSettingSchema);
