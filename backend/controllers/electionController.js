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
const MAX_PARTY_LOGO_LENGTH = 2 * 1024 * 1024;

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
  if (body.parties !== undefined) {
    payload.parties = Array.isArray(body.parties)
      ? body.parties.map((p) => ({
          partyId: p.partyId || null,
          name: String(p.name || "").trim(),
          logoUrl: String(p.logoUrl || "").trim(),
        })).filter((p) => p.partyId || p.name)
      : [];
  }
  if (body.candidates !== undefined) {
    payload.candidates = Array.isArray(body.candidates)
      ? body.candidates.map((c) => ({
          name: String(c.name || "").trim(),
          party: String(c.party || "").trim(),
          partyLogoUrl: String(c.partyLogoUrl || "").trim(),
          profilePictureUrl: String(c.profilePictureUrl || "").trim(),
          constituencyId: c.constituencyId || null,
        })).filter((c) => c.name)
      : [];
  }
  return payload;
}

async function normalizeSystemParties(parties = []) {
  const submitted = Array.isArray(parties) ? parties : [];
  if (!submitted.length) return [];
  const ids = submitted.map((p) => p.partyId).filter(Boolean).filter((id) => /^[a-f\\d]{24}$/i.test(String(id)));
  const names = submitted.map((p) => String(p.name || "").trim()).filter(Boolean);
  const organizations = await Organization.find({
    organizationType: "political_party",
    organizationStatus: "approved",
    $or: [
      ...(ids.length ? [{ _id: { $in: ids } }] : []),
      ...(names.length ? [{ politicalPartyName: { $in: names } }] : []),
    ],
  }).select("_id name politicalPartyName logo").lean();
  const byId = new Map(organizations.map((o) => [String(o._id), o]));
  const byName = new Map(organizations.map((o) => [String(o.politicalPartyName || o.name).trim().toLowerCase(), o]));
  const seen = new Set();
  const normalized = [];
  for (const item of submitted) {
    const org = (item.partyId && byId.get(String(item.partyId))) || byName.get(String(item.name || "").trim().toLowerCase());
    if (!org) throw new Error(`Only approved political parties registered in PoliSync can participate in an election. Invalid party: ${item.name || item.partyId}.`);
    const key = String(org._id);
    if (seen.has(key)) continue;
    seen.add(key);
    const logo = String(item.logoUrl || org.logo || "").trim();
    if (logo.length > MAX_PARTY_LOGO_LENGTH) throw new Error("Party logo is too large. Use an image up to 2 MB.");
    normalized.push({ partyId: org._id, name: org.politicalPartyName || org.name, logoUrl: logo });
  }
  return normalized;
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
    return res.json({ success: true, isSuperAdmin: access.isSuperAdmin, canViewOrganizationElections: access.canViewOrganizationElections, canViewPersonalElectionsAndResults: access.canViewPersonalElectionsAndResults, allowOrganizationElectionCreation: access.allowOrganizationElectionCreation, organizationIds: access.organizationIds, roles: access.memberships.map((m) => m.role), allowedRoles: ELECTION_VIEW_ROLES });
  } catch (error) { console.error("election access:", error); return res.status(500).json({ success: false, message: "Unable to determine election access." }); }
};

exports.getPoliticalParties = async (req, res) => {
  try {
    const organizations = await Organization.find({ organizationType: "political_party", organizationStatus: "approved" }).select("_id name politicalPartyName logo").sort({ politicalPartyName: 1, name: 1 }).lean();
    return res.json({ success: true, parties: organizations.map((o) => ({ id: o._id, name: o.politicalPartyName || o.name, logoUrl: o.logo || "" })) });
  } catch (error) { return res.status(500).json({ success: false, message: error.message || "Unable to load system political parties." }); }
};

exports.updatePoliticalPartyLogo = async (req, res) => {
  try {
    if (req.user?.platformRole !== "super_admin") return res.status(403).json({ success: false, message: "Only the Super Admin can update system political party logos." });
    const logoUrl = String(req.body?.logoUrl || "").trim();
    if (!logoUrl) return res.status(400).json({ success: false, message: "A party logo is required." });
    if (logoUrl.length > MAX_PARTY_LOGO_LENGTH) return res.status(400).json({ success: false, message: "Party logo is too large. Use an image up to 2 MB." });
    const party = await Organization.findOneAndUpdate({ _id: req.params.partyId, organizationType: "political_party", organizationStatus: "approved" }, { $set: { logo: logoUrl } }, { new: true }).select("_id name politicalPartyName logo").lean();
    if (!party) return res.status(404).json({ success: false, message: "Approved system political party not found." });
    return res.json({ success: true, party: { id: party._id, name: party.politicalPartyName || party.name, logoUrl: party.logo || "" }, message: "Political party logo updated." });
  } catch (error) { return res.status(400).json({ success: false, message: error.message || "Unable to update party logo." }); }
};

