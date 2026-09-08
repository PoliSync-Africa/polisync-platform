const express = require("express");
const multer = require("multer");
const { authenticate } = require("../auth/middleware");
const controller = require("../controllers/sharedNotesController");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 3, fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /^(image\/(jpeg|png|gif|webp|heic|heif)|video\/(mp4|quicktime|webm)|audio\/(mpeg|wav|mp4|x-m4a|aac)|application\/pdf|text\/.+|application\/(msword|vnd\.openxmlformats-officedocument\..+))$/i;
    if (allowed.test(file.mimetype)) return cb(null, true);
    return cb(new Error("Unsupported attachment type."));
  },
});

router.use(authenticate);
router.get("/", controller.list);
router.get("/:id/attachments/:attachmentId", controller.attachment);
router.post("/", upload.array("attachments", 3), controller.create);
router.patch("/:id", upload.array("attachments", 3), controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
