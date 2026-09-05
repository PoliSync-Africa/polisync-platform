const express = require("express");

const {
  createUnit,
  getChildren,
  assignManager,
  getHierarchy
} = require("../controllers/organizationUnitController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Status
router.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Organization Unit routes ready"
  });
});

// Get full hierarchy for an organization
router.get(
  "/organization/:organizationId",
  protect,
  getHierarchy
);

// Get child units
router.get(
  "/children/:parentId",
  protect,
  getChildren
);

// Create new unit
router.post(
  "/create",
  protect,
  authorize("super_admin", "country_admin", "regional_admin"),
  createUnit
);

// Assign manager
router.patch(
  "/:id/manager",
  protect,
  authorize("super_admin", "country_admin"),
  assignManager
);

module.exports = router;
