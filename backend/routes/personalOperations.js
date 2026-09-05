const express = require("express");
const { authenticate } = require("../auth/middleware");
const controller = require("../controllers/personalOperationsController");

const router = express.Router();
router.use(authenticate);
router.get("/summary", controller.summary);
router.get("/campaigns", controller.campaigns);
router.post("/campaigns", controller.createCampaign);
router.get("/field-tasks", controller.tasks);
router.post("/field-tasks", controller.createTask);
router.patch("/field-tasks/:id", controller.updateTask);

module.exports = router;
