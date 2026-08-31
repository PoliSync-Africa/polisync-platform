const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const { list, create } = require("../controllers/auditLogController");

const router = express.Router();
router.use(protect, authorize("super_admin"));
router.get("/", list);
router.post("/", create);
module.exports = router;
