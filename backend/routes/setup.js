const express = require("express");
const router = express.Router();

const { bootstrapSuperAdmin } = require("../controllers/setupController");

router.get("/bootstrap-super-admin", bootstrapSuperAdmin);

module.exports = router;
