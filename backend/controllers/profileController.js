const mongoose = require("mongoose");

const User = require("../models/User");
const ProfileView = require("../models/ProfileView");

// ============================================================
// HELPERS
// ============================================================

const getAuthenticatedUserId = (req) => {
  return req.user?.id || req.user?._id || req.auth?.id || null;
};

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const getViewerOrganizationMembership = async () => {
  // Organization authorization belongs to the organization
  // membership system.
  //
  // This function intentionally returns false until the
  // OrganizationMembership authorization service is connected.
  //
  // It prevents this controller from incorrectly assuming that
  // two users belong to the same organization.
  return false;
};

const getDeviceType = (req) => {
  const userAgent = req.headers["user-agent"] || "";

  if (/tablet|ipad/i.test(userAgent)) {
    return "tablet";
  }

  if (/mobile|iphone|android.*mobile/i.test(userAgent)) {
    return "mobile";
  }

  if (userAgent) {
    return "desktop";
  }

  return "unknown";
};

// ============================================================
// VIEW PROFILE
// ============================================================
// GET /api/profile/:userId
//
// This endpoint:
// 1. Finds the requested profile.
// 2. Checks profile visibility.
// 3. Determines viewer permissions.
// 4. Records the profile view.
// 5. Returns a safe public profile.
//
// Private fields are NEVER returned.
// ============================================================

exports.viewProfile = async (req, res) => {
  try {
    const profileUserId = req.params.userId;

    const viewerId = getAuthenticatedUserId(req);

    // ----------------------------------------------------------
    // VALIDATE PROFILE ID
    // ----------------------------------------------------------

    if (!profileUserId || !isValidObjectId(profileUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid profile user ID.",
      });
    }

    // ----------------------------------------------------------
    // FIND PROFILE
    // ----------------------------------------------------------

    const profileUser = await User.findById(profileUserId);

    if (!profileUser) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    // ----------------------------------------------------------
    // DETERMINE VIEWER
    // ----------------------------------------------------------

    let viewer = null;

    if (viewerId && isValidObjectId(viewerId)) {
      viewer = await User.findById(viewerId);
    }

    // ----------------------------------------------------------
    // SELF PROFILE
    // ----------------------------------------------------------

    const isOwnProfile =
      viewer && viewer._id.toString() === profileUser._id.toString();

    // ----------------------------------------------------------
    // ORGANIZATION MEMBERSHIP
    // ----------------------------------------------------------

    const viewerIsOrganizationMember = viewer
      ? await getViewerOrganizationMembership({
          viewer,
          profileUser,
        })
      : false;

    // ----------------------------------------------------------
    // PROFILE VISIBILITY
    // ----------------------------------------------------------

    const profileVisibility = profileUser.privacy.profileVisibility;

    if (!isOwnProfile) {
      if (profileVisibility === "nobody") {
        return res.status(403).json({
          success: false,
          message: "This profile is private.",
        });
      }

      if (
        profileVisibility === "organizations_only" &&
        !viewerIsOrganizationMember
      ) {
        return res.status(403).json({
          success: false,
          message: "This profile is only visible to organization members.",
        });
      }
    }

    // ----------------------------------------------------------
    // RECORD PROFILE VIEW
    // ----------------------------------------------------------
    // Do not record:
    // - own profile
    // - unauthenticated visitors
    //
    // The platform can later support public visitor analytics
    // separately without exposing identities.
    // ----------------------------------------------------------

    if (viewer && !isOwnProfile) {
      const canAppear = viewer.canAppearInProfileViews({
        viewerIsOrganizationMember,
      });

      if (canAppear) {
        // ------------------------------------------------------
        // DUPLICATE VIEW PROTECTION
        // ------------------------------------------------------
        // Avoid creating excessive records when a user repeatedly
        // refreshes a profile within a short period.
        // ------------------------------------------------------

        const duplicateWindow = new Date(Date.now() - 5 * 60 * 1000);

        const recentView = await ProfileView.findOne({
          profileOwner: profileUser._id,

          viewer: viewer._id,

          viewedAt: {
            $gte: duplicateWindow,
          },
        });

        if (!recentView) {
          await ProfileView.create({
            profileOwner: profileUser._id,

            viewer: viewer._id,

            viewedAt: new Date(),

            viewerPlatformRole: viewer.platformRole,

            viewerIsOrganizationMember,

            viewerVisible: true,

            deviceType: getDeviceType(req),

            source: req.query.source || "direct",
          });
        }
      }
    }

    // ----------------------------------------------------------
    // RETURN SAFE PUBLIC PROFILE
    // ----------------------------------------------------------

    const publicProfile = profileUser.toPublicProfile({
      viewerId,
      viewerIsOrganizationMember,
    });

    return res.status(200).json({
      success: true,
      user: publicProfile,
    });
  } catch (error) {
    console.error("View profile error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to load profile.",
    });
  }
};

