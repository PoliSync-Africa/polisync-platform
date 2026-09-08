const express = require("express");
const { authenticate } = require("../auth/middleware");
const controller = require("../controllers/personalOperationsController");

const router = express.Router();
router.use(authenticate);
router.get("/summary", controller.summary);
router.get("/campaigns", controller.campaigns);
router.post("/campaigns", controller.createCampaign);
router.patch("/campaigns/:id", controller.updateCampaign);
router.delete("/campaigns/:id", controller.deleteCampaign);
router.get("/events", controller.events);
router.post("/events", controller.createEvent);
router.patch("/events/:id", controller.updateEvent);
router.delete("/events/:id", controller.deleteEvent);
router.get("/field-tasks", controller.tasks);
router.post("/field-tasks", controller.createTask);
router.patch("/field-tasks/:id", controller.updateTask);

module.exports = router;
