const express = require("express");
const { protect } = require("../middleware/auth");
const controller = require("../controllers/personalWorkspaceController");

const router = express.Router();

router.get("/definitions", protect, controller.definitions);
router.get("/profile", protect, controller.getProfile);
router.put("/profile", protect, controller.upsertProfile);
router.get("/resources", protect, controller.resources);
router.get("/resource-catalog", protect, controller.resourceCatalog);

module.exports = router;
