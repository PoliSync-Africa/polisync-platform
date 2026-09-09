const mongoose = require("mongoose");
const User = require("../models/User");
const Organization = require("../models/Organization");
const OrganizationMembership = require("../models/OrganizationMembership");
const Candidate = require("../models/Candidate");
const Result = require("../models/Result");
const { synchronizeAllElectionParties } = require("../services/electionGeographySyncService");
const { approveCandidate, listPartyPendingCandidates } = require("../services/candidateApprovalService");

const getAuthenticatedUserId = (req) => req.user?._id || req.user?.id || req.auth?.id || null;

async function getPartyContext(userId) {
  const memberships = await OrganizationMembership.find({ userId, status: "approved" }).lean();
  const membership = memberships.find((m) => m.organizationType === "political_party" || ["national_party_admin", "regional_party_admin", "constituency_admin", "polling_station_agent"].includes(m.role));
  if (!membership) return null;
  const organization = await Organization.findById(membership.organizationId).lean();
  if (!organization || organization.organizationType !== "political_party" || organization.organizationStatus !== "approved") return null;
  return { organization, membership };
}

exports.createPoliticalParty = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return res.status(401).json({ success: false, message: "Authentication required." });
    const creator = await User.findById(userId);
    if (!creator || creator.platformRole !== "user" || creator.accountStatus !== "approved") return res.status(403).json({ success: false, message: "An approved personal account is required to request a political party organization." });
    const { name, politicalPartyName, email, phone, website, logo, description } = req.body || {};
    const normalizedName = String(politicalPartyName || name || "").trim();
    if (!normalizedName || !Organization.PERMANENT_POLITICAL_PARTIES.includes(normalizedName)) return res.status(400).json({ success: false, message: "Select an existing political party from the synchronized PoliSync system registry." });
    const systemParty = await Organization.findOne({ organizationType: "political_party", $or: [{ name: normalizedName }, { politicalPartyName: normalizedName }] });
    if (!systemParty) return res.status(400).json({ success: false, message: "The selected political party is not available in the synchronized system registry." });
    if (systemParty.organizationStatus !== "approved") return res.status(400).json({ success: false, message: "The selected system political party is not currently approved." });
    if (systemParty.partyAdminRequestStatus === "pending") return res.status(409).json({ success: false, message: "A National Party Admin request for this party is already awaiting Super Admin approval." });
    const approvedAdmin = await OrganizationMembership.exists({ organizationId: systemParty._id, role: "national_party_admin", status: "approved" });
    if (approvedAdmin) return res.status(409).json({ success: false, message: "This political party already has an approved National Party Admin." });
    systemParty.partyAdminRequestUserId = userId;
    systemParty.partyAdminRequestStatus = "pending";
    systemParty.partyAdminRequestElectionIds = [];
    systemParty.partyAdminRequestAt = new Date();
    systemParty.creatorUserId = userId;
    if (email) systemParty.email = String(email).trim().toLowerCase();
    if (phone) systemParty.phone = String(phone).trim();
    if (website) systemParty.website = String(website).trim();
    if (logo) systemParty.logo = String(logo).trim();
    if (description) systemParty.description = String(description).trim();
    await systemParty.save();
    await OrganizationMembership.findOneAndUpdate({ userId, organizationId: systemParty._id, role: "national_party_admin" }, { $set: { level: "national", status: "pending", joinedAt: new Date(), notes: "Party creator requesting National Party Admin access; awaiting Super Admin approval." } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return res.status(201).json({ success: true, message: "Existing system political party selected successfully. The party remains a permanent PoliSync organization; National Party Admin access is awaiting Super Admin approval.", organization: { id: systemParty._id, name: systemParty.name, slug: systemParty.slug, organizationType: systemParty.organizationType, organizationStatus: systemParty.organizationStatus, partyAdminRequestStatus: systemParty.partyAdminRequestStatus } });
  } catch (error) { console.error("Create political party request error:", error); return res.status(500).json({ success: false, message: error.message || "Unable to submit political party request." }); }
};

