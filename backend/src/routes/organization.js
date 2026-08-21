const express = require("express");
const router = express.Router(); 

const organizationController = require("../controllers/organizationController");
const { protect } = require("../middleware/auth");

// Create organization
router.post("/", protect, organizationController.createOrganization);

// Get current organization
router.get("/", protect, organizationController.getOrganization);

// Update organization
router.put("/", protect, organizationController.updateOrganization);

// Organization dashboard
router.get("/dashboard", protect, organizationController.dashboard);

module.exports = router;
