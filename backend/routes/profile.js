const express = require("express");
const { authenticate } = require("../auth/middleware");
const { updateProfilePhoto } = require("../controllers/profilePhotoController");
const profileController = require("../controllers/profileController");
const User = require("../models/User");
const OrganizationMembership = require("../models/OrganizationMembership");
const Reminder = require("../models/Reminder");
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

    const [organizations, assignments, unreadNotifications, activeReminders, results] = await Promise.all([
      OrganizationMembership.countDocuments({ userId, status: "approved" }),
      OrganizationMembership.countDocuments({ userId, status: "approved", role: { $nin: ["organization_member", "user"] } }),
      Notification.countDocuments({ userId, read: false }).catch(() => 0),
      Reminder.countDocuments({ userId, completed: false }).catch(() => 0),
      Result.countDocuments({ submittedBy: userId }).catch(() => 0),
    ]);

    const sourceFields = ["firstName", "lastName", "email", "phone", "dateOfBirth", "profilePhoto"];
    const completed = sourceFields.filter((field) => user[field] != null && String(user[field]).trim() !== "").length;
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
      verified: Boolean(user.emailVerified || user.phoneVerified),
      dateOfBirth: user.dateOfBirth || null,
      profileCompletion: Math.round((completed / sourceFields.length) * 100),
      privacy: user.privacy || null,
    };

    return res.json({ success: true, user: safeUser, metrics: { organizations, assignments, unreadNotifications, activeReminders, results } });
  } catch (error) {
    console.error("Current profile error:", error);
    return res.status(500).json({ success: false, message: error.message || "Unable to load current profile." });
  }
});

router.get("/:userId", authenticate, profileController.viewProfile);
router.get("/me/viewers", authenticate, profileController.getProfileViewers);

module.exports = router;
