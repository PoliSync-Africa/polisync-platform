const mongoose = require("mongoose");
const User = require("../models/User");
const Organization = require("../models/Organization");
const { approveCandidate } = require("../services/candidateApprovalService");

const userId = (req) => req.user?._id || req.user?.id || req.auth?.id || null;
const isSuperAdmin = (u) => u?.platformRole === "super_admin" && u?.accountStatus === "approved";

exports.listPendingCandidates = async (req, res) => {
  try {
    const actor = await User.findById(userId(req));
    if (!isSuperAdmin(actor)) return res.status(403).json({ success: false, message: "Only the Super Admin can view the platform candidate approval queue." });
    const candidates = await Organization.find({ organizationType: { $in: ["presidential_candidate", "parliamentary_candidate"] }, organizationStatus: "pending", "candidate.registrationStatus": "pending" }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, candidates });
  } catch (error) { return res.status(500).json({ success: false, message: error.message || "Unable to load candidate approvals." }); }
};

exports.approveCandidateBySuperAdmin = async (req, res) => {
  try {
    const actor = await User.findById(userId(req));
    if (!isSuperAdmin(actor)) return res.status(403).json({ success: false, message: "Only the Super Admin can approve a candidate when no National Party Admin exists." });
    if (!mongoose.Types.ObjectId.isValid(req.params.candidateId)) return res.status(400).json({ success: false, message: "Invalid candidate registration ID." });
    const candidate = await Organization.findOne({ _id: req.params.candidateId, organizationType: { $in: ["presidential_candidate", "parliamentary_candidate"] } }).lean();
    if (!candidate) return res.status(404).json({ success: false, message: "Candidate registration not found." });
    if (candidate.candidateIsIndependent || String(candidate.candidateParty || "").trim().toLowerCase() === "independent") {
      const result = await approveCandidate({ candidateId: candidate._id, actor });
      return res.json({ success: true, message: `Independent candidate approved and synchronized with ${result.election.name}.`, candidate: result.candidate, election: { id: result.election._id, name: result.election.name, type: result.election.type } });
    }
    const party = await Organization.findOne({ organizationType: "political_party", organizationStatus: "approved", $or: [{ name: candidate.candidateParty }, { politicalPartyName: candidate.candidateParty }] }).select("_id name politicalPartyName").lean();
    if (!party) return res.status(400).json({ success: false, message: "The candidate's approved political party could not be found." });
    const hasAdmin = await Organization.exists({ _id: party._id }) && await requireNationalAdmin(party._id);
    if (hasAdmin) return res.status(409).json({ success: false, code: "PARTY_ADMIN_REQUIRED", message: "This party has an approved National Party Admin. The National Admin must approve this candidate." });
    const result = await approveCandidate({ candidateId: candidate._id, actor });
    return res.json({ success: true, message: `Candidate approved by Super Admin and synchronized with ${result.election.name}.`, candidate: result.candidate, election: { id: result.election._id, name: result.election.name, type: result.election.type } });
  } catch (error) { return res.status(400).json({ success: false, message: error.message || "Unable to approve candidate." }); }
};

async function requireNationalAdmin(partyId) {
  const OrganizationMembership = require("../models/OrganizationMembership");
  return Boolean(await OrganizationMembership.exists({ organizationId: partyId, role: "national_party_admin", status: "approved" }));
}
