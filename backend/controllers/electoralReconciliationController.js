const ElectoralReconciliationRun = require("../models/ElectoralReconciliationRun");
const AuditLog = require("../models/AuditLog");
const { buildReconciliation } = require("../services/electoralReconciliationService");

let running = false;

async function dryRun(req, res) {
  if (running) return res.status(409).json({ error: "A reconciliation is already running." });
  running = true;
  try {
    const result = await buildReconciliation();
    const run = await ElectoralReconciliationRun.create({ source: result.source, sourceYear: result.sourceYear, status: "dry_run", actor: req.user._id, completedAt: new Date(), summary: result.summary, changes: result.changes });
    res.json({ ok: true, runId: run._id, status: run.status, source: result.source, sourceYear: result.sourceYear, summary: result.summary, changes: result.changes });
  } catch (error) {
    res.status(422).json({ ok: false, error: error.message || "Reconciliation validation failed." });
  } finally { running = false; }
}

async function review(req, res) {
  const run = await ElectoralReconciliationRun.findById(req.params.id).lean();
  if (!run) return res.status(404).json({ error: "Reconciliation run not found." });
  res.json({ ok: true, run });
}

async function approve(req, res) {
  const run = await ElectoralReconciliationRun.findById(req.params.id);
  if (!run) return res.status(404).json({ error: "Reconciliation run not found." });
  if (run.status !== "dry_run") return res.status(409).json({ error: `Run cannot be approved from status ${run.status}.` });
  if (run.summary.unresolved || run.summary.duplicateSourceCodes) return res.status(422).json({ error: "This reconciliation contains unresolved or duplicate source records and cannot be approved." });
  run.status = "approved"; run.approvedAt = new Date(); await run.save();
  await AuditLog.create({ actor: req.user._id, action: "electoral_reconciliation_approved", metadata: { runId: String(run._id), summary: run.summary } });
  res.json({ ok: true, runId: run._id, status: run.status });
}

module.exports = { dryRun, review, approve };
