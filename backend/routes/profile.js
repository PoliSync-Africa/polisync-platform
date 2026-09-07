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

const getUserId = (req) => req.user?._id || req.user?.id || null;

function buildSafeUser(user) {
  const isSuperAdmin = user.platformRole === "super_admin";
  const sourceFields = isSuperAdmin
    ? ["displayName", "firstName", "lastName", "email", "phone", "profilePhoto"]
    : [
        "firstName",
        "lastName",
        "dateOfBirth",
        "nationality",
        "identificationType",
        "identificationNumber",
        "email",
        "phone",
        "profilePhoto",
      ];
  const completed = sourceFields.filter((field) => {
    const value = user[field];
    return value != null && String(value).trim() !== "";
  }).length;

  return {
    id: user._id,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    displayName: user.displayName || [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" "),
    username: user.username,
    email: user.email,
    phone: user.phone,
    nationality: user.nationality,
    identificationType: user.identificationType,
    identificationNumber: user.identificationNumber,
    profilePhoto: user.profilePhoto || null,
    platformRole: user.platformRole,
    accountStatus: user.accountStatus,
    verified: Boolean(user.phoneVerified || user.verification?.isVerified),
    emailVerified: Boolean(user.emailVerified),
    phoneVerified: Boolean(user.phoneVerified),
    dateOfBirth: user.dateOfBirth || null,
    profileCompletion: Math.round((completed / sourceFields.length) * 100),
    privacy: user.privacy || null,
    updatedAt: user.updatedAt || null,
  };
}

async function loadMetrics(userId) {
  const [organizations, assignments, unreadNotifications, results] = await Promise.all([
    OrganizationMembership.countDocuments({ userId, status: "approved" }).catch(() => 0),
    OrganizationMembership.countDocuments({
      userId,
      status: "approved",
      role: { $nin: ["organization_member", "user"] },
    }).catch(() => 0),
    Notification.countDocuments({ recipient: userId, read: false }).catch(() => 0),
    Result.countDocuments({ submittedBy: userId }).catch(() => 0),
  ]);

  return { organizations, assignments, unreadNotifications, results };
}

router.get("/me", authenticate, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Authentication required." });

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ success: false, message: "Account not found." });

    const metrics = await loadMetrics(userId);
    return res.json({ success: true, user: buildSafeUser(user), metrics });
  } catch (error) {
    console.error("Current profile error:", error);
    return res.status(500).json({ success: false, message: error.message || "Unable to load current profile." });
  }
});

// Self-service profile editing is available to every authenticated account,
// including Super Admin. Privileged account/security fields remain protected.
router.patch("/me", authenticate, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Authentication required." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "Account not found." });

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const allowed = [
      "displayName",
      "firstName",
      "middleName",
      "lastName",
      "dateOfBirth",
      "nationality",
      "identificationType",
      "identificationNumber",
      "email",
      "phone",
    ];
    const updates = {};

    for (const field of allowed) {
      if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
      const value = body[field];

      if (field === "dateOfBirth") {
        if (value === "" || value == null) updates[field] = null;
        else {
          const date = new Date(value);
          if (Number.isNaN(date.getTime())) return res.status(400).json({ success: false, message: "Date of birth is invalid." });
          if (date > new Date()) return res.status(400).json({ success: false, message: "Date of birth cannot be in the future." });
          updates[field] = date;
        }
        continue;
      }

      const normalized = value == null ? "" : String(value).trim();
      if (["firstName", "lastName", "email", "phone"].includes(field) && !normalized) {
        return res.status(400).json({ success: false, message: `${field} is required.` });
      }
      if (field === "email") updates[field] = normalized.toLowerCase();
      else if (field === "identificationType") {
        if (normalized && !["passport", "ghana_card", "voter_id"].includes(normalized)) {
          return res.status(400).json({ success: false, message: "Identification type is invalid." });
        }
        updates[field] = normalized || null;
      } else {
        updates[field] = normalized;
      }
    }

    if (updates.email && updates.email !== user.email) {
      const exists = await User.exists({ _id: { $ne: user._id }, email: updates.email });
      if (exists) return res.status(409).json({ success: false, message: "That email address is already in use." });
      updates.emailVerified = false;
    }

    if (updates.phone && updates.phone !== user.phone) {
      if (!/^\+233\d{9}$/.test(updates.phone)) {
        return res.status(400).json({ success: false, message: "Phone must use Ghana format (+233XXXXXXXXX)." });
      }
      const exists = await User.exists({ _id: { $ne: user._id }, phone: updates.phone });
      if (exists) return res.status(409).json({ success: false, message: "That phone number is already in use." });
      updates.phoneVerified = false;
      updates.lastPhoneVerificationAt = null;
    }

    if (Object.prototype.hasOwnProperty.call(updates, "identificationNumber") && updates.identificationNumber === "") {
      updates.identificationNumber = null;
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: "No profile changes were provided." });
    }

    // Explicit allow-list prevents profile editing from changing password,
    // platform role, account status, verification, privacy, or memberships.
    await User.updateOne({ _id: user._id }, { $set: updates }, { runValidators: true });
    const freshUser = await User.findById(user._id).lean();
    const metrics = await loadMetrics(user._id);

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      user: buildSafeUser(freshUser),
      metrics,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    if (error?.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "value";
      return res.status(409).json({ success: false, message: `That ${field} is already in use.` });
    }
    return res.status(400).json({ success: false, message: error.message || "Unable to update profile." });
  }
});

router.get("/:userId", authenticate, profileController.viewProfile);
router.get("/me/viewers", authenticate, profileController.getProfileViewers);

module.exports = router;