exports.getMyPartyDashboard = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req); if (!userId) return res.status(401).json({ success: false, message: "Authentication required." });
    const context = await getPartyContext(userId); if (!context) return res.status(403).json({ success: false, message: "Your account is not attached to an approved political party organization." });
    const { organization, membership } = context; const organizationId = organization._id;
    const [members, candidateCount, resultCount] = await Promise.all([OrganizationMembership.find({ organizationId, status: "approved" }).select("regionId constituencyId pollingStationId").lean(), Candidate.countDocuments({ organizationId }), Result.countDocuments({ organizationId })]);
    const regions = new Set(members.map(m => String(m.regionId || "")).filter(Boolean)).size;
    const constituencies = new Set(members.map(m => String(m.constituencyId || "")).filter(Boolean)).size;
    const pollingStations = new Set(members.map(m => String(m.pollingStationId || "")).filter(Boolean)).size;
    const pendingCandidates = await Organization.countDocuments({ organizationType: { $in: ["presidential_candidate", "parliamentary_candidate"] }, organizationStatus: "pending", candidateParty: { $in: [organization.name, organization.politicalPartyName] } });
    return res.json({
      success: true,
      organization: {
        id: organization._id,
        name: organization.name,
        logo: organization.logo || null,
        politicalPartyName: organization.politicalPartyName || organization.name,
      },
      membership: {
        role: membership.role,
        level: membership.level || "national",
      },
      metrics: { members: members.length, regions, constituencies, pollingStations, candidates: candidateCount, pendingCandidates, resultsSubmitted: resultCount },
    });
  } catch (error) { console.error("Party dashboard error:", error); return res.status(500).json({ success: false, message: error.message || "Unable to load political party dashboard." }); }
};

exports.updateMyPartyLogo = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req); if (!userId) return res.status(401).json({ success: false, message: "Authentication required." });
    const context = await getPartyContext(userId);
    if (!context || context.membership.role !== "national_party_admin") return res.status(403).json({ success: false, message: "Only the approved National Party Admin can update the party logo." });
    const logo = String(req.body?.logo || "").trim();
    if (!logo) return res.status(400).json({ success: false, message: "A party logo is required." });
    if (logo.length > 2 * 1024 * 1024) return res.status(400).json({ success: false, message: "Party logo is too large. Use an image up to 2 MB." });
    const organization = await Organization.findOneAndUpdate({ _id: context.organization._id, organizationType: "political_party", organizationStatus: "approved" }, { $set: { logo } }, { new: true }).select("_id name politicalPartyName logo").lean();
    if (!organization) return res.status(404).json({ success: false, message: "Political party organization not found." });
    await synchronizeAllElectionParties();
    return res.json({ success: true, organization: { id: organization._id, name: organization.name, politicalPartyName: organization.politicalPartyName || organization.name, logo: organization.logo }, message: "Party logo updated and synchronized across elections." });
  } catch (error) { return res.status(400).json({ success: false, message: error.message || "Unable to update party logo." }); }
};

exports.getPendingCandidateApprovals = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req); if (!userId) return res.status(401).json({ success: false, message: "Authentication required." });
    const context = await getPartyContext(userId);
    if (!context || context.membership.role !== "national_party_admin") return res.status(403).json({ success: false, message: "Only the political party's National Admin can review candidate registrations." });
    const candidates = await listPartyPendingCandidates(context.organization._id);
    return res.json({ success: true, party: { id: context.organization._id, name: context.organization.politicalPartyName || context.organization.name, logo: context.organization.logo || null }, candidates });
  } catch (error) { return res.status(400).json({ success: false, message: error.message || "Unable to load pending candidate approvals." }); }
};

exports.approveMyPartyCandidate = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req); if (!userId) return res.status(401).json({ success: false, message: "Authentication required." });
    const actor = await User.findById(userId); const context = await getPartyContext(userId);
    if (!context || context.membership.role !== "national_party_admin") return res.status(403).json({ success: false, message: "Only the political party's National Admin can approve candidates." });
    if (!mongoose.Types.ObjectId.isValid(req.params.candidateId)) return res.status(400).json({ success: false, message: "Invalid candidate registration ID." });
    const candidate = await Organization.findOne({ _id: req.params.candidateId, organizationType: { $in: ["presidential_candidate", "parliamentary_candidate"] } }).lean();
    if (!candidate) return res.status(404).json({ success: false, message: "Candidate registration not found." });
    const partyName = String(context.organization.politicalPartyName || context.organization.name).trim().toLowerCase();
    if (String(candidate.candidateParty || "").trim().toLowerCase() !== partyName) return res.status(403).json({ success: false, message: "This candidate is not registered for your political party." });
    const result = await approveCandidate({ candidateId: candidate._id, actor });
    return res.json({ success: true, message: `Candidate approved and synchronized with ${result.election.name}.`, candidate: result.candidate, election: { id: result.election._id, name: result.election.name, type: result.election.type } });
  } catch (error) { return res.status(400).json({ success: false, message: error.message || "Unable to approve candidate." }); }
};