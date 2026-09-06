const express = require("express");
const { authenticate, requireSuperAdmin } = require("../auth/middleware");
const controller = require("../controllers/electoralGeographyIntegrityController");

const router = express.Router();

router.get("/", authenticate, requireSuperAdmin, controller.report);
router.post("/sync", authenticate, requireSuperAdmin, controller.sync);

module.exports = router;
