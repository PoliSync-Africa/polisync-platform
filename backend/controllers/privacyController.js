const mongoose = require("mongoose");
const User = require("../models/User");
const OrganizationMembership = require("../models/OrganizationMembership");

const ALLOWED = {
  messagePrivacy: ["everyone", "organizations_only", "nobody"],
  profileVisibility: ["everyone", "organizations_only", "nobody"],
  profileViewPrivacy: ["everyone", "organizations_only", "nobody"],
  locationVisibility: ["everyone", "organizations_only", "selected_people", "nobody"],
  locationPrecision: ["exact", "approximate"],
  locationSharingDuration: ["until_turned_off", "one_hour", "eight_hours", "twenty_four_hours"],
};

const getUserId = (req) => req.auth?.userId || req.user?._id || req.user?.id || null;

const cleanPrivacy = (privacy = {}) => {
  const result = {};
  for (const [key, value] of Object.entries(privacy)) {
    if (!(key in ALLOWED)) {
      if (["showOnlineStatus", "showLastSeen", "showProfileViewers", "shareLocation"].includes(key) && typeof value === "boolean") result[key] = value;
      continue;
    }
    if (ALLOWED[key].includes(value)) result[key] = value;
  }
  return result;
};

exports.getPrivacy = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return res.status(401).json({ success: false, message: "Authentication required." });
    const user = await User.findById(userId).select("privacy");
    if (!user) return res.status(404).json({ success: false, message: "Account not found." });
    return res.json({ success: true, privacy: user.privacy || {} });
  } catch (error) {
    console.error("GET PRIVACY ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load privacy settings." });
  }
};

exports.updatePrivacy = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return res.status(401).json({ success: false, message: "Authentication required." });
    const updates = cleanPrivacy(req.body?.privacy || req.body || {});
    if (!Object.keys(updates).length) return res.status(400).json({ success: false, message: "No valid privacy settings supplied." });

    const set = {};
    for (const [key, value] of Object.entries(updates)) set[`privacy.${key}`] = value;
    const user = await User.findByIdAndUpdate(userId, { $set: set }, { new: true, runValidators: true }).select("privacy");
    if (!user) return res.status(404).json({ success: false, message: "Account not found." });
    return res.json({ success: true, message: "Privacy settings saved.", privacy: user.privacy });
  } catch (error) {
    console.error("UPDATE PRIVACY ERROR:", error);
    return res.status(400).json({ success: false, message: error.message || "Unable to save privacy settings." });
  }
};

exports.areOrganizationMembers = async (userAId, userBId) => {
  if (!userAId || !userBId || userAId.toString() === userBId.toString()) return true;
  const memberships = await OrganizationMembership.find({
    userId: { $in: [userAId, userBId] },
    status: "approved",
  }).select("userId organizationId").lean();
  const a = new Set(memberships.filter((m) => m.userId.toString() === userAId.toString()).map((m) => m.organizationId.toString()));
  return memberships.some((m) => m.userId.toString() === userBId.toString() && a.has(m.organizationId.toString()));
};

exports.canMessage = async (sender, recipient) => {
  if (!sender || !recipient) return false;
  if (sender._id.toString() === recipient._id.toString()) return false;
  const privacy = recipient.privacy?.messagePrivacy || "nobody";
  if (privacy === "everyone") return true;
  if (privacy === "nobody") return false;
  return exports.areOrganizationMembers(sender._id, recipient._id);
};
