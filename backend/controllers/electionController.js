const Election = require("../models/Election");

const ALLOWED_TYPES = ["Presidential", "Parliamentary", "Local"];
const ALLOWED_STATUSES = ["Draft", "Active", "Closed"];

function cleanPayload(body = {}) {
  const payload = {};
  if (body.name !== undefined) payload.name = String(body.name).trim();
  if (body.year !== undefined) payload.year = Number(body.year);
  if (body.type !== undefined) payload.type = String(body.type);
  if (body.country !== undefined) payload.country = String(body.country).trim();
  if (body.status !== undefined) payload.status = String(body.status);
  if (body.totalPollingStations !== undefined) payload.totalPollingStations = Number(body.totalPollingStations);
  if (body.parties !== undefined) payload.parties = Array.isArray(body.parties) ? body.parties.map(p => ({ name: String(p.name || "").trim(), logoUrl: String(p.logoUrl || "").trim() })).filter(p => p.name) : [];
  if (body.candidates !== undefined) payload.candidates = Array.isArray(body.candidates) ? body.candidates.map(c => ({ name: String(c.name || "").trim(), party: String(c.party || "").trim(), partyLogoUrl: String(c.partyLogoUrl || "").trim(), profilePictureUrl: String(c.profilePictureUrl || "").trim(), constituencyId: c.constituencyId || null })).filter(c => c.name) : [];
  return payload;
}

function validatePayload(payload, partial = false) {
  if (!partial || payload.name !== undefined) if (!payload.name) return "Election name is required.";
  if (!partial || payload.year !== undefined) if (!Number.isInteger(payload.year) || payload.year < 1900 || payload.year > 2200) return "Election year must be a valid year.";
  if (!partial || payload.type !== undefined) if (!ALLOWED_TYPES.includes(payload.type)) return "Invalid election type.";
  if (payload.status !== undefined && !ALLOWED_STATUSES.includes(payload.status)) return "Invalid election status.";
  if (payload.totalPollingStations !== undefined && (!Number.isInteger(payload.totalPollingStations) || payload.totalPollingStations < 0)) return "Total polling stations must be a non-negative whole number.";
  return null;
}

exports.createElection = async (req, res) => {
  try {
    const payload = cleanPayload(req.body); const validationError = validatePayload(payload);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    const election = await Election.create(payload);
    return res.status(201).json({ success: true, election });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

exports.getElections = async (req, res) => {
  try { const elections = await Election.find().sort({ year: -1, createdAt: -1 }); return res.json({ success: true, elections }); }
  catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};
exports.getLiveElections = async (req, res) => {
  try { const elections = await Election.find({ status: "Active" }).sort({ year: -1, createdAt: -1 }); return res.json({ success: true, elections, count: elections.length }); }
  catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};
exports.getElectionHistory = async (req, res) => {
  try { const elections = await Election.find({ status: "Closed" }).sort({ year: -1, createdAt: -1 }); return res.json({ success: true, elections, count: elections.length }); }
  catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};
exports.getElection = async (req, res) => {
  try { const election = await Election.findById(req.params.id); if (!election) return res.status(404).json({ success: false, message: "Election not found." }); return res.json({ success: true, election }); }
  catch (error) { return res.status(400).json({ success: false, message: "Invalid election ID." }); }
};
exports.updateElection = async (req, res) => {
  try { const payload = cleanPayload(req.body); const validationError = validatePayload(payload, true); if (validationError) return res.status(400).json({ success: false, message: validationError }); const election = await Election.findById(req.params.id); if (!election) return res.status(404).json({ success: false, message: "Election not found." }); Object.assign(election, payload); await election.save(); return res.json({ success: true, election, message: "Election updated successfully." }); }
  catch (error) { return res.status(400).json({ success: false, message: error.message }); }
};
exports.deleteElection = async (req, res) => {
  try { const election = await Election.findById(req.params.id); if (!election) return res.status(404).json({ success: false, message: "Election not found." }); if (election.status === "Active") return res.status(409).json({ success: false, message: "Active elections cannot be deleted. Close the election first." }); await election.deleteOne(); return res.json({ success: true, message: "Election deleted successfully." }); }
  catch (error) { return res.status(400).json({ success: false, message: error.message }); }
};
