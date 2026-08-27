const mongoose = require("mongoose");

const User = require("../models/User");

const {
  sendAccountApproved,
  sendVerificationApproved,
  sendVerificationRejected,
} = require("../services/notificationService");

// ============================================================
// POLISYNC AFRICA — VERIFICATION CONTROLLER
// ============================================================
//
// Handles:
// 1. Verification requests
// 2. My verification status
// 3. Super Admin pending requests
// 4. Super Admin approval
// 5. Super Admin rejection
// 6. Super Admin revocation
// 7. Individual verification request lookup
// 8. Verification notifications
//
// SECURITY:
// Only the POLISYNC AFRICA Super Admin can:
// - approve
// - reject
// - revoke
// - inspect
// - manage verification requests
//
// Notification failure NEVER reverses a saved decision.
// ============================================================

// ============================================================
// CONFIGURATION
// ============================================================

const VERIFIED_BADGE = "/verified-badge.png";

const SUPER_ADMIN_ROLE = "super_admin";

const MAX_REASON_LENGTH = 2000;

const ALLOWED_VERIFICATION_TYPES = [
  "individual",
  "candidate",
  "organization",
  "political_party",
  "public_figure",
];

// ============================================================
// HELPERS
// ============================================================

const getAuthenticatedUserId = (req) => {
  return req.user?.id || req.user?._id || req.auth?.id || null;
};

const isValidObjectId = (id) => {
  return Boolean(id && mongoose.Types.ObjectId.isValid(id));
};

const getDisplayName = (user) => {
  if (user.displayName) {
    return user.displayName;
  }

  return `${user.firstName || ""} ${user.lastName || ""}`.trim();
};

const getReviewerIdentity = (superAdmin) => {
  return {
    id: superAdmin._id,

    displayName: "POLISYNC AFRICA",

    username: "polisync.africa",

    platformRole: SUPER_ADMIN_ROLE,
  };
};

const sendVerificationApprovalNotification = async (user) => {
  try {
    if (typeof sendVerificationApproved === "function") {
      await sendVerificationApproved({
        user,
      });

      return {
        sent: true,
        error: null,
      };
    }

    if (typeof sendAccountApproved === "function") {
      await sendAccountApproved({
        user,
      });

      return {
        sent: true,
        error: null,
      };
    }

    return {
      sent: false,

      error: "No verification approval notification service is available.",
    };
  } catch (error) {
    console.error("Verification approval notification error:", error);

    return {
      sent: false,

      error: error.message || "Verification approval notification failed.",
    };
  }
};

const sendVerificationRejectionNotification = async (user, reason) => {
  try {
    if (typeof sendVerificationRejected !== "function") {
      return {
        sent: false,

        error: "Verification rejection notification service is not available.",
      };
    }

    await sendVerificationRejected({
      user,

      reason,
    });

    return {
      sent: true,
      error: null,
    };
  } catch (error) {
    console.error("Verification rejection notification error:", error);

    return {
      sent: false,

      error: error.message || "Verification rejection notification failed.",
    };
  }
};

// ============================================================
// SUPER ADMIN AUTHORIZATION
// ============================================================

const requireSuperAdmin = async (req, res) => {
  const authenticatedUserId = getAuthenticatedUserId(req);

  if (!authenticatedUserId || !isValidObjectId(authenticatedUserId)) {
    res.status(401).json({
      success: false,

      message: "Authentication required.",
    });

    return null;
  }

  const authenticatedUser = await User.findById(authenticatedUserId);

  if (!authenticatedUser) {
    res.status(401).json({
      success: false,

      message: "Authenticated user was not found.",
    });

    return null;
  }

  if (authenticatedUser.platformRole !== SUPER_ADMIN_ROLE) {
    res.status(403).json({
      success: false,

      message: "Only the PoliSync Africa Super Admin can manage verification.",
    });

    return null;
  }

  if (authenticatedUser.accountStatus !== "approved") {
    res.status(403).json({
      success: false,

      message: "The Super Admin account is not active.",
    });

    return null;
  }

  return authenticatedUser;
};

// ============================================================
// REQUEST VERIFICATION
// ============================================================

