const express = require("express");
const { authenticate } = require("../auth/middleware");
const { getPrivacy, updatePrivacy } = require("../controllers/privacyController");

const router = express.Router();
router.get("/", authenticate, getPrivacy);
router.patch("/", authenticate, updatePrivacy);
module.exports = router;
