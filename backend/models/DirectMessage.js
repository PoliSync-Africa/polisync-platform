const mongoose = require("mongoose");

const directMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  body: { type: String, required: true, trim: true, maxlength: 10000 },
  read: { type: Boolean, default: false, index: true },
  readAt: { type: Date, default: null },
  deletedBySender: { type: Boolean, default: false },
  deletedByRecipient: { type: Boolean, default: false },
}, { timestamps: true });

directMessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
directMessageSchema.index({ recipient: 1, sender: 1, createdAt: -1 });

module.exports = mongoose.models.DirectMessage || mongoose.model("DirectMessage", directMessageSchema);
