const Announcement = require("../models/Announcement");
const { deliverAnnouncementNotifications } = require("../services/announcementNotificationService");

const normalizeActionUrl = (value) => {
  const actionUrl = String(value || "").trim();
  if (!actionUrl) return "";
  if (!actionUrl.startsWith("/")) throw new Error("Feature action URL must be an internal PoliSync path starting with '/'.");
  return actionUrl.slice(0, 500);
};

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
    const isFeatureRelease = Boolean(req.body?.isFeatureRelease);
    const featureName = String(req.body?.featureName || "").trim();
    const actionUrl = normalizeActionUrl(req.body?.actionUrl);

    if (!title || !body) return res.status(400).json({ success: false, message: "Title and announcement body are required." });
    if (!["all", "personal", "organizations", "party", "observer"].includes(audience)) return res.status(400).json({ success: false, message: "Invalid audience." });
    if (isFeatureRelease && !featureName) return res.status(400).json({ success: false, message: "Feature name is required for a feature release." });

    const announcement = await Announcement.create({
      title,
      body,
      audience,
      isFeatureRelease,
      featureName: isFeatureRelease ? featureName : "",
      actionUrl,
      status: "draft",
      createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, announcement });
  } catch (error) {
    console.error("Announcement create error:", error);
    return res.status(400).json({ success: false, message: error.message || "Unable to create announcement." });
  }
};

exports.publish = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, message: "Announcement not found." });
    if (announcement.status === "archived") return res.status(400).json({ success: false, message: "Archived announcements cannot be published." });

    const wasAlreadyPublished = announcement.status === "published";
    if (!wasAlreadyPublished) {
      announcement.status = "published";
      announcement.publishedAt = new Date();
      await announcement.save();
    }

    let delivery = null;
    try {
      delivery = await deliverAnnouncementNotifications(announcement);
    } catch (deliveryError) {
      console.error("Announcement notification delivery error:", deliveryError);
      return res.status(202).json({
        success: true,
        warning: "Announcement was published, but notification delivery could not be completed. It can be retried by publishing the announcement again.",
        announcement,
        delivery: { failed: true, error: deliveryError.message },
      });
    }

    return res.json({
      success: true,
      message: wasAlreadyPublished ? "Announcement already published; missing user notifications were delivered." : "Announcement published and user notifications delivered.",
      announcement,
      delivery,
    });
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