exports.requestVerification = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId || !isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,

        message: "Authentication required.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,

        message: "User account not found.",
      });
    }

    if (user.platformRole === SUPER_ADMIN_ROLE) {
      return res.status(400).json({
        success: false,

        message: "POLISYNC AFRICA is already officially verified.",
      });
    }

    if (["suspended", "deactivated", "rejected"].includes(user.accountStatus)) {
      return res.status(403).json({
        success: false,

        message: "This account is not eligible to request verification.",
      });
    }

    if (user.accountStatus !== "approved") {
      return res.status(403).json({
        success: false,

        message:
          "Your account must be approved before requesting verification.",
      });
    }

    if (user.verification?.isVerified) {
      return res.status(409).json({
        success: false,

        message: "Your account is already verified.",
      });
    }

    if (user.verification?.status === "pending") {
      return res.status(409).json({
        success: false,

        message: "Your verification request is already pending review.",
      });
    }

    const { verificationType, requestReason } = req.body;

    const selectedType = String(verificationType || "individual")
      .trim()
      .toLowerCase();

    if (!ALLOWED_VERIFICATION_TYPES.includes(selectedType)) {
      return res.status(400).json({
        success: false,

        message: "Invalid verification type.",
      });
    }

    if (
      requestReason !== undefined &&
      requestReason !== null &&
      typeof requestReason !== "string"
    ) {
      return res.status(400).json({
        success: false,

        message: "Verification request reason must be text.",
      });
    }

    const reason = requestReason ? requestReason.trim() : null;

    if (reason && reason.length > MAX_REASON_LENGTH) {
      return res.status(400).json({
        success: false,

        message: "Verification request reason cannot exceed 2000 characters.",
      });
    }

    user.verification = user.verification || {};

    user.verification.status = "pending";

    user.verification.isVerified = false;

    user.verification.verificationType = selectedType;

    user.verification.requestedAt = new Date();

    user.verification.requestReason = reason;

    user.verification.reviewedAt = null;

    user.verification.reviewedBy = null;

    user.verification.rejectionReason = null;

    user.verification.revocationReason = null;

    user.verification.badgeAsset = VERIFIED_BADGE;

    await user.save();

    return res.status(201).json({
      success: true,

      message:
        "Verification request submitted successfully. Only PoliSync Africa Super Admin can approve or reject it.",

      verification: {
        status: user.verification.status,

        isVerified: user.verification.isVerified,

        verificationType: user.verification.verificationType,

        requestedAt: user.verification.requestedAt,
      },
    });
  } catch (error) {
    console.error("Request verification error:", error);

    return res.status(500).json({
      success: false,

      message: error.message || "Unable to submit verification request.",
    });
  }
};

// ============================================================
// GET MY VERIFICATION STATUS
// ============================================================

exports.getMyVerificationStatus = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId || !isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,

        message: "Authentication required.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,

        message: "User account not found.",
      });
    }

    if (user.platformRole === SUPER_ADMIN_ROLE) {
      return res.status(200).json({
        success: true,

        verification: {
          isVerified: true,

          status: "approved",

          verificationType: "platform",

          badgeAsset: VERIFIED_BADGE,

          platformAccount: true,
        },
      });
    }

    const verification = user.verification || {};

    return res.status(200).json({
      success: true,

      verification: {
        isVerified: Boolean(verification.isVerified),

        status: verification.status || "not_requested",

        verificationType: verification.verificationType || "individual",

        requestedAt: verification.requestedAt || null,

        reviewedAt: verification.reviewedAt || null,

        rejectionReason: verification.rejectionReason || null,

        revocationReason: verification.revocationReason || null,

        badgeAsset: verification.isVerified ? VERIFIED_BADGE : null,

        platformAccount: false,
      },
    });
  } catch (error) {
    console.error("Get verification status error:", error);

    return res.status(500).json({
      success: false,

      message: error.message || "Unable to retrieve verification status.",
    });
  }
};

// ============================================================
// GET PENDING VERIFICATION REQUESTS
// SUPER ADMIN ONLY
// ============================================================

