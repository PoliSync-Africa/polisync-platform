const express = require("express");
const router = express.Router();

const organizationController = require("../controllers/organizationController");
const { protect } = require("../middleware/auth");

// Create organization
router.post("/", protect, organizationController.createOrganization);

// Get all organizations
router.get("/", protect, organizationController.getOrganizations);

// Get organization by ID
router.get("/:id", protect, organizationController.getOrganizationById);

// Update organization
router.put("/:id", protect, organizationController.updateOrganization);

module.exports = router;
