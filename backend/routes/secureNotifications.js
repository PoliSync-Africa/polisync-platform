const express = require("express");
const mongoose = require("mongoose");
const { authenticate } = require("../auth/middleware");
const Notification = require("../models/Notification");

const router = express.Router();
router.use(authenticate);
const me = (req) => req.auth.userId;
const valid = (id) => mongoose.Types.ObjectId.isValid(id);

const populate = (query) => query
  .populate("recipient", "username displayName firstName lastName profilePhoto")
  .populate("createdBy", "username displayName firstName lastName profilePhoto")
  .populate("event", "title startAt endAt eventType location");

router.get("/", async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const filter = { recipient: me(req) };
    if (req.query.read !== undefined) filter.read = req.query.read === "true";
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.channel) filter.channel = req.query.channel;
    const [notifications, total] = await Promise.all([
      populate(Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)),
      Notification.countDocuments(filter),
    ]);
    return res.json({ success: true, count: notifications.length, total, page, pages: Math.ceil(total / limit), notifications });
  } catch (error) { return res.status(500).json({ success: false, message: "Failed to retrieve notifications." }); }
});

router.get("/count", async (req, res) => {
  try { return res.json({ success: true, count: await Notification.countDocuments({ recipient: me(req), read: false }) }); }
  catch (error) { return res.status(500).json({ success: false, message: "Failed to retrieve notification count." }); }
});

router.get("/unread", async (req, res) => {
  try {
    const notifications = await populate(Notification.find({ recipient: me(req), read: false }).sort({ createdAt: -1 }).limit(100));
    return res.json({ success: true, count: notifications.length, notifications });
  } catch (error) { return res.status(500).json({ success: false, message: "Failed to retrieve unread notifications." }); }
});

router.patch("/:id/read", async (req, res) => {
  try {
    if (!valid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid notification ID." });
    const notification = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: me(req) }, { $set: { read: true, readAt: new Date() } }, { new: true });
    if (!notification) return res.status(404).json({ success: false, message: "Notification not found." });
    return res.json({ success: true, notification });
  } catch (error) { return res.status(500).json({ success: false, message: "Failed to update notification." }); }
});

router.patch("/read-all", async (req, res) => {
  try {
    const result = await Notification.updateMany({ recipient: me(req), read: false }, { $set: { read: true, readAt: new Date() } });
    return res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) { return res.status(500).json({ success: false, message: "Failed to update notifications." }); }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!valid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid notification ID." });
    const result = await Notification.deleteOne({ _id: req.params.id, recipient: me(req) });
    if (!result.deletedCount) return res.status(404).json({ success: false, message: "Notification not found." });
    return res.json({ success: true, message: "Notification deleted." });
  } catch (error) { return res.status(500).json({ success: false, message: "Failed to delete notification." }); }
});

module.exports = router;
