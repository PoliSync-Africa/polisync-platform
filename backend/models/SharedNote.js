const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 180 },
  contentType: { type: String, required: true, trim: true, maxlength: 120 },
  size: { type: Number, required: true, min: 0 },
  data: { type: Buffer, required: true },
}, { _id: true });

const sharedNoteSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 180 },
  header: { type: String, trim: true, maxlength: 300, default: "" },
  body: { type: String, trim: true, maxlength: 10000, default: "" },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  authorName: { type: String, trim: true, maxlength: 180, default: "PoliSync User" },
  attachments: { type: [attachmentSchema], default: [] },
}, { timestamps: true, collection: "shared_notes" });

sharedNoteSchema.index({ createdAt: -1 });
sharedNoteSchema.index({ name: "text", header: "text", body: "text" });

module.exports = mongoose.models.SharedNote || mongoose.model("SharedNote", sharedNoteSchema);
