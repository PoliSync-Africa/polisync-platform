const express = require("express");

const {
  viewProfile,
  getProfileViewers,
  clearProfileViewHistory,
  updateProfileViewPrivacy,
} = require("../controllers/profileController");

const router = express.Router();

// ============================================================
// VIEW ANOTHER USER'S PROFILE
// ============================================================

router.get(
  "/:userId",
  viewProfile
);

// ============================================================
// WHO VIEWED MY PROFILE
// ============================================================

router.get(
  "/me/viewers",
  getProfileViewers
);

// ============================================================
// CLEAR MY PROFILE VIEW HISTORY
// ============================================================

router.delete(
  "/me/viewers",
  clearProfileViewHistory
);

// ============================================================
// PROFILE VIEW PRIVACY
// ============================================================

router.patch(
  "/me/privacy/profile-views",
  updateProfileViewPrivacy
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;
