const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const {
  createOrganizationRequest,
  getAllOrganizations,
  getCandidates,
  getPendingOrganizations,
  approveOrganization,
  rejectOrganization,
} = require("../controllers/organizationController");

const router = express.Router();

// Personal account -> organization request. Organization is NOT active until Super Admin approval.
router.post("/", protect, createOrganizationRequest);

// Super Admin platform-management data.
router.get("/admin/all", protect, authorize("super_admin"), getAllOrganizations);
router.get("/admin/candidates", protect, authorize("super_admin"), getCandidates);
router.get("/admin/pending", protect, authorize("super_admin"), getPendingOrganizations);
router.patch("/admin/:organizationId/approve", protect, authorize("super_admin"), approveOrganization);
router.patch("/admin/:organizationId/reject", protect, authorize("super_admin"), rejectOrganization);

module.exports = router;