exports.getPendingVerificationRequests = async (req, res) => {
  try {
    const superAdmin = await requireSuperAdmin(req, res);

    if (!superAdmin) {
      return;
    }

    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

    const skip = (page - 1) * limit;

    const filter = {
      platformRole: {
        $ne: SUPER_ADMIN_ROLE,
      },

      "verification.status": "pending",
    };

    const [requests, total] = await Promise.all([
      User.find(filter)
        .select(
          "displayName username firstName middleName lastName profilePhoto email phone platformRole accountStatus verification createdAt"
        )
        .sort({
          "verification.requestedAt": -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(filter),
    ]);

    const safeRequests = requests.map((user) => ({
      id: user._id,

      displayName: getDisplayName(user),

      username: user.username,

      profilePhoto: user.profilePhoto,

      platformRole: user.platformRole,

      accountStatus: user.accountStatus,

      verification: {
        status: user.verification?.status,

        verificationType: user.verification?.verificationType,

        requestedAt: user.verification?.requestedAt,

        requestReason: user.verification?.requestReason,
      },

      createdAt: user.createdAt,
    }));

    return res.status(200).json({
      success: true,

      requests: safeRequests,

      pagination: {
        page,

        limit,

        total,

        totalPages: Math.ceil(total / limit),
      },

      reviewer: getReviewerIdentity(superAdmin),
    });
  } catch (error) {
    console.error("Get pending verification requests error:", error);

    return res.status(500).json({
      success: false,

      message: error.message || "Unable to retrieve verification requests.",
    });
  }
};

// ============================================================
// APPROVE VERIFICATION
// SUPER ADMIN ONLY
// ============================================================

exports.approveVerification = async (req, res) => {
  try {
    const superAdmin = await requireSuperAdmin(req, res);

    if (!superAdmin) {
      return;
    }

    const targetUserId = req.params.userId;

    if (!isValidObjectId(targetUserId)) {
      return res.status(400).json({
        success: false,

        message: "Invalid user ID.",
      });
    }

    const user = await User.findById(targetUserId);

    if (!user) {
      return res.status(404).json({
        success: false,

        message: "User account not found.",
      });
    }

    if (user.platformRole === SUPER_ADMIN_ROLE) {
      return res.status(400).json({
        success: false,

        message: "POLISYNC AFRICA is already verified.",
      });
    }

    if (!user.verification || user.verification.status !== "pending") {
      return res.status(409).json({
        success: false,

        message: "This account does not have a pending verification request.",
      });
    }

    // --------------------------------------------------------
    // SAVE APPROVAL FIRST
    // --------------------------------------------------------

    user.verification.isVerified = true;

    user.verification.status = "approved";

    user.verification.reviewedAt = new Date();

    user.verification.reviewedBy = superAdmin._id;

    user.verification.rejectionReason = null;

    user.verification.revocationReason = null;

    user.verification.badgeAsset = VERIFIED_BADGE;

    await user.save();

    // --------------------------------------------------------
    // SEND APPROVAL NOTIFICATION
    // --------------------------------------------------------

    const notification = await sendVerificationApprovalNotification(user);

    return res.status(200).json({
      success: true,

      message: "Verification approved successfully.",

      notificationSent: notification.sent,

      notificationError: notification.error,

      user: {
        id: user._id,

        displayName: getDisplayName(user),

        username: user.username,

        verified: true,

        verificationStatus: "approved",

        verificationType: user.verification.verificationType,

        verificationBadge: VERIFIED_BADGE,
      },

      reviewedBy: getReviewerIdentity(superAdmin),
    });
  } catch (error) {
    console.error("Approve verification error:", error);

    return res.status(500).json({
      success: false,

      message: error.message || "Unable to approve verification.",
    });
  }
};

// ============================================================
// REJECT VERIFICATION
// SUPER ADMIN ONLY
// ============================================================

exports.rejectVerification = async (req, res) => {
  try {
    const superAdmin = await requireSuperAdmin(req, res);

    if (!superAdmin) {
      return;
    }

    const targetUserId = req.params.userId;

    if (!isValidObjectId(targetUserId)) {
      return res.status(400).json({
        success: false,

        message: "Invalid user ID.",
      });
    }

    const user = await User.findById(targetUserId);

    if (!user) {
      return res.status(404).json({
        success: false,

        message: "User account not found.",
      });
    }

    if (user.platformRole === SUPER_ADMIN_ROLE) {
      return res.status(400).json({
        success: false,

        message: "The POLISYNC AFRICA platform account cannot be rejected.",
      });
    }

    if (!user.verification || user.verification.status !== "pending") {
      return res.status(409).json({
        success: false,

        message: "This account does not have a pending verification request.",
      });
    }

    const { rejectionReason } = req.body;

    if (typeof rejectionReason !== "string" || !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,

        message: "A rejection reason is required.",
      });
    }

    const reason = rejectionReason.trim();

    if (reason.length > MAX_REASON_LENGTH) {
      return res.status(400).json({
        success: false,

        message: "Rejection reason cannot exceed 2000 characters.",
      });
    }

    // --------------------------------------------------------
    // SAVE REJECTION FIRST
    // --------------------------------------------------------

    user.verification.isVerified = false;

    user.verification.status = "rejected";

    user.verification.reviewedAt = new Date();

    user.verification.reviewedBy = superAdmin._id;

    user.verification.rejectionReason = reason;

    user.verification.badgeAsset = VERIFIED_BADGE;

    await user.save();

    // --------------------------------------------------------
    // SEND REJECTION NOTIFICATION
    // --------------------------------------------------------

    const notification = await sendVerificationRejectionNotification(
      user,
      reason
    );

    return res.status(200).json({
      success: true,

      message: "Verification request rejected.",

      notificationSent: notification.sent,

      notificationError: notification.error,

      user: {
        id: user._id,

        displayName: getDisplayName(user),

        username: user.username,

        verified: false,

        verificationStatus: "rejected",
      },

      reviewedBy: getReviewerIdentity(superAdmin),
    });
  } catch (error) {
    console.error("Reject verification error:", error);

    return res.status(500).json({
      success: false,

      message: error.message || "Unable to reject verification.",
    });
  }
};

