const Election = require("../models/Election");
const OrganizationMembership = require("../models/OrganizationMembership");
const Organization = require("../models/Organization");
const {
  ELECTION_VIEW_ROLES,
  getElectionAccess,
  getPlatformElectionControls,
  canViewOrganizationElection,
  electionVisibilityFilter,
} = require("../services/electionAccessService");

const ALLOWED_TYPES = ["Presidential", "Parliamentary", "Local"];
const ALLOWED_STATUSES = ["Draft", "Active", "Closed"];
const ORG_ELECTION_ROLES = ["national_party_admin", "national_observer_admin"];

function parseDateTime(value) {
  if (value === undefined || value === null || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function cleanPayload(body = {}) {
  const payload = {};
  if (body.name !== undefined) payload.name = String(body.name).trim();
  if (body.year !== undefined) payload.year = Number(body.year);
  if (body.startDateTime !== undefined) payload.startDateTime = parseDateTime(body.startDateTime);
  if (body.endDateTime !== undefined) payload.endDateTime = parseDateTime(body.endDateTime);
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
  if (payload.startDateTime === null && payload.endDateTime !== null && payload.endDateTime !== undefined) return "An election start date and time is required before the end date and time.";
  if (payload.startDateTime !== undefined && payload.startDateTime === null && payload.endDateTime === undefined) return "Election start date and time must be valid.";
  if (payload.endDateTime !== undefined && payload.endDateTime === null && payload.startDateTime !== undefined && payload.startDateTime !== null) return "Election end date and time must be valid.";
  if (payload.startDateTime && payload.endDateTime && payload.endDateTime <= payload.startDateTime) return "Election end date and time must be after the start date and time.";
  if (payload.startDateTime && payload.year !== undefined && payload.startDateTime.getUTCFullYear() !== payload.year) return "The election date must be within the selected election year.";
  return null;
}

async function getManagementContext(req) {
  if (req.user?.platformRole === "super_admin") return { isSuperAdmin: true, organizationId: null, membership: null };
  const membership = await OrganizationMembership.findOne({ userId: req.user._id, role: { $in: ORG_ELECTION_ROLES }, status: "approved" }).lean();
  if (!membership) return null;
  const organization = await Organization.findOne({ _id: membership.organizationId, organizationStatus: "approved" }).lean();
  if (!organization) return null;
  return { isSuperAdmin: false, organizationId: membership.organizationId, membership, organization };
}

exports.getElectionAccess = async (req, res) => {
  try {
    const access = await getElectionAccess(req.user);
    return res.json({
      success: true,
      isSuperAdmin: access.isSuperAdmin,
      canViewOrganizationElections: access.canViewOrganizationElections,
      canViewPersonalElectionsAndResults: access.canViewPersonalElectionsAndResults,
      allowOrganizationElectionCreation: access.allowOrganizationElectionCreation,
      organizationIds: access.organizationIds,
      roles: access.memberships.map((membership) => membership.role),
      allowedRoles: ELECTION_VIEW_ROLES,
    });
  } catch (error) {
    console.error("election access:", error);
    return res.status(500).json({ success: false, message: "Unable to determine election access." });
  }
};

exports.createElection = async (req, res) => {
  try {
    const context = await getManagementContext(req);
    if (!context) return res.status(403).json({ success: false, message: "You are not authorized to manage elections." });

    if (!context.isSuperAdmin) {
      const controls = await getPlatformElectionControls();
      if (!controls.allowOrganizationElectionCreation) {
        return res.status(403).json({ success: false, code: "ORGANIZATION_ELECTION_CREATION_DISABLED", message: "The Super Admin has disabled election creation for organizations." });
      }
    }

    const payload = cleanPayload(req.body);
    const validationError = validatePayload(payload);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    payload.createdBy = req.user._id;
    payload.managedBy = context.isSuperAdmin ? "platform" : "organization";
    if (!context.isSuperAdmin) payload.organizationId = context.organizationId;
    const election = await Election.create(payload);
    return res.status(201).json({ success: true, election });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getElections = async (req, res) => {
  try {
    const access = await getElectionAccess(req.user);
    const elections = await Election.find(electionVisibilityFilter(access)).populate("organizationId", "name organizationType").sort({ startDateTime: -1, year: -1, createdAt: -1 });
    return res.json({ success: true, elections });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

exports.getLiveElections = async (req, res) => {
  try {
    const access = await getElectionAccess(req.user);
    const elections = await Election.find({ ...electionVisibilityFilter(access), status: "Active" }).populate("organizationId", "name organizationType").sort({ startDateTime: -1, year: -1, createdAt: -1 });
    return res.json({ success: true, elections, count: elections.length });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

exports.getElectionHistory = async (req, res) => {
  try {
    const access = await getElectionAccess(req.user);
    const elections = await Election.find({ ...electionVisibilityFilter(access), status: "Closed" }).populate("organizationId", "name organizationType").sort({ endDateTime: -1, year: -1, createdAt: -1 });
    return res.json({ success: true, elections, count: elections.length });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

exports.getElection = async (req, res) => {
  try {
    const access = await getElectionAccess(req.user);
    const election = await Election.findById(req.params.id).populate("organizationId", "name organizationType");
    if (!election) return res.status(404).json({ success: false, message: "Election not found." });
    if (!canViewOrganizationElection(access, election)) return res.status(404).json({ success: false, message: "Election not found." });
    return res.json({ success: true, election });
  } catch (error) { return res.status(400).json({ success: false, message: "Invalid election ID." }); }
};

exports.updateElection = async (req, res) => {
  try {
    const context = await getManagementContext(req);
    if (!context) return res.status(403).json({ success: false, message: "You are not authorized to manage elections." });
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ success: false, message: "Election not found." });
    if (!context.isSuperAdmin && String(election.organizationId || "") !== String(context.organizationId)) return res.status(403).json({ success: false, message: "You can only manage elections owned by your organization." });
    const payload = cleanPayload(req.body);
    const validationError = validatePayload(payload, true);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    Object.assign(election, payload);
    await election.save();
    return res.json({ success: true, election, message: "Election updated successfully." });
  } catch (error) { return res.status(400).json({ success: false, message: error.message }); }
};

exports.deleteElection = async (req, res) => {
  try {
    const context = await getManagementContext(req);
    if (!context) return res.status(403).json({ success: false, message: "You are not authorized to manage elections." });
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ success: false, message: "Election not found." });
    if (!context.isSuperAdmin && String(election.organizationId || "") !== String(context.organizationId)) return res.status(403).json({ success: false, message: "You can only manage elections owned by your organization." });
    if (election.status === "Active") return res.status(409).json({ success: false, message: "Active elections cannot be deleted. Close the election first." });
    await election.deleteOne();
    return res.json({ success: true, message: "Election deleted successfully." });
  } catch (error) { return res.status(400).json({ success: false, message: error.message }); }
};
