const express = require("express");
const mongoose = require("mongoose");
const { authenticate } = require("../auth/middleware");
const User = require("../models/User");
const DirectMessage = require("../models/DirectMessage");
const Notification = require("../models/Notification");
const { canMessage } = require("../controllers/privacyController");

const router = express.Router();
router.use(authenticate);
const me = (req) => req.auth.userId;
const valid = (id) => mongoose.Types.ObjectId.isValid(id);
const safeUser = (u) => ({ id: u._id, username: u.username, displayName: u.displayName || [u.firstName, u.lastName].filter(Boolean).join(" "), profilePhoto: u.profilePhoto || null });

router.get("/users", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (q.length < 2) return res.json({ success: true, users: [] });
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const users = await User.find({ _id: { $ne: me(req) }, accountStatus: "approved", $or: [{ username: rx }, { displayName: rx }, { firstName: rx }, { lastName: rx }] }).select("username displayName firstName lastName profilePhoto privacy.messagePrivacy").limit(20).lean();
    return res.json({ success: true, users: users.map((u) => ({ ...safeUser(u), messagePrivacy: u.privacy?.messagePrivacy || "nobody" })) });
  } catch (error) { return res.status(500).json({ success: false, message: "Unable to search users." }); }
});

router.get("/inbox", async (req, res) => {
  try {
    const userId = me(req);
    const messages = await DirectMessage.find({ recipient: userId, deletedByRecipient: false }).sort({ createdAt: -1 }).limit(100).populate("sender", "username displayName firstName lastName profilePhoto").lean();
    const sent = await DirectMessage.find({ sender: userId, deletedBySender: false }).sort({ createdAt: -1 }).limit(100).populate("recipient", "username displayName firstName lastName profilePhoto").lean();
    return res.json({ success: true, messages, sent });
  } catch (error) { return res.status(500).json({ success: false, message: "Unable to load messages." }); }
});

router.get("/conversation/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!valid(userId)) return res.status(400).json({ success: false, message: "Invalid user ID." });
    const owner = await User.findById(me(req));
    const other = await User.findById(userId);
    if (!other) return res.status(404).json({ success: false, message: "User not found." });
    const allowed = await canMessage(owner, other);
    if (!allowed && owner._id.toString() !== other._id.toString()) return res.status(403).json({ success: false, message: "This conversation is not available under the recipient's privacy settings." });
    const messages = await DirectMessage.find({ $or: [{ sender: owner._id, recipient: other._id }, { sender: other._id, recipient: owner._id }], deletedBySender: false, deletedByRecipient: false }).sort({ createdAt: 1 }).limit(500).lean();
    await DirectMessage.updateMany({ sender: other._id, recipient: owner._id, read: false }, { $set: { read: true, readAt: new Date() } });
    return res.json({ success: true, user: safeUser(other), messages });
  } catch (error) { return res.status(500).json({ success: false, message: "Unable to load conversation." }); }
});

router.post("/", async (req, res) => {
  try {
    const sender = await User.findById(me(req));
    const recipientId = req.body?.recipientId;
    const body = String(req.body?.body || "").trim();
    if (!valid(recipientId) || !body) return res.status(400).json({ success: false, message: "Recipient and message are required." });
    if (sender._id.toString() === recipientId.toString()) return res.status(400).json({ success: false, message: "You cannot message yourself." });
    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ success: false, message: "Recipient not found." });
    if (!(await canMessage(sender, recipient))) return res.status(403).json({ success: false, code: "MESSAGE_NOT_ALLOWED", message: "This user does not accept messages from your account." });
    const message = await DirectMessage.create({ sender: sender._id, recipient: recipient._id, body });
    await Notification.create({ recipient: recipient._id, type: "message", channel: "in_app", title: `New message from ${sender.displayName || sender.username}`, message: body.slice(0, 300), status: "sent", metadata: { messageId: message._id.toString(), senderId: sender._id.toString() }, createdBy: sender._id });
    return res.status(201).json({ success: true, message });
  } catch (error) { console.error("SEND MESSAGE ERROR:", error); return res.status(400).json({ success: false, message: error.message || "Unable to send message." }); }
});

// Forward an existing message to one or more recipients. Each recipient is checked
// independently against the platform privacy rules and receives a separate message.
router.post("/forward", async (req, res) => {
  try {
    const sender = await User.findById(me(req));
    const messageId = req.body?.messageId;
    const recipientIds = Array.isArray(req.body?.recipientIds) ? req.body.recipientIds : [];
    if (!valid(messageId) || !recipientIds.length) return res.status(400).json({ success: false, message: "A message and at least one recipient are required." });

    const original = await DirectMessage.findById(messageId).lean();
    if (!original) return res.status(404).json({ success: false, message: "Original message not found." });
    if (String(original.sender) !== String(sender._id) && String(original.recipient) !== String(sender._id)) {
      return res.status(403).json({ success: false, message: "You can only forward messages available to your account." });
    }

    const uniqueIds = [...new Set(recipientIds.map(String))];
    const validIds = uniqueIds.filter(valid).filter((id) => id !== String(sender._id));
    if (!validIds.length) return res.status(400).json({ success: false, message: "Choose at least one valid recipient." });

    const recipients = await User.find({ _id: { $in: validIds }, accountStatus: "approved" }).lean();
    const sent = [];
    const rejected = [];
    for (const recipient of recipients) {
      try {
        if (!(await canMessage(sender, recipient))) {
          rejected.push({ id: String(recipient._id), displayName: recipient.displayName || [recipient.firstName, recipient.lastName].filter(Boolean).join(" ") || recipient.username, reason: "Recipient privacy settings do not allow this message." });
          continue;
        }
        const forwarded = await DirectMessage.create({
          sender: sender._id,
          recipient: recipient._id,
          body: String(original.body || "").slice(0, 10000),
          forwardedFrom: original._id,
          forwardedOriginalCreatedAt: original.createdAt || null,
        });
        await Notification.create({
          recipient: recipient._id,
          type: "message",
          channel: "in_app",
          title: `Forwarded message from ${sender.displayName || sender.username}`,
          message: String(original.body || "").slice(0, 300),
          status: "sent",
          metadata: { messageId: forwarded._id.toString(), forwardedFrom: original._id.toString(), senderId: sender._id.toString() },
          createdBy: sender._id,
        });
        sent.push(forwarded);
      } catch (error) {
        rejected.push({ id: String(recipient._id), displayName: recipient.displayName || recipient.username, reason: "Message could not be forwarded." });
      }
    }

    return res.status(sent.length ? 201 : 403).json({ success: sent.length > 0, forwardedCount: sent.length, rejected, messages: sent, message: sent.length ? `Message forwarded to ${sent.length} recipient${sent.length === 1 ? "" : "s"}.` : "The message could not be forwarded to the selected recipients." });
  } catch (error) {
    console.error("FORWARD MESSAGE ERROR:", error);
    return res.status(400).json({ success: false, message: error.message || "Unable to forward message." });
  }
});

router.patch("/:id/read", async (req, res) => {
  try {
    if (!valid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid message ID." });
    const message = await DirectMessage.findOneAndUpdate({ _id: req.params.id, recipient: me(req) }, { $set: { read: true, readAt: new Date() } }, { new: true });
    if (!message) return res.status(404).json({ success: false, message: "Message not found." });
    return res.json({ success: true, message });
  } catch (error) { return res.status(500).json({ success: false, message: "Unable to update message." }); }
});

module.exports = router;
