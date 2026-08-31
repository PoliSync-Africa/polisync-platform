const express = require("express");
const { authenticate } = require("../auth/middleware");
const { updateProfilePhoto } = require("../controllers/profilePhotoController");
const profileController = require("../controllers/profileController");

const router = express.Router();

router.patch("/photo", authenticate, updateProfilePhoto);
router.get("/:userId", authenticate, profileController.viewProfile);
router.get("/me/viewers", authenticate, profileController.getProfileViewers);

module.exports = router;
