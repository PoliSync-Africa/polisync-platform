const express = require("express");
const {
  authenticate,
  requireSuperAdmin,
} = require("../auth/middleware");
const {
  listPlatformUsers,
  updatePlatformUser,
} = require("../controllers/platformUserController");

const router = express.Router();

router.use(authenticate, requireSuperAdmin);

router.get("/", listPlatformUsers);
router.patch("/:id", updatePlatformUser);

module.exports = router;