exports.createElection = async (req, res) => {
  try {
    const context = await getManagementContext(req);
    if (!context) return res.status(403).json({ success: false, message: "You are not authorized to manage elections." });
    if (!context.isSuperAdmin) {
      const controls = await getPlatformElectionControls();
      if (!controls.allowOrganizationElectionCreation) return res.status(403).json({ success: false, code: "ORGANIZATION_ELECTION_CREATION_DISABLED", message: "The Super Admin has disabled election creation for organizations." });
    }
    const payload = cleanPayload(req.body);
    const validationError = validatePayload(payload);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    try { payload.parties = await normalizeSystemParties(payload.parties); } catch (error) { return res.status(400).json({ success: false, message: error.message }); }
    payload.createdBy = req.user._id;
    payload.managedBy = context.isSuperAdmin ? "platform" : "organization";
    if (!context.isSuperAdmin) payload.organizationId = context.organizationId;
    const election = await Election.create(payload);
    return res.status(201).json({ success: true, election });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
};

exports.getElections = async (req, res) => { try { const access = await getElectionAccess(req.user); const elections = await Election.find(electionVisibilityFilter(access)).populate("organizationId", "name organizationType").sort({ startDateTime: -1, year: -1, createdAt: -1 }); return res.json({ success: true, elections }); } catch (error) { return res.status(500).json({ success: false, message: error.message }); } };
exports.getLiveElections = async (req, res) => { try { const access = await getElectionAccess(req.user); const elections = await Election.find({ ...electionVisibilityFilter(access), status: "Active" }).populate("organizationId", "name organizationType").sort({ startDateTime: -1, year: -1, createdAt: -1 }); return res.json({ success: true, elections, count: elections.length }); } catch (error) { return res.status(500).json({ success: false, message: error.message }); } };
exports.getElectionHistory = async (req, res) => { try { const access = await getElectionAccess(req.user); const elections = await Election.find({ ...electionVisibilityFilter(access), status: "Closed" }).populate("organizationId", "name organizationType").sort({ endDateTime: -1, year: -1, createdAt: -1 }); return res.json({ success: true, elections, count: elections.length }); } catch (error) { return res.status(500).json({ success: false, message: error.message }); } };
exports.getElection = async (req, res) => { try { const access = await getElectionAccess(req.user); const election = await Election.findById(req.params.id).populate("organizationId", "name organizationType"); if (!election) return res.status(404).json({ success: false, message: "Election not found." }); if (!canViewOrganizationElection(access, election)) return res.status(404).json({ success: false, message: "Election not found." }); return res.json({ success: true, election }); } catch (error) { return res.status(400).json({ success: false, message: "Invalid election ID." }); } };
exports.updateElection = async (req, res) => {
  try {
    const context = await getManagementContext(req); if (!context) return res.status(403).json({ success: false, message: "You are not authorized to manage elections." });
    const election = await Election.findById(req.params.id); if (!election) return res.status(404).json({ success: false, message: "Election not found." });
    if (!context.isSuperAdmin && String(election.organizationId || "") !== String(context.organizationId)) return res.status(403).json({ success: false, message: "You can only manage elections owned by your organization." });
    const payload = cleanPayload(req.body); const validationError = validatePayload(payload, true); if (validationError) return res.status(400).json({ success: false, message: validationError });
    if (payload.parties !== undefined) { try { payload.parties = await normalizeSystemParties(payload.parties); } catch (error) { return res.status(400).json({ success: false, message: error.message }); } }
    Object.assign(election, payload); await election.save(); return res.json({ success: true, election, message: "Election updated successfully." });
  } catch (error) { return res.status(400).json({ success: false, message: error.message }); }
};
exports.deleteElection = async (req, res) => { try { const context = await getManagementContext(req); if (!context) return res.status(403).json({ success: false, message: "You are not authorized to manage elections." }); const election = await Election.findById(req.params.id); if (!election) return res.status(404).json({ success: false, message: "Election not found." }); if (!context.isSuperAdmin && String(election.organizationId || "") !== String(context.organizationId)) return res.status(403).json({ success: false, message: "You can only manage elections owned by your organization." }); if (election.status === "Active") return res.status(409).json({ success: false, message: "Active elections cannot be deleted. Close the election first." }); await election.deleteOne(); return res.json({ success: true, message: "Election deleted successfully." }); } catch (error) { return res.status(400).json({ success: false, message: error.message }); } };
