const PersonalCampaign = require("../models/PersonalCampaign");
const PersonalFieldTask = require("../models/PersonalFieldTask");

const me = (req) => req.user?._id || req.user?.id;
const safeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

exports.summary = async (req, res) => {
  try {
    const userId = me(req);
    if (!userId) return res.status(401).json({ success: false, message: "Authentication required." });
    const [campaigns, activeCampaigns, tasks, openTasks] = await Promise.all([
      PersonalCampaign.countDocuments({ userId }),
      PersonalCampaign.countDocuments({ userId, status: "active" }),
      PersonalFieldTask.countDocuments({ userId }),
      PersonalFieldTask.countDocuments({ userId, status: { $in: ["planned", "in_progress"] } }),
    ]);
    return res.json({ success: true, data: { campaigns, activeCampaigns, tasks, openTasks } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to load operations summary." });
  }
};

exports.campaigns = async (req, res) => {
  try {
    const userId = me(req);
    const items = await PersonalCampaign.find({ userId }).sort({ updatedAt: -1 }).lean();
    return res.json({ success: true, data: items });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to load campaigns." });
  }
};

exports.createCampaign = async (req, res) => {
  try {
    const userId = me(req);
    const { name, election, geography, objective, status, startDate, endDate } = req.body || {};
    if (!String(name || "").trim()) return res.status(400).json({ success: false, message: "Campaign name is required." });
    const item = await PersonalCampaign.create({
      userId,
      name: String(name).trim(),
      election: String(election || "").trim(),
      geography: String(geography || "").trim(),
      objective: String(objective || "").trim(),
      status: ["planning", "active", "paused", "completed"].includes(status) ? status : "planning",
      startDate: safeDate(startDate),
      endDate: safeDate(endDate),
    });
    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to create campaign." });
  }
};

exports.tasks = async (req, res) => {
  try {
    const userId = me(req);
    const items = await PersonalFieldTask.find({ userId }).sort({ dueDate: 1, updatedAt: -1 }).lean();
    return res.json({ success: true, data: items });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to load field tasks." });
  }
};

exports.createTask = async (req, res) => {
  try {
    const userId = me(req);
    const { title, description, area, taskType, status, dueDate, latitude, longitude } = req.body || {};
    if (!String(title || "").trim()) return res.status(400).json({ success: false, message: "Task title is required." });
    const item = await PersonalFieldTask.create({
      userId,
      title: String(title).trim(),
      description: String(description || "").trim(),
      area: String(area || "").trim(),
      taskType: ["canvass", "community_visit", "meeting", "survey", "polling_station", "logistics", "other"].includes(taskType) ? taskType : "other",
      status: ["planned", "in_progress", "completed", "cancelled"].includes(status) ? status : "planned",
      dueDate: safeDate(dueDate),
      latitude: Number.isFinite(Number(latitude)) ? Number(latitude) : null,
      longitude: Number.isFinite(Number(longitude)) ? Number(longitude) : null,
    });
    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to create field task." });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const userId = me(req);
    const allowed = ["planned", "in_progress", "completed", "cancelled"];
    if (!allowed.includes(req.body?.status)) return res.status(400).json({ success: false, message: "Invalid task status." });
    const item = await PersonalFieldTask.findOneAndUpdate({ _id: req.params.id, userId }, { $set: { status: req.body.status } }, { new: true }).lean();
    if (!item) return res.status(404).json({ success: false, message: "Field task not found." });
    return res.json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to update field task." });
  }
};
