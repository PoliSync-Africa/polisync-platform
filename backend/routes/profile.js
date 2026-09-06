const express = require("express");
const { authenticate } = require("../auth/middleware");
const { updateProfilePhoto } = require("../controllers/profilePhotoController");
const profileController = require("../controllers/profileController");
const User = require("../models/User");
const OrganizationMembership = require("../models/OrganizationMembership");
const Notification = require("../models/Notification");
const Result = require("../models/Result");

const router = express.Router();

router.patch("/photo", authenticate, updateProfilePhoto);

router.get("/me", authenticate, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Authentication required." });
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ success: false, message: "Account not found." });

    const [organizations, assignments, unreadNotifications, results, memberships] = await Promise.all([
      OrganizationMembership.countDocuments({ userId, status: "approved" }),
      OrganizationMembership.countDocuments({ userId, status: "approved", role: { $nin: ["organization_member", "user"] } }),
      Notification.countDocuments({ recipient: userId, read: false }).catch(() => 0),
      Result.countDocuments({ submittedBy: userId }).catch(() => 0),
      OrganizationMembership.find({ userId, status: "approved" })
        .select("organizationId role level regionId constituencyId pollingStationId pollingStationCode")
        .populate({ path: "organizationId", select: "name organizationType politicalPartyName" })
        .populate({ path: "regionId", select: "name" })
        .populate({ path: "constituencyId", select: "name" })
        .populate({ path: "pollingStationId", select: "name pollingStationCode" })
        .lean()
        .catch(() => []),
    ]);

    const sourceFields = ["firstName", "lastName", "email", "phone", "dateOfBirth", "profilePhoto"];
    const completed = sourceFields.filter((field) => user[field] != null && String(user[field]).trim() !== "").length;
    const organizationContexts = memberships
      .filter((membership) => membership.organizationId)
      .map((membership) => ({
        id: membership.organizationId._id,
        organizationName: membership.organizationId.name,
        organizationType: membership.organizationId.organizationType || null,
        politicalPartyName: membership.organizationId.politicalPartyName || null,
        role: membership.role,
        level: membership.level,
        regionName: membership.regionId?.name || null,
        constituencyName: membership.constituencyId?.name || null,
        pollingStationName: membership.pollingStationId?.name || null,
        pollingStationCode: membership.pollingStationId?.pollingStationCode || membership.pollingStationCode || null,
      }));

    const safeUser = {
      id: user._id,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      displayName: user.displayName || [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" "),
      username: user.username,
      email: user.email,
      phone: user.phone,
      profilePhoto: user.profilePhoto || null,
      platformRole: user.platformRole,
      accountStatus: user.accountStatus,
      verified: Boolean(user.phoneVerified),
      emailVerified: true,
      phoneVerified: Boolean(user.phoneVerified),
      dateOfBirth: user.dateOfBirth || null,
      profileCompletion: Math.round((completed / sourceFields.length) * 100),
      privacy: user.privacy || null,
      organizationContexts,
    };

    return res.json({ success: true, user: safeUser, metrics: { organizations, assignments, unreadNotifications, results } });
  } catch (error) {
    console.error("Current profile error:", error);
    return res.status(500).json({ success: false, message: error.message || "Unable to load current profile." });
  }
});

router.get("/:userId", authenticate, profileController.viewProfile);
router.get("/me/viewers", authenticate, profileController.getProfileViewers);

module.exports = router;
