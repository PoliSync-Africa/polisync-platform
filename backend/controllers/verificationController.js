const mongoose = require("mongoose");

const User = require("../models/User");

// ============================================================
// CONSTANTS
// ============================================================

const VERIFIED_BADGE =
  "/verified-badge.png";

const SUPER_ADMIN_ROLE =
  "super_admin";

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
  return (
    req.user?.id ||
    req.user?._id ||
    req.auth?.id ||
    null
  );
};

const isValidObjectId = (id) => {
  return Boolean(
    id &&
      mongoose.Types.ObjectId.isValid(id)
  );
};

// ============================================================
// SUPER ADMIN AUTHORIZATION
// ============================================================
// IMPORTANT:
//
// Only the PoliSync Africa Super Admin may:
//
// - approve verification
// - reject verification
// - revoke verification
//
// Being a party admin, organization admin, candidate,
// regional admin, constituency officer, or any other role
// does NOT grant verification authority.
// ============================================================

const requireSuperAdmin = async (
  req,
  res
) => {
  const authenticatedUserId =
    getAuthenticatedUserId(req);

  if (
    !authenticatedUserId ||
    !isValidObjectId(
      authenticatedUserId
    )
  ) {
    res.status(401).json({
      success: false,
      message:
        "Authentication required.",
    });

    return null;
  }

  const authenticatedUser =
    await User.findById(
      authenticatedUserId
    );

  if (!authenticatedUser) {
    res.status(401).json({
      success: false,
      message:
        "Authenticated user was not found.",
    });

    return null;
  }

  if (
    authenticatedUser.platformRole !==
    SUPER_ADMIN_ROLE
  ) {
    res.status(403).json({
      success: false,
      message:
        "Only the PoliSync Africa Super Admin can manage verification.",
    });

    return null;
  }

  if (
    authenticatedUser.accountStatus !==
    "approved"
  ) {
    res.status(403).json({
      success: false,
      message:
        "The Super Admin account is not active.",
    });

    return null;
  }

  return authenticatedUser;
};

// ============================================================
// REQUEST VERIFICATION
// ============================================================
// POST /api/verification/request
//
// Any eligible ordinary user may request verification.
//
// A user cannot approve their own request.
//
// A new request becomes:
//
// status = pending
// isVerified = false
// ============================================================

exports.requestVerification =
  async (req, res) => {
    try {
      const userId =
        getAuthenticatedUserId(req);

      if (
        !userId ||
        !isValidObjectId(userId)
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
        });
      }

      const user =
        await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User account not found.",
        });
      }

      // --------------------------------------------------------
      // SUPER ADMIN
      // --------------------------------------------------------
      // POLISYNC AFRICA is already verified.
      // It does not need to submit a request.
      // --------------------------------------------------------

      if (
        user.platformRole ===
        SUPER_ADMIN_ROLE
      ) {
        return res.status(400).json({
          success: false,
          message:
            "POLISYNC AFRICA is already officially verified.",
        });
      }

      // --------------------------------------------------------
      // ACCOUNT STATUS
      // --------------------------------------------------------

      if (
        user.accountStatus ===
        "suspended"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Suspended accounts cannot request verification.",
        });
      }

      if (
        user.accountStatus ===
        "deactivated"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Deactivated accounts cannot request verification.",
        });
      }

      if (
        user.accountStatus ===
        "rejected"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Rejected accounts cannot request verification.",
        });
      }

      // --------------------------------------------------------
      // ACCOUNT APPROVAL
      // --------------------------------------------------------

      if (
        user.accountStatus !==
        "approved"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your account must be approved before requesting verification.",
        });
      }

      // --------------------------------------------------------
      // EXISTING VERIFICATION
      // --------------------------------------------------------

      if (
        user.verification &&
        user.verification.isVerified
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Your account is already verified.",
        });
      }

      // --------------------------------------------------------
      // EXISTING PENDING REQUEST
      // --------------------------------------------------------

      if (
        user.verification &&
        user.verification.status ===
          "pending"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Your verification request is already pending review.",
        });
      }

      // --------------------------------------------------------
      // REQUEST DATA
      // --------------------------------------------------------

      const {
        verificationType,
        requestReason,
      } = req.body;

      const selectedType =
        verificationType ||
        "individual";

      if (
        !ALLOWED_VERIFICATION_TYPES.includes(
          selectedType
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid verification type.",
        });
      }

      if (
        requestReason &&
        requestReason.length >
          2000
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Verification request reason cannot exceed 2000 characters.",
        });
      }

      // --------------------------------------------------------
      // CREATE REQUEST
      // --------------------------------------------------------

      user.verification.status =
        "pending";

      user.verification.isVerified =
        false;

      user.verification.verificationType =
        selectedType;

      user.verification.requestedAt =
        new Date();

      user.verification.requestReason =
        requestReason
          ? requestReason.trim()
          : null;

      user.verification.reviewedAt =
        null;

      user.verification.reviewedBy =
        null;

      user.verification.rejectionReason =
        null;

      user.verification.revocationReason =
        null;

      user.verification.badgeAsset =
        VERIFIED_BADGE;

      await user.save();

      return res.status(201).json({
        success: true,

        message:
          "Verification request submitted successfully. Only PoliSync Africa Super Admin can approve or reject it.",

        verification: {
          status:
            user.verification
              .status,

          isVerified:
            user.verification
              .isVerified,

          verificationType:
            user.verification
              .verificationType,

          requestedAt:
            user.verification
              .requestedAt,
        },
      });
    } catch (error) {
      console.error(
        "Request verification error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to submit verification request.",
      });
    }
  };

