const express = require("express");
const { authenticate } = require("../auth/middleware");
const { updateProfilePhoto } = require("../controllers/profilePhotoController");

const router = express.Router();

router.patch("/photo", authenticate, updateProfilePhoto);

module.exports = router;
