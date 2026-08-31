const Announcement = require("../models/Announcement");

exports.list = async (req, res) => {
  try {
    const filter = req.user?.platformRole === "super_admin" ? {} : { status: "published" };
    const items = await Announcement.find(filter)
      .populate("createdBy", "firstName middleName lastName username")
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(200)
      .lean();
    return res.json({ success: true, announcements: items, total: items.length });
  } catch (error) {
    console.error("Announcement list error:", error);
    return res.status(500).json({ success: false, message: "Unable to load announcements." });
  }
};

exports.create = async (req, res) => {
  try {
    const title = String(req.body?.title || "").trim();
    const body = String(req.body?.body || "").trim();
    const audience = String(req.body?.audience || "all").trim();
    if (!title || !body) return res.status(400).json({ success: false, message: "Title and announcement body are required." });
    if (!["all", "personal", "organizations", "party", "observer"].includes(audience)) return res.status(400).json({ success: false, message: "Invalid audience." });
    const announcement = await Announcement.create({ title, body, audience, status: "draft", createdBy: req.user._id });
    return res.status(201).json({ success: true, announcement });
  } catch (error) {
    console.error("Announcement create error:", error);
    return res.status(500).json({ success: false, message: "Unable to create announcement." });
  }
};

exports.publish = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, message: "Announcement not found." });
    announcement.status = "published";
    announcement.publishedAt = new Date();
    await announcement.save();
    return res.json({ success: true, announcement });
  } catch (error) {
    console.error("Announcement publish error:", error);
    return res.status(500).json({ success: false, message: "Unable to publish announcement." });
  }
};

exports.archive = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, { $set: { status: "archived" } }, { new: true }).lean();
    if (!announcement) return res.status(404).json({ success: false, message: "Announcement not found." });
    return res.json({ success: true, announcement });
  } catch (error) {
    console.error("Announcement archive error:", error);
    return res.status(500).json({ success: false, message: "Unable to archive announcement." });
  }
};
