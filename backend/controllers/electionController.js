const Election = require("../models/Election");
const OrganizationMembership = require("../models/OrganizationMembership");
const Organization = require("../models/Organization");
const { synchronizeElectionGeography, synchronizeAllElectionParties } = require("../services/electionGeographySyncService");
const { ELECTION_VIEW_ROLES, getElectionAccess, getPlatformElectionControls, canViewOrganizationElection, electionVisibilityFilter } = require("../services/electionAccessService");

const ALLOWED_TYPES = ["Presidential", "Parliamentary", "Local"];
const ALLOWED_STATUSES = ["Draft", "Active", "Closed"];
const ORG_ELECTION_ROLES = ["national_party_admin", "national_observer_admin"];
const MAX_PARTY_LOGO_LENGTH = 2 * 1024 * 1024;
const SYSTEM_PARTIES = (Organization.PERMANENT_POLITICAL_PARTIES || []).filter((name) => name !== "Independent");

function parseDateTime(value) { if (value === undefined || value === null || value === "") return null; const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date; }
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
  if (body.parties !== undefined) payload.parties = Array.isArray(body.parties) ? body.parties.map((p) => ({ partyId: p.partyId || null, name: String(p.name || "").trim(), logoUrl: String(p.logoUrl || "").trim() })).filter((p) => p.partyId || p.name) : [];
  if (body.candidates !== undefined) payload.candidates = Array.isArray(body.candidates) ? body.candidates.map((c) => ({ name: String(c.name || "").trim(), partyId: c.partyId || null, party: String(c.party || "").trim(), partyLogoUrl: String(c.partyLogoUrl || "").trim(), profilePictureUrl: String(c.profilePictureUrl || "").trim(), constituencyId: c.constituencyId || null })).filter((c) => c.name) : [];
  return payload;
}

async function getApprovedPoliticalParties() {
  return Organization.find({ organizationType: "political_party", organizationStatus: "approved" }).select("_id name politicalPartyName logo").lean();
}

async function normalizeSystemParties(parties = []) {
  const submitted = Array.isArray(parties) ? parties : [];
  if (!submitted.length) return [];
  const ids = submitted.map((p) => p.partyId).filter(Boolean).filter((id) => /^[a-f\d]{24}$/i.test(String(id)));
  const names = submitted.map((p) => String(p.name || "").trim()).filter(Boolean);
  const organizations = await Organization.find({ organizationType: "political_party", organizationStatus: "approved", $or: [...(ids.length ? [{ _id: { $in: ids } }] : []), ...(names.length ? [{ politicalPartyName: { $in: names } }] : [])] }).select("_id name politicalPartyName logo").lean();
  const byId = new Map(organizations.map((o) => [String(o._id), o]));
  const byName = new Map(organizations.map((o) => [String(o.politicalPartyName || o.name).trim().toLowerCase(), o]));
  const allowedPermanent = new Set(SYSTEM_PARTIES.map((name) => name.toLowerCase()));
  const seen = new Set(); const normalized = [];
  for (const item of submitted) {
    const requestedName = String(item.name || "").trim();
    const org = (item.partyId && byId.get(String(item.partyId))) || byName.get(requestedName.toLowerCase());
    if (!org && !allowedPermanent.has(requestedName.toLowerCase())) throw new Error(`Only political parties registered in the PoliSync system can participate in an election. Invalid party: ${requestedName || item.partyId}.`);
    const canonicalName = org?.politicalPartyName || org?.name || SYSTEM_PARTIES.find((name) => name.toLowerCase() === requestedName.toLowerCase()) || requestedName;
    const key = org ? String(org._id) : canonicalName.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const logo = String(item.logoUrl || org?.logo || "").trim();
    if (logo.length > MAX_PARTY_LOGO_LENGTH) throw new Error("Party logo is too large. Use an image up to 2 MB.");
    normalized.push({ partyId: org?._id || null, name: canonicalName, logoUrl: logo });
  }
  return normalized;
}