// ============================================================
// GET MY VERIFICATION STATUS
// ============================================================
// GET /api/verification/me
//
// Allows a user to see their own verification status.
// ============================================================

exports.getMyVerificationStatus =
  async (req, res) => {
    try {
      const userId =
        getAuthenticatedUserId(req);

      if (
        !userId ||
        !isValidObjectId(userId)
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
        });
      }

      const user =
        await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User account not found.",
        });
      }

      const isPlatformAccount =
        user.platformRole ===
        SUPER_ADMIN_ROLE;

      if (isPlatformAccount) {
        return res.status(200).json({
          success: true,

          verification: {
            isVerified: true,

            status:
              "approved",

            verificationType:
              "platform",

            badgeAsset:
              VERIFIED_BADGE,

            platformAccount:
              true,
          },
        });
      }

      return res.status(200).json({
        success: true,

        verification: {
          isVerified:
            user.verification
              .isVerified,

          status:
            user.verification
              .status,

          verificationType:
            user.verification
              .verificationType,

          requestedAt:
            user.verification
              .requestedAt,

          reviewedAt:
            user.verification
              .reviewedAt,

          rejectionReason:
            user.verification
              .rejectionReason,

          badgeAsset:
            user.verification
              .isVerified
              ? VERIFIED_BADGE
              : null,

          platformAccount:
            false,
        },
      });
    } catch (error) {
      console.error(
        "Get verification status error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to retrieve verification status.",
      });
    }
  };

// ============================================================
// GET PENDING VERIFICATION REQUESTS
// ============================================================
// GET /api/verification/admin/pending
//
// SUPER ADMIN ONLY.
//
// Other administrators are explicitly denied.
// ============================================================

