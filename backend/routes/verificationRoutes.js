const express = require("express");

const {
  requestVerification,
  getMyVerificationStatus,
  getPendingVerificationRequests,
  getVerificationRequest,
  approveVerification,
  rejectVerification,
  revokeVerification,
} = require("../controllers/verificationController");

const router = express.Router();

// ============================================================
// USER VERIFICATION
// ============================================================

// Submit a verification request
router.post(
  "/request",
  requestVerification
);

// Check my verification status
router.get(
  "/me",
  getMyVerificationStatus
);

// ============================================================
// SUPER ADMIN VERIFICATION MANAGEMENT
// ============================================================

// View pending verification requests
router.get(
  "/admin/pending",
  getPendingVerificationRequests
);

// View an individual verification request
router.get(
  "/admin/:userId",
  getVerificationRequest
);

// Approve verification
router.patch(
  "/admin/:userId/approve",
  approveVerification
);

// Reject verification
router.patch(
  "/admin/:userId/reject",
  rejectVerification
);

// Revoke existing verification
router.patch(
  "/admin/:userId/revoke",
  revokeVerification
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;
