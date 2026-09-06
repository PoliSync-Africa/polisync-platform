const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
  originalName: { type: String, required: true, trim: true, maxlength: 255 },
  mimeType: { type: String, required: true, trim: true, maxlength: 120 },
  size: { type: Number, required: true, min: 1, max: 10 * 1024 * 1024 },
  data: { type: Buffer, required: true, select: false },
}, { _id: true });

const directMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  body: { type: String, required: false, trim: true, maxlength: 10000, default: "" },
  attachments: { type: [attachmentSchema], default: [] },
  forwardedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "DirectMessage", default: null, index: true },
  forwardedOriginalCreatedAt: { type: Date, default: null },
  read: { type: Boolean, default: false, index: true },
  readAt: { type: Date, default: null },
  deletedBySender: { type: Boolean, default: false },
  deletedByRecipient: { type: Boolean, default: false },
}, { timestamps: true });

directMessageSchema.path("attachments").validate((value) => value.length <= 5, "A message can contain at most 5 attachments.");
directMessageSchema.path("attachments").validate((value) => value.length > 0 || Boolean(String(this.body || "").trim()), "A message must contain text or an attachment.");

directMessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
directMessageSchema.index({ recipient: 1, sender: 1, createdAt: -1 });
directMessageSchema.index({ forwardedFrom: 1, createdAt: -1 });

module.exports = mongoose.models.DirectMessage || mongoose.model("DirectMessage", directMessageSchema);
