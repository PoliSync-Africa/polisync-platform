const express = require("express");
const { authenticate } = require("../auth/middleware");
const controller = require("../controllers/workspaceDeploymentController");

const router = express.Router();
router.use(authenticate);
router.get("/", controller.list);
router.get("/elections", controller.elections);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
