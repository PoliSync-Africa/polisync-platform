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
    const { name, slug, politicalPartyName, email, phone, website, logo, description } = req.body || {};
    const normalizedName = String(name || politicalPartyName || "").trim();
    const normalizedSlug = String(slug || normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, "-")).trim().replace(/^-+|-+$/g, "").toLowerCase();
    if (!normalizedName || !normalizedSlug) return res.status(400).json({ success: false, message: "Political party name is required." });
    if (!Organization.PERMANENT_POLITICAL_PARTIES.includes(normalizedName)) return res.status(400).json({ success: false, message: "Select a recognized political party. New parties require Super Admin onboarding." });
    const existing = await Organization.findOne({ $or: [{ slug: normalizedSlug }, { organizationType: "political_party", politicalPartyName: normalizedName }] });
    if (existing) return res.status(409).json({ success: false, message: "This political party already exists or is already under review in PoliSync Africa.", organizationId: existing._id });
    const organization = await Organization.create({ name: normalizedName, slug: normalizedSlug, organizationType: "political_party", politicalPartyName: normalizedName, isPermanentParty: true, isNewPartyRequest: false, email: email || creator.email, phone: phone || creator.phone, website: website || null, logo: logo || null, description: description || "", organizationStatus: "pending", approvedAt: null, approvedBy: null });
    return res.status(201).json({ success: true, message: "Political party organization request submitted. Super Admin approval is required before activation.", organization: { id: organization._id, name: organization.name, slug: organization.slug, organizationType: organization.organizationType, organizationStatus: organization.organizationStatus } });
  } catch (error) { console.error("Create political party request error:", error); return res.status(500).json({ success: false, message: error.message || "Unable to submit political party request." }); }
};

exports.getMyPartyDashboard = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req); if (!userId) return res.status(401).json({ success: false, message: "Authentication required." });
    const context = await getPartyContext(userId); if (!context) return res.status(403).json({ success: false, message: "Your account is not attached to an approved political party organization." });
    const { organization } = context; const organizationId = organization._id;
    const [members, candidateCount, resultCount] = await Promise.all([OrganizationMembership.find({ organizationId, status: "approved" }).select("regionId constituencyId pollingStationId").lean(), Candidate.countDocuments({ organizationId }), Result.countDocuments({ organizationId })]);
    const regions = new Set(members.map(m => String(m.regionId || "")).filter(Boolean)).size;
    const constituencies = new Set(members.map(m => String(m.constituencyId || "")).filter(Boolean)).size;
    const pollingStations = new Set(members.map(m => String(m.pollingStationId || "")).filter(Boolean)).size;
    const pendingCandidates = await Organization.countDocuments({ organizationType: { $in: ["presidential_candidate", "parliamentary_candidate"] }, organizationStatus: "pending", candidateParty: { $in: [organization.name, organization.politicalPartyName] } });
    return res.json({ success: true, organization: { id: organization._id, name: organization.name, logo: organization.logo || null, politicalPartyName: organization.politicalPartyName || organization.name }, metrics: { members: members.length, regions, constituencies, pollingStations, candidates: candidateCount, pendingCandidates, resultsSubmitted: resultCount } });
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
    if (candidate.candidateIsIndependent || String(candidate.candidateParty || "").trim().toLowerCase() === "independent") return res.status(403).json({ success: false, message: "Independent candidates are approved by the Super Admin." });
    const partyName = String(context.organization.politicalPartyName || context.organization.name).trim().toLowerCase();
    if (String(candidate.candidateParty || "").trim().toLowerCase() !== partyName) return res.status(403).json({ success: false, message: "This candidate is not registered for your political party." });
    const result = await approveCandidate({ candidateId: candidate._id, actor });
    return res.json({ success: true, message: `Candidate approved and synchronized with ${result.election.name}.`, candidate: result.candidate, election: { id: result.election._id, name: result.election.name, type: result.election.type } });
  } catch (error) { return res.status(400).json({ success: false, message: error.message || "Unable to approve candidate." }); }
};
