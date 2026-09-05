const PlatformSetting = require("../models/PlatformSetting");

const DEFAULTS = {
  key: "platform",
  platformName: "PoliSync Africa",
  defaultCountry: "Ghana",
  defaultElectionStatus: "Draft",
  allowPublicRegistration: true,
  requirePhoneVerification: true,
  maintenanceMode: false,
  publicResultsEnabled: true,
  auditLoggingEnabled: true,
  emailNotificationsEnabled: true,
  smsNotificationsEnabled: true,
};

const allowedFields = Object.keys(DEFAULTS).filter((field) => field !== "key");

exports.getSettings = async (req, res) => {
  try {
    const settings = await PlatformSetting.findOneAndUpdate(
      { key: "platform" },
      { $setOnInsert: DEFAULTS },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    res.json({ success: true, settings });
  } catch (error) {
    console.error("Get platform settings error:", error);
    res.status(500).json({ success: false, message: "Unable to load platform settings." });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const updates = Object.fromEntries(
      Object.entries(req.body || {}).filter(([key]) => allowedFields.includes(key))
    );

    if (updates.platformName !== undefined && !String(updates.platformName).trim()) {
      return res.status(400).json({ success: false, message: "Platform name cannot be empty." });
    }

    const settings = await PlatformSetting.findOneAndUpdate(
      { key: "platform" },
      { $set: updates, $setOnInsert: DEFAULTS },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

    res.json({ success: true, settings, message: "Platform settings saved successfully." });
  } catch (error) {
    console.error("Update platform settings error:", error);
    res.status(500).json({ success: false, message: error.message || "Unable to save platform settings." });
  }
};
