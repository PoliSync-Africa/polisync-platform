const { checkElectoralGeographyIntegrity } = require("../services/electoralGeographyIntegrityService");
const { syncPollingStationsFromEcPdf } = require("../scripts/syncPollingStationsFromEc");
const ElectoralDataSyncRun = require("../models/ElectoralDataSyncRun");
const AuditLog = require("../models/AuditLog");

let syncInProgress = false;

exports.report = async (req, res) => {
  try {
    const report = await checkElectoralGeographyIntegrity();
    const latestSync = await ElectoralDataSyncRun.findOne({}).sort({ startedAt: -1 }).lean();
    return res.json({ success: true, data: { ...report, synchronization: latestSync || null } });
  } catch (error) {
    console.error("Electoral geography integrity check failed:", error);
    return res.status(500).json({
      success: false,
      code: "ELECTORAL_GEOGRAPHY_INTEGRITY_FAILED",
      message: "Unable to validate electoral geography integrity.",
    });
  }
};

exports.sync = async (req, res) => {
  if (syncInProgress) return res.status(409).json({ success: false, code: "ELECTORAL_DATA_SYNC_IN_PROGRESS", message: "An electoral data synchronization is already running." });

  syncInProgress = true;
  const run = await ElectoralDataSyncRun.create({ actor: req.user?._id || null, status: "running", startedAt: new Date(), source: "Ghana Electoral Commission 2024 Polling Stations", sourceYear: 2024 });

  try {
    const result = await syncPollingStationsFromEcPdf();
    const completedAt = new Date();
    await ElectoralDataSyncRun.findByIdAndUpdate(run._id, { $set: {
      status: "completed", completedAt,
      matchedRows: result.matchedRows || 0,
      activePollingStations: result.count || 0,
      skipped: result.skipped || 0,
      ambiguous: result.ambiguous || 0,
      modified: result.modified || 0,
      upserted: result.upserted || 0,
    } });
    await AuditLog.create({
      actor: req.user._id,
      action: "electoral_data_sync_completed",
      resource: "ElectoralDataSyncRun",
      resourceId: run._id,
      metadata: { sourceYear: 2024, matchedRows: result.matchedRows || 0, activePollingStations: result.count || 0, skipped: result.skipped || 0, ambiguous: result.ambiguous || 0, modified: result.modified || 0, upserted: result.upserted || 0 },
      ipAddress: req.ip || null,
      userAgent: req.get("user-agent") || null,
    });
    const integrity = await checkElectoralGeographyIntegrity();
    return res.json({ success: true, message: "Official electoral polling-station dataset synchronized successfully.", data: { sync: { ...result, status: "completed", completedAt }, integrity } });
  } catch (error) {
    const completedAt = new Date();
    await ElectoralDataSyncRun.findByIdAndUpdate(run._id, { $set: { status: "failed", completedAt, errorMessage: String(error.message || "Synchronization failed.").slice(0, 1000) } });
    await AuditLog.create({
      actor: req.user._id,
      action: "electoral_data_sync_failed",
      resource: "ElectoralDataSyncRun",
      resourceId: run._id,
      metadata: { sourceYear: 2024, error: String(error.message || "Synchronization failed.").slice(0, 500) },
      ipAddress: req.ip || null,
      userAgent: req.get("user-agent") || null,
    }).catch((auditError) => console.error("Failed to record sync audit event:", auditError));
    console.error("Electoral data synchronization failed:", error);
    return res.status(500).json({ success: false, code: "ELECTORAL_DATA_SYNC_FAILED", message: "Electoral data synchronization failed. No incomplete sync is reported as successful." });
  } finally {
    syncInProgress = false;
  }
};