// ============================================================
// WHO VIEWED MY PROFILE
// ============================================================
// GET /api/profile/me/viewers
//
// Returns the people who are permitted to appear in the user's
// profile-view history.
//
// The authenticated user can only see THEIR OWN history.
// ============================================================

exports.getProfileViewers = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId || !isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const owner = await User.findById(userId);

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Profile owner not found.",
      });
    }

    // ----------------------------------------------------------
    // CHECK OWNER PRIVACY SETTING
    // ----------------------------------------------------------

    if (!owner.privacy.showProfileViewers) {
      return res.status(403).json({
        success: false,
        message: "Profile viewer history is disabled in your privacy settings.",
      });
    }

    // ----------------------------------------------------------
    // PAGINATION
    // ----------------------------------------------------------

    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

    const skip = (page - 1) * limit;

    // ----------------------------------------------------------
    // FIND VIEWERS
    // ----------------------------------------------------------

    const [views, total] = await Promise.all([
      ProfileView.find({
        profileOwner: owner._id,

        viewerVisible: true,
      })
        .sort({
          viewedAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "viewer",
          select:
            "displayName username firstName lastName profilePhoto platformRole verification",
        })
        .lean(),

      ProfileView.countDocuments({
        profileOwner: owner._id,

        viewerVisible: true,
      }),
    ]);

    // ----------------------------------------------------------
    // FILTER VIEWERS
    // ----------------------------------------------------------

    const results = [];

    for (const view of views) {
      if (!view.viewer) {
        continue;
      }

      const viewer = view.viewer;

      const verification = viewer.verification;

      const isVerified =
        viewer.platformRole === "super_admin" ||
        Boolean(verification && verification.isVerified);

      let displayName;

      let username;

      if (viewer.platformRole === "super_admin") {
        displayName = "POLISYNC AFRICA";

        username = "polisync.africa";
      } else {
        displayName =
          viewer.displayName ||
          `${viewer.firstName || ""} ${viewer.lastName || ""}`.trim();

        username = viewer.username;
      }

      results.push({
        id: view._id,

        viewedAt: view.viewedAt,

        viewer: {
          id: viewer._id,

          displayName,

          username,

          profilePhoto: viewer.profilePhoto || null,

          platformRole: viewer.platformRole,

          isPlatformAccount: viewer.platformRole === "super_admin",

          verified: isVerified,

          verificationBadge: isVerified ? "/verified-badge.png" : null,
        },

        source: view.source,

        organizationId: view.organizationId || null,
      });
    }

    return res.status(200).json({
      success: true,

      viewers: results,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get profile viewers error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to load profile viewers.",
    });
  }
};

// ============================================================
// CLEAR PROFILE VIEW HISTORY
// ============================================================
// DELETE /api/profile/me/viewers
//
// Allows a user to clear their own profile-view history.
// ============================================================

exports.clearProfileViewHistory = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId || !isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    await ProfileView.deleteMany({
      profileOwner: userId,
    });

    return res.status(200).json({
      success: true,
      message: "Profile view history cleared.",
    });
  } catch (error) {
    console.error("Clear profile view history error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to clear profile view history.",
    });
  }
};

// ============================================================
// UPDATE PROFILE VIEW PRIVACY
// ============================================================
// PATCH /api/profile/me/privacy/profile-views
//
// Allows the authenticated user to control:
//
// showProfileViewers
// profileViewPrivacy
// ============================================================

exports.updateProfileViewPrivacy = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId || !isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const { showProfileViewers, profileViewPrivacy } = req.body;

    const allowedPrivacyValues = ["everyone", "organizations_only", "nobody"];

    if (typeof showProfileViewers !== "undefined") {
      if (typeof showProfileViewers !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "showProfileViewers must be true or false.",
        });
      }
    }

    if (typeof profileViewPrivacy !== "undefined") {
      if (!allowedPrivacyValues.includes(profileViewPrivacy)) {
        return res.status(400).json({
          success: false,
          message: "Invalid profile-view privacy setting.",
        });
      }
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (typeof showProfileViewers !== "undefined") {
      user.privacy.showProfileViewers = showProfileViewers;
    }

    if (typeof profileViewPrivacy !== "undefined") {
      user.privacy.profileViewPrivacy = profileViewPrivacy;
    }

    await user.save();

    return res.status(200).json({
      success: true,

      message: "Profile-view privacy settings updated.",

      privacy: {
        showProfileViewers: user.privacy.showProfileViewers,

        profileViewPrivacy: user.privacy.profileViewPrivacy,
      },
    });
  } catch (error) {
    console.error("Update profile-view privacy error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to update profile-view privacy.",
    });
  }
};
