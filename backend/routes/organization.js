const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const { createOrganizationRequest, getAllOrganizations, getCandidates, getPendingOrganizations, approveOrganization, rejectOrganization, updateOrganizationLogo } = require("../controllers/organizationController");

const router = express.Router();
router.post("/", protect, createOrganizationRequest);
router.get("/admin/all", protect, authorize("super_admin"), getAllOrganizations);
router.get("/admin/candidates", protect, authorize("super_admin"), getCandidates);
router.get("/admin/pending", protect, authorize("super_admin"), getPendingOrganizations);
router.patch("/admin/:organizationId/logo", protect, authorize("super_admin"), updateOrganizationLogo);
router.patch("/admin/:organizationId/approve", protect, authorize("super_admin"), approveOrganization);
router.patch("/admin/:organizationId/reject", protect, authorize("super_admin"), rejectOrganization);

module.exports = router;
