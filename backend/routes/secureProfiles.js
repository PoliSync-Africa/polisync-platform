const express = require("express");
const mongoose = require("mongoose");
const { authenticate } = require("../auth/middleware");
const User = require("../models/User");
const OrganizationMembership = require("../models/OrganizationMembership");
const ProfileView = require("../models/ProfileView");

const router = express.Router();
router.use(authenticate);
const me = (req) => req.auth.userId;
const valid = (id) => mongoose.Types.ObjectId.isValid(id);

async function sameOrganization(a, b) {
  const rows = await OrganizationMembership.find({ userId: { $in: [a, b] }, status: "approved" }).select("userId organizationId").lean();
  const orgs = new Set(rows.filter((x) => x.userId.toString() === a.toString()).map((x) => x.organizationId.toString()));
  return rows.some((x) => x.userId.toString() === b.toString() && orgs.has(x.organizationId.toString()));
}

function publicUser(user) {
  return { id: user._id, username: user.username, displayName: user.displayName || [user.firstName, user.lastName].filter(Boolean).join(" "), profilePhoto: user.profilePhoto || null, verification: user.verification ? { isVerified: user.verification.isVerified, status: user.verification.status, verificationType: user.verification.verificationType, badgeAsset: user.verification.badgeAsset } : null };
}

async function viewerList(req, res) {
  try {
    const owner = await User.findById(me(req));
    if (!owner) return res.status(404).json({ success: false, message: "Account not found." });
    if (owner.privacy?.showProfileViewers === false) return res.json({ success: true, viewers: [] });
    const rows = await ProfileView.find({ profileOwner: owner._id, viewerVisible: true }).sort({ viewedAt: -1 }).limit(100).populate("viewer", "username displayName firstName lastName profilePhoto verification");
    return res.json({ success: true, viewers: rows.map((r) => ({ viewedAt: r.viewedAt, viewer: r.viewer ? publicUser(r.viewer) : null })).filter((r) => r.viewer) });
  } catch (error) { return res.status(500).json({ success: false, message: "Unable to load profile viewers." }); }
}

router.get("/viewers", viewerList);
router.get("/me/viewers", viewerList);

router.get("/:userId", async (req, res) => {
  try {
    if (!valid(req.params.userId)) return res.status(400).json({ success: false, message: "Invalid profile user ID." });
    const owner = await User.findById(req.params.userId);
    if (!owner) return res.status(404).json({ success: false, message: "User profile not found." });
    const viewer = await User.findById(me(req));
    const own = owner._id.toString() === viewer._id.toString();
    const member = own ? true : await sameOrganization(viewer._id, owner._id);
    const visibility = owner.privacy?.profileVisibility || "nobody";
    if (!own && (visibility === "nobody" || (visibility === "organizations_only" && !member))) return res.status(403).json({ success: false, message: visibility === "nobody" ? "This profile is private." : "This profile is only visible to organization members." });
    if (!own && owner.privacy?.profileViewPrivacy !== "nobody") {
      const duplicateWindow = new Date(Date.now() - 5 * 60 * 1000);
      const recent = await ProfileView.findOne({ profileOwner: owner._id, viewer: viewer._id, viewedAt: { $gte: duplicateWindow } });
      if (!recent) await ProfileView.create({ profileOwner: owner._id, viewer: viewer._id, viewedAt: new Date(), viewerPlatformRole: viewer.platformRole, viewerIsOrganizationMember: member, viewerVisible: true, deviceType: "unknown", source: "direct" });
    }
    const messagePrivacy = owner.privacy?.messagePrivacy || "nobody";
    const canMessage = !own && (messagePrivacy === "everyone" || (messagePrivacy === "organizations_only" && member));
    return res.json({ success: true, user: publicUser(owner), viewerIsOrganizationMember: member, canMessage });
  } catch (error) { console.error("SECURE PROFILE ERROR:", error); return res.status(500).json({ success: false, message: "Unable to load profile." }); }
});

module.exports = router;
