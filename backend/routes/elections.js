const express = require("express");
const router = express.Router();

const electionController = require("../controllers/electionController");
const { protect, authorize } = require("../middleware/auth");

// Public read access to election records.
router.get("/", electionController.getElections);
router.get("/live", electionController.getLiveElections);
router.get("/history", electionController.getElectionHistory);
router.get("/:id", electionController.getElection);

// Super Admin election lifecycle management.
router.post(
  "/create",
  protect,
  authorize("super_admin"),
  electionController.createElection
);
router.patch(
  "/:id",
  protect,
  authorize("super_admin"),
  electionController.updateElection
);
router.delete(
  "/:id",
  protect,
  authorize("super_admin"),
  electionController.deleteElection
);

module.exports = router;
