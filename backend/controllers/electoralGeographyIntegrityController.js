const { checkElectoralGeographyIntegrity } = require("../services/electoralGeographyIntegrityService");
const { refreshElectoralGeography } = require("../scripts/ensureElectoralGeography");
const { ensurePoliticalParties } = require("../scripts/ensurePoliticalParties");
const { synchronizeAllElectionParties } = require("../services/electionGeographySyncService");
const Organization = require("../models/Organization");
const ElectoralDataSyncRun = require("../models/ElectoralDataSyncRun");
const AuditLog = require("../models/AuditLog");

let syncInProgress = false;

exports.report = async (req, res) => {
  try {
    const latestSync = await ElectoralDataSyncRun.findOne({}).sort({ startedAt: -1 }).lean();
    if (latestSync?.status === "running") {
      const [regions, constituencies, pollingStations, politicalParties] = await Promise.all([
        require("../models/Region").countDocuments({ isActive: true }),
        require("../models/Constituency").countDocuments({ isActive: true }),
        require("../models/PollingStation").countDocuments({ isActive: true }),
        Organization.countDocuments({ organizationType: "political_party", organizationStatus: "approved" }),
      ]);
      res.set("Cache-Control", "no-store, max-age=0");
      return res.json({ success: true, data: {
        healthy: false, checkedAt: new Date().toISOString(), status: "syncing",
        counts: { regions, constituencies, pollingStations, politicalParties, expectedRegions: 16, expectedConstituencies: 276 },
        coverage: { regionsComplete: regions === 16, constituencyCountComplete: constituencies === 276 },
        issues: ["Electoral geography and political-party synchronization is currently in progress."], synchronization: latestSync,
      } });
    }
    const report = await checkElectoralGeographyIntegrity();
    res.set("Cache-Control", "no-store, max-age=0");
    return res.json({ success: true, data: { ...report, synchronization: latestSync || null } });
  } catch (error) {
    console.error("Electoral geography integrity check failed:", error);
    return res.status(500).json({ success: false, code: "ELECTORAL_GEOGRAPHY_INTEGRITY_FAILED", message: "Unable to validate electoral geography integrity." });
  }
};

async function runSynchronization(run, req) {
  try {
    await ensurePoliticalParties(Organization);
    const result = await refreshElectoralGeography();
    const partySync = await synchronizeAllElectionParties();
    const completedAt = new Date();
    await ElectoralDataSyncRun.findByIdAndUpdate(run._id, { $set: {
      status: "completed", completedAt,
      matchedRows: result.pollingStationSync?.matchedRows || 0,
      activePollingStations: result.pollingStations || 0,
      skipped: result.pollingStationSync?.skipped || 0,
      ambiguous: result.pollingStationSync?.ambiguous || 0,
      modified: result.pollingStationSync?.modified || 0,
      upserted: result.pollingStationSync?.upserted || 0,
      politicalParties: partySync.parties?.length || 0,
      electionsSynchronized: partySync.elections || 0,
    } });
    await AuditLog.create({ actor: req.user?._id, action: "electoral_data_sync_completed", resource: "ElectoralDataSyncRun", resourceId: run._id, metadata: { sourceYear: 2024, regions: result.regions, constituencies: result.constituencies, matchedRows: result.pollingStationSync?.matchedRows || 0, activePollingStations: result.pollingStations || 0, skipped: result.pollingStationSync?.skipped || 0, modified: result.pollingStationSync?.modified || 0, upserted: result.pollingStationSync?.upserted || 0, politicalParties: partySync.parties?.length || 0, electionsSynchronized: partySync.elections || 0 }, ipAddress: req.ip || null, userAgent: req.get("user-agent") || null });
    console.log(`✅ Unified electoral sync completed: ${result.regions} regions, ${result.constituencies} constituencies, ${result.pollingStations} polling stations, ${partySync.parties?.length || 0} political parties, ${partySync.elections || 0} elections.`);
  } catch (error) {
    const completedAt = new Date();
    await ElectoralDataSyncRun.findByIdAndUpdate(run._id, { $set: { status: "failed", completedAt, errorMessage: String(error.message || "Synchronization failed.").slice(0, 1000) } });
    await AuditLog.create({ actor: req.user?._id, action: "electoral_data_sync_failed", resource: "ElectoralDataSyncRun", resourceId: run._id, metadata: { sourceYear: 2024, error: String(error.message || "Synchronization failed.").slice(0, 500) }, ipAddress: req.ip || null, userAgent: req.get("user-agent") || null }).catch((auditError) => console.error("Failed to record sync audit event:", auditError));
    console.error("Electoral data synchronization failed:", error);
  } finally { syncInProgress = false; }
}

exports.sync = async (req, res) => {
  if (syncInProgress) return res.status(409).json({ success: false, code: "ELECTORAL_DATA_SYNC_IN_PROGRESS", message: "An electoral data synchronization is already running." });
  const existingRun = await ElectoralDataSyncRun.findOne({ status: "running" }).sort({ startedAt: -1 }).lean();
  if (existingRun) return res.status(409).json({ success: false, code: "ELECTORAL_DATA_SYNC_IN_PROGRESS", message: "An electoral data synchronization is already running.", data: { runId: existingRun._id } });
  syncInProgress = true;
  const run = await ElectoralDataSyncRun.create({ actor: req.user?._id || null, status: "running", startedAt: new Date(), source: "Ghana Electoral Commission 2024 Electoral Geography + PoliSync Political Party Registry", sourceYear: 2024 });
  void runSynchronization(run, req);
  return res.status(202).json({ success: true, message: "Unified electoral synchronization started: political parties, elections, regions, constituencies and polling stations will be reconciled from their canonical sources.", data: { sync: run.toObject() } });
};
