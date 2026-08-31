const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const { list, create, publish, archive } = require("../controllers/announcementController");

const router = express.Router();
router.use(protect);
router.get("/", list);
router.post("/", authorize("super_admin"), create);
router.patch("/:id/publish", authorize("super_admin"), publish);
router.patch("/:id/archive", authorize("super_admin"), archive);
module.exports = router;
