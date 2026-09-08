const mongoose = require("mongoose");
const WorkspaceDeployment = require("../models/WorkspaceDeployment");
const PersonalCampaign = require("../models/PersonalCampaign");
const PersonalEvent = require("../models/PersonalEvent");
const Election = require("../models/Election");
const OrganizationMembership = require("../models/OrganizationMembership");

const me = req => req.user?._id || req.user?.id;
const LEVELS = ["national", "region", "constituency", "polling_station"];
const KINDS = ["role", "assignment"];
const STATUSES = ["assigned", "active", "completed", "removed"];

function normalizeLocation(value) {
  if (!value) return null;
  if (!LEVELS.includes(value.level)) return null;
  return {
    level: value.level,
    regionId: value.regionId || null,
    regionName: String(value.regionName || "").trim(),
    constituencyId: value.constituencyId || null,
    constituencyName: String(value.constituencyName || "").trim(),
    pollingStationId: value.pollingStationId || null,
    pollingStationName: String(value.pollingStationName || "").trim(),
    pollingStationCode: String(value.pollingStationCode || "").trim(),
  };
}

async function targetExists(targetType, targetId, userId) {
  if (targetType === "campaign") return PersonalCampaign.findOne({ _id: targetId, userId }).lean();
  if (targetType === "event") return PersonalEvent.findOne({ _id: targetId, userId }).lean();
  if (targetType === "election") return Election.findById(targetId).lean();
  return null;
}

async function ownerContext(userId) {
  const memberships = await OrganizationMembership.find({ userId, status: "approved" }).lean();
  const membership = memberships.find(m => ["national_party_admin", "regional_party_admin", "constituency_admin", "polling_station_agent", "national_observer_admin", "regional_observer_admin", "constituency_observer_admin", "observer_polling_station_agent"].includes(m.role));
  if (membership) return { ownerOrganizationId: membership.organizationId, ownerType: membership.role.includes("party") ? "political_party" : "organization" };
  const candidate = memberships.find(m => ["presidential_candidate", "parliamentary_candidate"].includes(m.role));
  if (candidate) return { ownerOrganizationId: candidate.organizationId, ownerType: "candidate" };
  return { ownerOrganizationId: null, ownerType: "person" };
}

function validateBody(body) {
  if (!KINDS.includes(body.kind)) return "A deployment type is required.";
  if (!String(body.roleName || "").trim()) return "Role name is required.";
  if (body.location && !LEVELS.includes(body.location.level)) return "Invalid electoral geography level.";
  if (body.kind === "assignment" && !body.personId) return "A person is required for an assignment.";
  if (body.personId && !mongoose.Types.ObjectId.isValid(body.personId)) return "Invalid person ID.";
  if (body.status && !STATUSES.includes(body.status)) return "Invalid deployment status.";
  return null;
}

exports.list = async (req, res) => {
  try {
    const userId = me(req);
    const { targetType, targetId, electionId } = req.query || {};
    const filter = { ownerUserId: userId };
    if (targetType) filter.targetType = targetType;
    if (targetId && mongoose.Types.ObjectId.isValid(targetId)) filter.targetId = targetId;
    if (electionId && mongoose.Types.ObjectId.isValid(electionId)) filter.electionId = electionId;
    const data = await WorkspaceDeployment.find(filter).sort({ updatedAt: -1 }).lean();
    return res.json({ success: true, data });
  } catch (e) { return res.status(500).json({ success: false, message: e.message || "Unable to load deployments." }); }
};

exports.elections = async (req, res) => {
  try {
    const data = await Election.find({}).sort({ startDateTime: 1, year: -1, createdAt: -1 }).lean();
    return res.json({ success: true, data });
  } catch (e) { return res.status(500).json({ success: false, message: e.message || "Unable to load elections." }); }
};

exports.create = async (req, res) => {
  try {
    const userId = me(req), body = req.body || {};
    if (!userId) return res.status(401).json({ success: false, message: "Authentication required." });
    if (!body.targetType || !["campaign", "event", "election"].includes(body.targetType)) return res.status(400).json({ success: false, message: "Invalid deployment target." });
    if (!mongoose.Types.ObjectId.isValid(body.targetId)) return res.status(400).json({ success: false, message: "Invalid target ID." });
    const target = await targetExists(body.targetType, body.targetId, userId);
    if (!target) return res.status(404).json({ success: false, message: "Target was not found or is not available to you." });
    const error = validateBody(body);
    if (error) return res.status(400).json({ success: false, message: error });
    const electionId = body.targetType === "election" ? body.targetId : (body.electionId && mongoose.Types.ObjectId.isValid(body.electionId) ? body.electionId : null);
    if (electionId && !(await Election.exists({ _id: electionId }))) return res.status(400).json({ success: false, message: "Selected election does not exist." });
    const owner = await ownerContext(userId);
    const item = await WorkspaceDeployment.create({
      targetType: body.targetType, targetId: body.targetId, electionId, ownerUserId: userId,
      ...owner, kind: body.kind, roleName: String(body.roleName).trim(), roleDescription: String(body.roleDescription || "").trim(),
      personId: body.personId || null, personName: String(body.personName || "").trim(), location: normalizeLocation(body.location),
      responsibilities: String(body.responsibilities || "").trim(), status: STATUSES.includes(body.status) ? body.status : "assigned",
    });
    return res.status(201).json({ success: true, data: item });
  } catch (e) { return res.status(500).json({ success: false, message: e.message || "Unable to create deployment." }); }
};

exports.update = async (req, res) => {
  try {
    const userId = me(req);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid deployment ID." });
    const item = await WorkspaceDeployment.findOne({ _id: req.params.id, ownerUserId: userId });
    if (!item) return res.status(404).json({ success: false, message: "Deployment not found or you are not its owner." });
    const body = { ...item.toObject(), ...req.body };
    const error = validateBody(body);
    if (error) return res.status(400).json({ success: false, message: error });
    ["kind", "roleName", "roleDescription", "personId", "personName", "responsibilities", "status"].forEach(k => { if (req.body[k] !== undefined) item[k] = k === "roleName" || k === "roleDescription" || k === "personName" || k === "responsibilities" ? String(req.body[k] || "").trim() : req.body[k]; });
    if (req.body.location !== undefined) item.location = normalizeLocation(req.body.location);
    await item.save();
    return res.json({ success: true, data: item });
  } catch (e) { return res.status(500).json({ success: false, message: e.message || "Unable to update deployment." }); }
};

exports.remove = async (req, res) => {
  try {
    const userId = me(req);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid deployment ID." });
    const item = await WorkspaceDeployment.findOneAndDelete({ _id: req.params.id, ownerUserId: userId });
    if (!item) return res.status(404).json({ success: false, message: "Deployment not found or you are not its owner." });
    return res.json({ success: true, message: "Deployment removed." });
  } catch (e) { return res.status(500).json({ success: false, message: e.message || "Unable to remove deployment." }); }
};
