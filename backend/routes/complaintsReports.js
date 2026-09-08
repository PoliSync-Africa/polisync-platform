const express = require("express");
const ComplaintReport = require("../models/ComplaintReport");
const { authenticate, requireSuperAdmin } = require("../auth/middleware");

const router = express.Router();

const TYPES = ["complaint", "report", "incident", "technical", "security"];
const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUSES = ["pending", "under_review", "resolved", "rejected"];
const clean = (v, max) => String(v == null ? "" : v).trim().slice(0, max);

router.use(authenticate);

router.get("/mine", async (req, res) => {
  try {
    const items = await ComplaintReport.find({ submittedBy: req.auth.userId })
      .sort({ createdAt: -1 }).limit(100).populate("resolvedBy", "fullName email").lean();
    return res.json({ success: true, items });
  } catch (error) { return res.status(500).json({ success: false, message: "Failed to load your complaints and reports." }); }
});

router.post("/", async (req, res) => {
  try {
    const type = clean(req.body.type, 30) || "complaint";
    const priority = clean(req.body.priority, 20) || "medium";
    const subject = clean(req.body.subject, 200);
    const description = clean(req.body.description, 5000);
    if (!TYPES.includes(type)) return res.status(400).json({ success: false, message: "Invalid report type." });
    if (!PRIORITIES.includes(priority)) return res.status(400).json({ success: false, message: "Invalid priority." });
    if (!subject || !description) return res.status(400).json({ success: false, message: "Subject and description are required." });
    const item = await ComplaintReport.create({ submittedBy: req.auth.userId, type, priority, subject, description });
    const populated = await ComplaintReport.findById(item._id).populate("submittedBy", "fullName email phoneNumber").lean();
    return res.status(201).json({ success: true, message: "Complaint/report submitted successfully.", item: populated });
  } catch (error) { return res.status(400).json({ success: false, message: "Unable to submit complaint/report." }); }
});

router.get("/admin", requireSuperAdmin, async (req, res) => {
  try {
    const { status, type, priority, search } = req.query;
    const filter = {};
    if (STATUSES.includes(status)) filter.status = status;
    if (TYPES.includes(type)) filter.type = type;
    if (PRIORITIES.includes(priority)) filter.priority = priority;
    if (search) {
      const q = clean(search, 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [{ subject: { $regex: q, $options: "i" } }, { description: { $regex: q, $options: "i" } }];
    }
    const [items, total, pending, underReview, resolved, rejected] = await Promise.all([
      ComplaintReport.find(filter).sort({ createdAt: -1 }).limit(200)
        .populate("submittedBy", "fullName email phoneNumber platformRole").populate("resolvedBy", "fullName email").lean(),
      ComplaintReport.countDocuments(filter),
      ComplaintReport.countDocuments({ status: "pending" }),
      ComplaintReport.countDocuments({ status: "under_review" }),
      ComplaintReport.countDocuments({ status: "resolved" }),
      ComplaintReport.countDocuments({ status: "rejected" }),
    ]);
    return res.json({ success: true, items, total, summary: { total: await ComplaintReport.countDocuments(), pending, underReview, resolved, rejected } });
  } catch (error) { return res.status(500).json({ success: false, message: "Failed to load complaints and reports." }); }
});

router.patch("/admin/:id", requireSuperAdmin, async (req, res) => {
  try {
    const update = {};
    if (req.body.status !== undefined) {
      if (!STATUSES.includes(req.body.status)) return res.status(400).json({ success: false, message: "Invalid status." });
      update.status = req.body.status;
      if (req.body.status === "resolved") { update.resolvedAt = new Date(); update.resolvedBy = req.auth.userId; }
      else { update.resolvedAt = null; update.resolvedBy = null; }
    }
    if (req.body.adminNote !== undefined) update.adminNote = clean(req.body.adminNote, 3000);
    const item = await ComplaintReport.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true })
      .populate("submittedBy", "fullName email phoneNumber platformRole").populate("resolvedBy", "fullName email").lean();
    if (!item) return res.status(404).json({ success: false, message: "Complaint/report not found." });
    return res.json({ success: true, message: "Complaint/report updated.", item });
  } catch (error) { return res.status(400).json({ success: false, message: "Unable to update complaint/report." }); }
});

router.delete("/admin/:id", requireSuperAdmin, async (req, res) => {
  try {
    const item = await ComplaintReport.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Complaint/report not found." });
    return res.json({ success: true, message: "Complaint/report deleted." });
  } catch (error) { return res.status(400).json({ success: false, message: "Unable to delete complaint/report." }); }
});

module.exports = router;
