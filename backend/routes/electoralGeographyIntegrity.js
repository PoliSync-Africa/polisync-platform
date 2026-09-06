const express = require("express");
const { authenticate, requireSuperAdmin } = require("../auth/middleware");
const controller = require("../controllers/electoralGeographyIntegrityController");

const router = express.Router();

router.get("/", authenticate, requireSuperAdmin, controller.report);

module.exports = router;