exports.getPendingVerificationRequests =
  async (req, res) => {
    try {
      const superAdmin =
        await requireSuperAdmin(
          req,
          res
        );

      if (!superAdmin) {
        return;
      }

      const page = Math.max(
        Number(req.query.page) || 1,
        1
      );

      const limit = Math.min(
        Math.max(
          Number(req.query.limit) ||
            20,
          1
        ),
        100
      );

      const skip =
        (page - 1) * limit;

      const filter = {
        platformRole: "user",

        "verification.status":
          "pending",
      };

      const [
        requests,
        total,
      ] = await Promise.all([
        User.find(filter)
          .select(
            "displayName username firstName middleName lastName profilePhoto email phone platformRole accountStatus verification createdAt"
          )
          .sort({
            "verification.requestedAt":
              -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        User.countDocuments(
          filter
        ),
      ]);

      const safeRequests =
        requests.map(
          (user) => ({
            id: user._id,

            displayName:
              user.displayName ||
              `${user.firstName || ""} ${
                user.lastName || ""
              }`.trim(),

            username:
              user.username,

            profilePhoto:
              user.profilePhoto,

            platformRole:
              user.platformRole,

            accountStatus:
              user.accountStatus,

            verification: {
              status:
                user.verification
                  ?.status,

              verificationType:
                user.verification
                  ?.verificationType,

              requestedAt:
                user.verification
                  ?.requestedAt,

              requestReason:
                user.verification
                  ?.requestReason,
            },

            createdAt:
              user.createdAt,
          })
        );

      return res.status(200).json({
        success: true,

        requests:
          safeRequests,

        pagination: {
          page,
          limit,
          total,

          totalPages:
            Math.ceil(
              total / limit
            ),
        },

        reviewer: {
          id:
            superAdmin._id,

          displayName:
            "POLISYNC AFRICA",

          username:
            "polisync.africa",

          platformRole:
            "super_admin",
        },
      });
    } catch (error) {
      console.error(
        "Get pending verification requests error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to retrieve verification requests.",
      });
    }
  };

// ============================================================
// APPROVE VERIFICATION
// ============================================================
// PATCH /api/verification/admin/:userId/approve
//
// SUPER ADMIN ONLY.
// ============================================================

exports.approveVerification =
  async (req, res) => {
    try {
      const superAdmin =
        await requireSuperAdmin(
          req,
          res
        );

      if (!superAdmin) {
        return;
      }

      const targetUserId =
        req.params.userId;

      if (
        !isValidObjectId(
          targetUserId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user ID.",
        });
      }

      const user =
        await User.findById(
          targetUserId
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User account not found.",
        });
      }

      if (
        user.platformRole ===
        SUPER_ADMIN_ROLE
      ) {
        return res.status(400).json({
          success: false,
          message:
            "POLISYNC AFRICA is already verified.",
        });
      }

      if (
        user.verification.status !==
        "pending"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "This account does not have a pending verification request.",
        });
      }

      // --------------------------------------------------------
      // APPROVE
      // --------------------------------------------------------

      user.verification.isVerified =
        true;

      user.verification.status =
        "approved";

      user.verification.reviewedAt =
        new Date();

      user.verification.reviewedBy =
        superAdmin._id;

      user.verification.rejectionReason =
        null;

      user.verification.revocationReason =
        null;

      user.verification.badgeAsset =
        VERIFIED_BADGE;

      await user.save();

      return res.status(200).json({
        success: true,

        message:
          "Verification approved successfully.",

        user: {
          id: user._id,

          displayName:
            user.displayName ||
            `${user.firstName} ${
              user.lastName
            }`.trim(),

          username:
            user.username,

          verified: true,

          verificationStatus:
            "approved",

          verificationType:
            user.verification
              .verificationType,

          verificationBadge:
            VERIFIED_BADGE,
        },

        reviewedBy: {
          displayName:
            "POLISYNC AFRICA",

          username:
            "polisync.africa",
        },
      });
    } catch (error) {
      console.error(
        "Approve verification error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to approve verification.",
      });
    }
  };

// ============================================================
// REJECT VERIFICATION
// ============================================================
// PATCH /api/verification/admin/:userId/reject
//
// SUPER ADMIN ONLY.
// ============================================================

exports.rejectVerification =
  async (req, res) => {
    try {
      const superAdmin =
        await requireSuperAdmin(
          req,
          res
        );

      if (!superAdmin) {
        return;
      }

      const targetUserId =
        req.params.userId;

      if (
        !isValidObjectId(
          targetUserId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user ID.",
        });
      }

      const user =
        await User.findById(
          targetUserId
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User account not found.",
        });
      }

      if (
        user.platformRole ===
        SUPER_ADMIN_ROLE
      ) {
        return res.status(400).json({
          success: false,
          message:
            "The POLISYNC AFRICA platform account cannot be rejected.",
        });
      }

      if (
        user.verification.status !==
        "pending"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "This account does not have a pending verification request.",
        });
      }

      const {
        rejectionReason,
      } = req.body;

      if (
        !rejectionReason ||
        !rejectionReason.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A rejection reason is required.",
        });
      }

      if (
        rejectionReason.length >
        2000
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Rejection reason cannot exceed 2000 characters.",
        });
      }

      // --------------------------------------------------------
      // REJECT
      // --------------------------------------------------------

      user.verification.isVerified =
        false;

      user.verification.status =
        "rejected";

      user.verification.reviewedAt =
        new Date();

      user.verification.reviewedBy =
        superAdmin._id;

      user.verification.rejectionReason =
        rejectionReason.trim();

      user.verification.badgeAsset =
        VERIFIED_BADGE;

      await user.save();

      return res.status(200).json({
        success: true,

        message:
          "Verification request rejected.",

        user: {
          id: user._id,

          displayName:
            user.displayName ||
            `${user.firstName} ${
              user.lastName
            }`.trim(),

          username:
            user.username,

          verified: false,

          verificationStatus:
            "rejected",
        },

        reviewedBy: {
          displayName:
            "POLISYNC AFRICA",

          username:
            "polisync.africa",
        },
      });
    } catch (error) {
      console.error(
        "Reject verification error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to reject verification.",
      });
    }
  };