function normalizeCandidates(candidates = [], parties = []) {
  const partyById = new Map(parties.map((p) => [String(p.partyId || ""), p]));
  const partyByName = new Map(parties.map((p) => [String(p.name || "").trim().toLowerCase(), p]));
  return (Array.isArray(candidates) ? candidates : []).map((candidate) => {
    const requestedParty = String(candidate.party || "").trim();
    const party = (candidate.partyId && partyById.get(String(candidate.partyId))) || partyByName.get(requestedParty.toLowerCase());
    const independent = !party && (!requestedParty || requestedParty.toLowerCase() === "independent");
    return {
      name: String(candidate.name || "").trim(),
      partyId: party?.partyId || null,
      party: party?.name || (independent ? "Independent" : requestedParty),
      partyLogoUrl: party?.logoUrl || String(candidate.partyLogoUrl || "").trim(),
      profilePictureUrl: String(candidate.profilePictureUrl || "").trim(),
      constituencyId: candidate.constituencyId || null,
    };
  }).filter((c) => c.name);
}

function validatePresidentialCandidates(type, parties, candidates) {
  if (type !== "Presidential") return null;
  const normalized = normalizeCandidates(candidates, parties);
  const partyKeys = new Set(parties.map((p) => String(p.partyId || p.name).toLowerCase()));
  const assigned = new Set();
  let independentFound = false;
  for (const candidate of normalized) {
    const partyKey = candidate.partyId ? String(candidate.partyId).toLowerCase() : String(candidate.party || "").trim().toLowerCase();
    if (partyKey === "independent") { if (independentFound) return "Only one Independent presidential candidate can be added."; independentFound = true; continue; }
    if (!partyKeys.has(partyKey)) return `Presidential candidate ${candidate.name} is associated with a party that is not participating in this election.`;
    if (assigned.has(partyKey)) return `Each participating political party must have one presidential candidate. Duplicate candidate assignment found for ${candidate.party}.`;
    assigned.add(partyKey);
  }
  const missing = parties.filter((p) => !assigned.has(String(p.partyId || p.name).toLowerCase()));
  if (missing.length) return `Every participating political party must have a presidential candidate. Missing: ${missing.map((p) => p.name).join(", ")}.`;
  if (!independentFound) return "The Independent presidential candidate must also be added.";
  return null;
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
async function getManagementContext(req) { if (req.user?.platformRole === "super_admin") return { isSuperAdmin: true, organizationId: null, membership: null }; const membership = await OrganizationMembership.findOne({ userId: req.user._id, role: { $in: ORG_ELECTION_ROLES }, status: "approved" }).lean(); if (!membership) return null; const organization = await Organization.findOne({ _id: membership.organizationId, organizationStatus: "approved" }).lean(); if (!organization) return null; return { isSuperAdmin: false, organizationId: membership.organizationId, membership, organization }; }

exports.getElectionAccess = async (req, res) => { try { const access = await getElectionAccess(req.user); return res.json({ success: true, isSuperAdmin: access.isSuperAdmin, canViewOrganizationElections: access.canViewOrganizationElections, canViewPersonalElectionsAndResults: access.canViewPersonalElectionsAndResults, allowOrganizationElectionCreation: access.allowOrganizationElectionCreation, organizationIds: access.organizationIds, roles: access.memberships.map((m) => m.role), allowedRoles: ELECTION_VIEW_ROLES }); } catch (error) { return res.status(500).json({ success: false, message: "Unable to determine election access." }); } };

exports.getPoliticalParties = async (req, res) => { try { const organizations = await getApprovedPoliticalParties(); const parties = organizations.map((o) => ({ id: o._id, name: o.politicalPartyName || o.name, logoUrl: o.logo || "", registeredInSystem: true })); return res.json({ success: true, parties }); } catch (error) { return res.status(500).json({ success: false, message: error.message || "Unable to load system political parties." }); } };

exports.createPoliticalParty = async (req, res) => { try {
  if (req.user?.platformRole !== "super_admin") return res.status(403).json({ success: false, message: "Only the Super Admin can add a political party to the system." });
  const name = String(req.body?.name || "").trim(); const logo = String(req.body?.logoUrl || "").trim();
  if (!name) return res.status(400).json({ success: false, message: "Political party name is required." });
  if (name.toLowerCase() === "independent") return res.status(400).json({ success: false, message: "Independent is a presidential candidate status, not a political party organization." });
  if (logo.length > MAX_PARTY_LOGO_LENGTH) return res.status(400).json({ success: false, message: "Party logo is too large. Use an image up to 2 MB." });
  const exists = await Organization.findOne({ organizationType: "political_party", $or: [{ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }, { politicalPartyName: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }] }).lean();
  if (exists) return res.status(409).json({ success: false, message: "A political party with this name already exists in the system." });
  const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `party-${Date.now()}`;
  let slug = slugBase; let n = 2; while (await Organization.exists({ slug })) slug = `${slugBase}-${n++}`;
  const party = await Organization.create({ name, slug, organizationType: "political_party", politicalPartyName: name, isPermanentParty: false, isNewPartyRequest: false, organizationStatus: "approved", approvedAt: new Date(), approvedBy: req.user._id, logo: logo || null });
  await synchronizeAllElectionParties();
  return res.status(201).json({ success: true, party: { id: party._id, name, logoUrl: party.logo || "", registeredInSystem: true }, message: "Political party added to the PoliSync system." });
} catch (error) { return res.status(400).json({ success: false, message: error.message || "Unable to add political party." }); } };

exports.updatePoliticalPartyLogo = async (req, res) => { try { if (req.user?.platformRole !== "super_admin") return res.status(403).json({ success: false, message: "Only the Super Admin can update system political party logos." }); const logoUrl = String(req.body?.logoUrl || "").trim(); if (!logoUrl) return res.status(400).json({ success: false, message: "A party logo is required." }); if (logoUrl.length > MAX_PARTY_LOGO_LENGTH) return res.status(400).json({ success: false, message: "Party logo is too large. Use an image up to 2 MB." }); const party = await Organization.findOneAndUpdate({ _id: req.params.partyId, organizationType: "political_party", organizationStatus: "approved" }, { $set: { logo: logoUrl } }, { new: true }).select("_id name politicalPartyName logo").lean(); if (!party) return res.status(404).json({ success: false, message: "Approved system political party not found." }); return res.json({ success: true, party: { id: party._id, name: party.politicalPartyName || party.name, logoUrl: party.logo || "" }, message: "Political party logo updated." }); } catch (error) { return res.status(400).json({ success: false, message: error.message || "Unable to update party logo." }); } };

async function prepareElectionPayload(payload) { payload.parties = await normalizeSystemParties(payload.parties); payload.candidates = normalizeCandidates(payload.candidates, payload.parties); const candidateError = validatePresidentialCandidates(payload.type, payload.parties, payload.candidates); if (candidateError) throw new Error(candidateError); return payload; }

exports.createElection = async (req, res) => { try { const context = await getManagementContext(req); if (!context) return res.status(403).json({ success: false, message: "You are not authorized to manage elections." }); if (!context.isSuperAdmin) { const controls = await getPlatformElectionControls(); if (!controls.allowOrganizationElectionCreation) return res.status(403).json({ success: false, code: "ORGANIZATION_ELECTION_CREATION_DISABLED", message: "The Super Admin has disabled election creation for organizations." }); } const payload = cleanPayload(req.body); const validationError = validatePayload(payload); if (validationError) return res.status(400).json({ success: false, message: validationError }); try { await prepareElectionPayload(payload); } catch (error) { return res.status(400).json({ success: false, message: error.message }); } payload.createdBy = req.user._id; payload.managedBy = context.isSuperAdmin ? "platform" : "organization"; if (!context.isSuperAdmin) payload.organizationId = context.organizationId; const election = await Election.create(payload); let geographySync; try { geographySync = await synchronizeElectionGeography(election._id); } catch (syncError) { return res.status(201).json({ success: true, election, geographySync: { status: "failed", message: "Election was created, but its results geography could not be synchronized." } }); } return res.status(201).json({ success: true, election, geographySync: { status: "synchronized", source: "PoliSync official electoral geography", ...geographySync.counts, expected: geographySync.expected } }); } catch (error) { return res.status(500).json({ success: false, message: error.message }); } };

exports.getElections = async (req, res) => { try { await synchronizeAllElectionParties(); const access = await getElectionAccess(req.user); const elections = await Election.find(electionVisibilityFilter(access)).populate("organizationId", "name organizationType").sort({ startDateTime: -1, year: -1, createdAt: -1 }); return res.json({ success: true, elections }); } catch (error) { return res.status(500).json({ success: false, message: error.message }); } };
exports.getLiveElections = async (req, res) => { try { await synchronizeAllElectionParties(); const access = await getElectionAccess(req.user); const elections = await Election.find({ ...electionVisibilityFilter(access), status: "Active" }).populate("organizationId", "name organizationType").sort({ startDateTime: -1, year: -1, createdAt: -1 }); return res.json({ success: true, elections, count: elections.length }); } catch (error) { return res.status(500).json({ success: false, message: error.message }); } };
exports.getElectionHistory = async (req, res) => { try { await synchronizeAllElectionParties(); const access = await getElectionAccess(req.user); const elections = await Election.find({ ...electionVisibilityFilter(access), status: "Closed" }).populate("organizationId", "name organizationType").sort({ endDateTime: -1, year: -1, createdAt: -1 }); return res.json({ success: true, elections, count: elections.length }); } catch (error) { return res.status(500).json({ success: false, message: error.message }); } };
exports.getElection = async (req, res) => { try { const access = await getElectionAccess(req.user); const election = await Election.findById(req.params.id).populate("organizationId", "name organizationType"); if (!election) return res.status(404).json({ success: false, message: "Election not found." }); if (!canViewOrganizationElection(access, election)) return res.status(404).json({ success: false, message: "Election not found." }); return res.json({ success: true, election }); } catch (error) { return res.status(400).json({ success: false, message: "Invalid election ID." }); } };
exports.updateElection = async (req, res) => { try { const context = await getManagementContext(req); if (!context) return res.status(403).json({ success: false, message: "You are not authorized to manage elections." }); const election = await Election.findById(req.params.id); if (!election) return res.status(404).json({ success: false, message: "Election not found." }); if (!context.isSuperAdmin && String(election.organizationId || "") !== String(context.organizationId)) return res.status(403).json({ success: false, message: "You can only manage elections owned by your organization." }); const payload = cleanPayload(req.body); const validationError = validatePayload(payload, true); if (validationError) return res.status(400).json({ success: false, message: validationError }); if (payload.parties !== undefined || payload.candidates !== undefined || payload.type !== undefined) { payload.parties = await normalizeSystemParties(payload.parties !== undefined ? payload.parties : election.parties); payload.candidates = normalizeCandidates(payload.candidates !== undefined ? payload.candidates : election.candidates, payload.parties); const candidateError = validatePresidentialCandidates(payload.type !== undefined ? payload.type : election.type, payload.parties, payload.candidates); if (candidateError) return res.status(400).json({ success: false, message: candidateError }); } Object.assign(election, payload); await election.save(); return res.json({ success: true, election, message: "Election updated successfully." }); } catch (error) { return res.status(400).json({ success: false, message: error.message || "Unable to update election." }); } };
exports.deleteElection = async (req, res) => { try { const context = await getManagementContext(req); if (!context) return res.status(403).json({ success: false, message: "You are not authorized to manage elections." }); const election = await Election.findById(req.params.id); if (!election) return res.status(404).json({ success: false, message: "Election not found." }); if (!context.isSuperAdmin && String(election.organizationId || "") !== String(context.organizationId)) return res.status(403).json({ success: false, message: "You can only manage elections owned by your organization." }); if (election.status === "Active") return res.status(409).json({ success: false, message: "Active elections cannot be deleted. Close the election first." }); await election.deleteOne(); return res.json({ success: true, message: "Election deleted successfully." }); } catch (error) { return res.status(400).json({ success: false, message: error.message }); } };
