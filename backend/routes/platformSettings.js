const express = require("express");
const PlatformSettings = require("../models/PlatformSettings");
const { authenticate, requireSuperAdmin } = require("../auth/middleware");

const router = express.Router();
const DEFAULTS = {
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

router.use(authenticate, requireSuperAdmin);

router.get("/", async (req, res) => {
  try {
    let settings = await PlatformSettings.findOne({ singleton: "platform" }).lean();
    if (!settings) settings = await PlatformSettings.create({ singleton: "platform", ...DEFAULTS, updatedBy: req.auth.userId });
    return res.json({ success: true, settings: { ...DEFAULTS, ...settings } });
  } catch (error) {
    console.error("Platform settings load error:", error);
    return res.status(500).json({ success: false, message: "Unable to load platform settings." });
  }
});

router.patch("/", async (req, res) => {
  try {
    const allowed = Object.keys(DEFAULTS);
    const update = {};
    for (const key of allowed) {
      if (req.body?.[key] !== undefined) update[key] = req.body[key];
    }
    if (update.platformName !== undefined && !String(update.platformName).trim()) {
      return res.status(400).json({ success: false, message: "Platform name cannot be empty." });
    }
    if (update.defaultElectionStatus !== undefined && !["Draft", "Active", "Closed"].includes(update.defaultElectionStatus)) {
      return res.status(400).json({ success: false, message: "Invalid default election status." });
    }
    update.updatedBy = req.auth.userId;
    const settings = await PlatformSettings.findOneAndUpdate(
      { singleton: "platform" },
      { $set: update, $setOnInsert: { singleton: "platform" } },
      { new: true, upsert: true, runValidators: true }
    ).lean();
    return res.json({ success: true, message: "Platform settings saved successfully.", settings: { ...DEFAULTS, ...settings } });
  } catch (error) {
    console.error("Platform settings update error:", error);
    return res.status(400).json({ success: false, message: "Unable to save platform settings." });
  }
});

module.exports = router;