// ============================================================
// REVOKE VERIFICATION
// ============================================================
// PATCH /api/verification/admin/:userId/revoke
//
// SUPER ADMIN ONLY.
//
// This removes an existing verified badge.
// ============================================================

exports.revokeVerification =
  async (req, res) => {
    try {
      const superAdmin =
        await requireSuperAdmin(
          req,
          res
        );

      if (!superAdmin) {
        return;
      }

      const targetUserId =
        req.params.userId;

      if (
        !isValidObjectId(
          targetUserId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user ID.",
        });
      }

      const user =
        await User.findById(
          targetUserId
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User account not found.",
        });
      }

      if (
        user.platformRole ===
        SUPER_ADMIN_ROLE
      ) {
        return res.status(403).json({
          success: false,
          message:
            "The POLISYNC AFRICA platform verification cannot be revoked through this endpoint.",
        });
      }

      if (
        !user.verification.isVerified
      ) {
        return res.status(409).json({
          success: false,
          message:
            "This account is not currently verified.",
        });
      }

      const {
        revocationReason,
      } = req.body;

      if (
        !revocationReason ||
        !revocationReason.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A revocation reason is required.",
        });
      }

      if (
        revocationReason.length >
        2000
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Revocation reason cannot exceed 2000 characters.",
        });
      }

      // --------------------------------------------------------
      // REVOKE
      // --------------------------------------------------------

      user.verification.isVerified =
        false;

      user.verification.status =
        "revoked";

      user.verification.reviewedAt =
        new Date();

      user.verification.reviewedBy =
        superAdmin._id;

      user.verification.revocationReason =
        revocationReason.trim();

      user.verification.badgeAsset =
        VERIFIED_BADGE;

      await user.save();

      return res.status(200).json({
        success: true,

        message:
          "Verification has been revoked.",

        user: {
          id: user._id,

          displayName:
            user.displayName ||
            `${user.firstName} ${
              user.lastName
            }`.trim(),

          username:
            user.username,

          verified: false,

          verificationStatus:
            "revoked",
        },

        reviewedBy: {
          displayName:
            "POLISYNC AFRICA",

          username:
            "polisync.africa",
        },
      });
    } catch (error) {
      console.error(
        "Revoke verification error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to revoke verification.",
      });
    }
  };

// ============================================================
// GET VERIFICATION REQUEST
// ============================================================
// GET /api/verification/admin/:userId
//
// SUPER ADMIN ONLY.
//
// Allows the Super Admin to inspect an individual request.
// ============================================================

exports.getVerificationRequest =
  async (req, res) => {
    try {
      const superAdmin =
        await requireSuperAdmin(
          req,
          res
        );

      if (!superAdmin) {
        return;
      }

      const targetUserId =
        req.params.userId;

      if (
        !isValidObjectId(
          targetUserId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user ID.",
        });
      }

      const user =
        await User.findById(
          targetUserId
        )
          .select(
            "displayName username firstName middleName lastName profilePhoto email phone nationality identificationType identificationNumber accountStatus platformRole verification createdAt"
          )
          .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User account not found.",
        });
      }

      return res.status(200).json({
        success: true,

        request: {
          id:
            user._id,

          displayName:
            user.displayName ||
            `${user.firstName || ""} ${
              user.lastName || ""
            }`.trim(),

          username:
            user.username,

          profilePhoto:
            user.profilePhoto,

          email:
            user.email,

          phone:
            user.phone,

          nationality:
            user.nationality,

          identificationType:
            user.identificationType,

          identificationNumber:
            user.identificationNumber,

          accountStatus:
            user.accountStatus,

          platformRole:
            user.platformRole,

          verification:
            user.verification,
        },

        reviewer: {
          id:
            superAdmin._id,

          displayName:
            "POLISYNC AFRICA",

          username:
            "polisync.africa",

          platformRole:
            "super_admin",
        },
      });
    } catch (error) {
      console.error(
        "Get verification request error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to retrieve verification request.",
      });
    }
  };
