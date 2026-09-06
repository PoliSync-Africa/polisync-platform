const express = require("express");
const { authenticate, requireSuperAdmin } = require("../auth/middleware");
const controller = require("../controllers/electoralGeographyIntegrityController");
const regionalController = require("../controllers/electoralGeographyRegionHealthController");

const router = express.Router();

router.get("/", authenticate, requireSuperAdmin, controller.report);
router.get("/regions", authenticate, requireSuperAdmin, regionalController.report);
router.post("/sync", authenticate, requireSuperAdmin, controller.sync);

module.exports = router;
