const express = require("express");

const {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization
} = require("../controllers/organizationController");

const {
  protect,
  authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

// Platform health
router.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Organization routes ready"
  });
});

// List organizations
router.get(
  "/all",
  protect,
  getOrganizations
);

// Get one organization
router.get(
  "/:id",
  protect,
  getOrganizationById
);

// Create organization
// Only Super Admin can create an organization
router.post(
  "/create",
  protect,
  authorize("super_admin"),
  createOrganization
);

// Update organization
// Super Admin can update any organization.
// Party Admin can update only their own organization.
router.patch(
  "/:id",
  protect,
  authorize("super_admin", "party_admin"),
  updateOrganization
);

module.exports = router;