// ============================================================
// REVOKE VERIFICATION
// SUPER ADMIN ONLY
// ============================================================

exports.revokeVerification = async (req, res) => {
  try {
    const superAdmin = await requireSuperAdmin(req, res);

    if (!superAdmin) {
      return;
    }

    const targetUserId = req.params.userId;

    if (!isValidObjectId(targetUserId)) {
      return res.status(400).json({
        success: false,

        message: "Invalid user ID.",
      });
    }

    const user = await User.findById(targetUserId);

    if (!user) {
      return res.status(404).json({
        success: false,

        message: "User account not found.",
      });
    }

    if (user.platformRole === SUPER_ADMIN_ROLE) {
      return res.status(403).json({
        success: false,

        message:
          "The POLISYNC AFRICA platform verification cannot be revoked through this endpoint.",
      });
    }

    if (!user.verification || !user.verification.isVerified) {
      return res.status(409).json({
        success: false,

        message: "This account is not currently verified.",
      });
    }

    const { revocationReason } = req.body;

    if (typeof revocationReason !== "string" || !revocationReason.trim()) {
      return res.status(400).json({
        success: false,

        message: "A revocation reason is required.",
      });
    }

    const reason = revocationReason.trim();

    if (reason.length > MAX_REASON_LENGTH) {
      return res.status(400).json({
        success: false,

        message: "Revocation reason cannot exceed 2000 characters.",
      });
    }

    user.verification.isVerified = false;

    user.verification.status = "revoked";

    user.verification.reviewedAt = new Date();

    user.verification.reviewedBy = superAdmin._id;

    user.verification.revocationReason = reason;

    user.verification.badgeAsset = VERIFIED_BADGE;

    await user.save();

    return res.status(200).json({
      success: true,

      message: "Verification has been revoked.",

      user: {
        id: user._id,

        displayName: getDisplayName(user),

        username: user.username,

        verified: false,

        verificationStatus: "revoked",
      },

      reviewedBy: getReviewerIdentity(superAdmin),
    });
  } catch (error) {
    console.error("Revoke verification error:", error);

    return res.status(500).json({
      success: false,

      message: error.message || "Unable to revoke verification.",
    });
  }
};

// ============================================================
// GET VERIFICATION REQUEST
// SUPER ADMIN ONLY
// ============================================================

exports.getVerificationRequest = async (req, res) => {
  try {
    const superAdmin = await requireSuperAdmin(req, res);

    if (!superAdmin) {
      return;
    }

    const targetUserId = req.params.userId;

    if (!isValidObjectId(targetUserId)) {
      return res.status(400).json({
        success: false,

        message: "Invalid user ID.",
      });
    }

    const user = await User.findById(targetUserId)
      .select(
        "displayName username firstName middleName lastName profilePhoto email phone nationality identificationType identificationNumber accountStatus platformRole verification createdAt"
      )
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,

        message: "User account not found.",
      });
    }

    return res.status(200).json({
      success: true,

      request: {
        id: user._id,

        displayName: getDisplayName(user),

        username: user.username,

        profilePhoto: user.profilePhoto,

        email: user.email,

        phone: user.phone,

        nationality: user.nationality,

        identificationType: user.identificationType,

        identificationNumber: user.identificationNumber,

        accountStatus: user.accountStatus,

        platformRole: user.platformRole,

        verification: user.verification,
      },

      reviewer: getReviewerIdentity(superAdmin),
    });
  } catch (error) {
    console.error("Get verification request error:", error);

    return res.status(500).json({
      success: false,

      message: error.message || "Unable to retrieve verification request.",
    });
  }
};
