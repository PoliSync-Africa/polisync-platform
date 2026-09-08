const mongoose = require("mongoose");
const SharedNote = require("../models/SharedNote");

const getUserId = (req) => req.user?._id || req.user?.id || req.auth?.id || null;
const getUserName = (req) => {
  const user = req.user || {};
  return String(user.displayName || user.name || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "PoliSync User").trim().slice(0, 180);
};

function cleanText(value, max) {
  return String(value || "").replace(/\r\n/g, "\n").trim().slice(0, max);
}

function publicNote(note) {
  return {
    _id: note._id,
    name: note.name,
    header: note.header,
    body: note.body,
    authorId: note.authorId,
    authorName: note.authorName,
    attachments: (note.attachments || []).map((file) => ({
      _id: file._id,
      name: file.name,
      contentType: file.contentType,
      size: file.size,
      url: `/api/notes/${note._id}/attachments/${file._id}`,
    })),
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

exports.list = async (req, res) => {
  try {
    const notes = await SharedNote.find({}).sort({ updatedAt: -1 }).select("-attachments.data").lean();
    return res.json({ success: true, notes });
  } catch (error) {
    console.error("List shared notes error:", error);
    return res.status(500).json({ success: false, message: "Unable to load Notes." });
  }
};

exports.create = async (req, res) => {
  try {
    const authorId = getUserId(req);
    if (!authorId || !mongoose.Types.ObjectId.isValid(authorId)) return res.status(401).json({ success: false, message: "Authentication required." });

    const name = cleanText(req.body?.name, 180);
    const header = cleanText(req.body?.header, 300);
    const body = cleanText(req.body?.body, 10000);
    if (!name) return res.status(400).json({ success: false, message: "Note name is required." });
    if (body.length > 10000) return res.status(400).json({ success: false, message: "Notes are limited to 10,000 characters." });

    const files = Array.isArray(req.files) ? req.files : [];
    const attachments = files.map((file) => ({
      name: cleanText(file.originalname || "attachment", 180) || "attachment",
      contentType: String(file.mimetype || "application/octet-stream").slice(0, 120),
      size: Number(file.size || 0),
      data: file.buffer,
    }));

    const note = await SharedNote.create({ name, header, body, authorId, authorName: getUserName(req), attachments });
    return res.status(201).json({ success: true, note: publicNote(note) });
  } catch (error) {
    console.error("Create shared note error:", error);
    return res.status(500).json({ success: false, message: error.message || "Unable to create Note." });
  }
};

exports.update = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid Note ID." });
    const userId = getUserId(req);
    const note = await SharedNote.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: "Note not found." });
    if (String(note.authorId) !== String(userId)) return res.status(403).json({ success: false, message: "Only the Note creator can modify this Note." });

    if (req.body?.name !== undefined) {
      const name = cleanText(req.body.name, 180);
      if (!name) return res.status(400).json({ success: false, message: "Note name is required." });
      note.name = name;
    }
    if (req.body?.header !== undefined) note.header = cleanText(req.body.header, 300);
    if (req.body?.body !== undefined) note.body = cleanText(req.body.body, 10000);

    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length) {
      files.forEach((file) => note.attachments.push({
        name: cleanText(file.originalname || "attachment", 180) || "attachment",
        contentType: String(file.mimetype || "application/octet-stream").slice(0, 120),
        size: Number(file.size || 0),
        data: file.buffer,
      }));
    }

    await note.save();
    return res.json({ success: true, note: publicNote(note) });
  } catch (error) {
    console.error("Update shared note error:", error);
    return res.status(500).json({ success: false, message: error.message || "Unable to update Note." });
  }
};

exports.remove = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid Note ID." });
    const userId = getUserId(req);
    const note = await SharedNote.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: "Note not found." });
    if (String(note.authorId) !== String(userId)) return res.status(403).json({ success: false, message: "Only the Note creator can delete this Note." });
    await note.deleteOne();
    return res.json({ success: true, message: "Note deleted." });
  } catch (error) {
    console.error("Delete shared note error:", error);
    return res.status(500).json({ success: false, message: "Unable to delete Note." });
  }
};

exports.attachment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(req.params.attachmentId)) return res.status(400).end();
    const note = await SharedNote.findById(req.params.id).select("attachments");
    const file = note?.attachments?.id(req.params.attachmentId);
    if (!file) return res.status(404).end();
    res.set("Content-Type", file.contentType);
    res.set("Content-Length", String(file.size));
    res.set("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`);
    return res.send(file.data);
  } catch (error) {
    console.error("Serve Note attachment error:", error);
    return res.status(500).end();
  }
};
