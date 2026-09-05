const express = require("express");
const router = express.Router();

const electionController = require("../controllers/electionController");
const { protect, authorize } = require("../middleware/auth");

// Public list
router.get("/", electionController.getElections);

// Super Admin only
router.post(
  "/create",
  protect,
  authorize("super_admin"),
  electionController.createElection
);

module.exports = router;
