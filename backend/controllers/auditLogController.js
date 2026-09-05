const AuditLog = require("../models/AuditLog");

exports.list = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 500);
    const logs = await AuditLog.find({})
      .populate("actor", "firstName middleName lastName username email")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return res.json({ success: true, logs, total: logs.length });
  } catch (error) {
    console.error("Audit log list error:", error);
    return res.status(500).json({ success: false, message: "Unable to load audit logs." });
  }
};

exports.create = async (req, res) => {
  try {
    const log = await AuditLog.create({
      actor: req.user._id,
      action: String(req.body?.action || "platform_action").trim(),
      resource: req.body?.resource || null,
      resourceId: req.body?.resourceId || null,
      metadata: req.body?.metadata || {},
      ipAddress: req.ip || null,
      userAgent: req.get("user-agent") || null,
    });
    return res.status(201).json({ success: true, log });
  } catch (error) {
    console.error("Audit log create error:", error);
    return res.status(500).json({ success: false, message: "Unable to record audit event." });
  }
};
