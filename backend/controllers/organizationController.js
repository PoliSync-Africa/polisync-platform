const mongoose = require("mongoose");
const User = require("../models/User");
const Organization = require("../models/Organization");
const OrganizationMembership = require("../models/OrganizationMembership");
const Region = require("../models/Region");
const Constituency = require("../models/Constituency");
const Election = require("../models/Election");

const getUserId = (req) => req.user?._id || req.user?.id || req.auth?.id || null;
const isSuperAdmin = (user) => user?.platformRole === "super_admin" && user?.accountStatus === "approved";
const MAX_LOGO_LENGTH = 2 * 1024 * 1024;
const MAX_CANDIDATE_PHOTO_LENGTH = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["political_party", "observer_organization", "parliamentary_candidate", "presidential_candidate", "research"];
const ALLOWED_RESEARCH_TYPES = ["individual_researcher", "research_institution"];
const ADMIN_ROLES = ["national_party_admin", "regional_party_admin", "constituency_admin", "national_observer_admin", "regional_observer_admin", "constituency_observer_admin", "research_institution_admin"];

async function requireSuperAdmin(req, res) {
  const admin = await User.findById(getUserId(req));
  if (!isSuperAdmin(admin)) {
    res.status(403).json({ success: false, message: "Only the Super Admin can manage this resource." });
    return null;
  }
  return admin;
}

exports.createOrganizationRequest = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return res.status(401).json({ success: false, message: "Authentication required." });
    const creator = await User.findById(userId);
    if (!creator || creator.platformRole !== "user" || creator.accountStatus !== "approved") return res.status(403).json({ success: false, message: "An approved personal account is required to request an organization." });

    const body = req.body || {};
    const organizationType = String(body.organizationType || "").trim();
    if (!ALLOWED_TYPES.includes(organizationType)) return res.status(400).json({ success: false, message: "Invalid organization type." });
    const name = String(body.name || "").trim();
    if (!name) return res.status(400).json({ success: false, message: "Organization name is required." });
    const slug = String(body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-")).replace(/^-+|-+$/g, "").toLowerCase();
    if (!slug) return res.status(400).json({ success: false, message: "A valid organization name is required." });
    if (organizationType === "political_party" && !Organization.PERMANENT_POLITICAL_PARTIES.includes(name)) return res.status(400).json({ success: false, message: "Select a recognized political party. New parties require Super Admin onboarding." });
    if (organizationType === "research" && body.researchType && !ALLOWED_RESEARCH_TYPES.includes(body.researchType)) return res.status(400).json({ success: false, message: "Invalid research organization type." });

    const isCandidate = ["presidential_candidate", "parliamentary_candidate"].includes(organizationType);
    let candidateParty = null;
    let candidateIsIndependent = false;
    let candidateRegion = null;
    let candidateConstituency = null;
    let candidatePartyLogo = "";
    let selectedElection = null;

    if (isCandidate) {
      if (!body.electionId || !mongoose.Types.ObjectId.isValid(body.electionId)) return res.status(400).json({ success: false, message: "Select a valid election for this candidate registration." });
      selectedElection = await Election.findOne({ _id: body.electionId, status: "Active" }).lean();
      if (!selectedElection) return res.status(400).json({ success: false, message: "Candidates can only register for an active election." });
      const expectedType = organizationType === "presidential_candidate" ? "Presidential" : "Parliamentary";
      if (selectedElection.type !== expectedType) return res.status(400).json({ success: false, message: `Select an active ${expectedType.toLowerCase()} election.` });

      candidateParty = String(body.candidateParty || "").trim();
      if (!candidateParty) return res.status(400).json({ success: false, message: "Select a political party from the PoliSync system registry." });
      candidateIsIndependent = candidateParty.toLowerCase() === "independent";

      // Presidential candidates are registered directly only as Independent.
      // Political-party presidential candidates are created and maintained
      // inside their own political-party organization dashboard.
      if (organizationType === "presidential_candidate" && !candidateIsIndependent) {
        return res.status(403).json({ success: false, code: "PARTY_CANDIDATE_USE_PARTY_DASHBOARD", message: "Presidential candidates for political parties must be created and maintained inside the respective political party dashboard. Direct presidential registration is only available for Independent candidates." });
      }

      if (!candidateIsIndependent) {
        const party = await Organization.findOne({ organizationType: "political_party", organizationStatus: "approved", $or: [{ name: candidateParty }, { politicalPartyName: candidateParty }] }).select("_id name politicalPartyName logo").lean();
        if (!party) return res.status(400).json({ success: false, message: "Select a political party from the approved PoliSync system registry." });
        candidateParty = party.politicalPartyName || party.name;
        candidatePartyLogo = party.logo || "";
        const electionParty = (selectedElection.parties || []).find((p) => String(p.partyId || "") === String(party._id) || String(p.name || "").toLowerCase() === String(candidateParty).toLowerCase());
        if ((selectedElection.parties || []).length && !electionParty) return res.status(400).json({ success: false, message: "The selected political party is not participating in this election." });
      } else {
        candidateParty = "Independent";
        if ((selectedElection.parties || []).length && !selectedElection.parties.some((p) => String(p.name || "").toLowerCase() === "independent")) return res.status(400).json({ success: false, message: "Independent is not participating in this election." });
      }

      if (organizationType === "parliamentary_candidate") {
        if (!body.region || !body.constituency) return res.status(400).json({ success: false, message: "Parliamentary candidates must select a region and constituency." });
        const regionQuery = mongoose.Types.ObjectId.isValid(body.region) ? { _id: body.region, isActive: true } : { name: String(body.region).trim(), isActive: true };
        const selectedRegion = await Region.findOne(regionQuery).select("_id name").lean();
        if (!selectedRegion) return res.status(400).json({ success: false, message: "Invalid electoral region." });
        const constituencyQuery = mongoose.Types.ObjectId.isValid(body.constituency) ? { _id: body.constituency, regionId: selectedRegion._id, isActive: true } : { name: String(body.constituency).trim(), regionId: selectedRegion._id, isActive: true };
        const selectedConstituency = await Constituency.findOne(constituencyQuery).select("_id name regionId").lean();
        if (!selectedConstituency) return res.status(400).json({ success: false, message: "Invalid constituency for the selected region." });
        candidateRegion = selectedRegion.name;
        candidateConstituency = selectedConstituency.name;
      }
    }

    const logo = String(body.logo || "").trim();
    if (logo.length > MAX_LOGO_LENGTH) return res.status(400).json({ success: false, message: "Organization logo is too large. Use an image up to 2 MB." });
    const candidatePhoto = isCandidate ? String(body.profilePhoto || "").trim() : "";
    if (isCandidate && !candidatePhoto) return res.status(400).json({ success: false, message: "Candidate profile photo is required." });
    if (candidatePhoto.length > MAX_CANDIDATE_PHOTO_LENGTH) return res.status(400).json({ success: false, message: "Candidate photo is too large. Use an image up to 2 MB." });

    const organization = await Organization.create({
      name,
      slug,
      organizationType,
      researchType: organizationType === "research" ? (body.researchType || "individual_researcher") : null,
      politicalPartyName: organizationType === "political_party" ? name : null,
      isPermanentParty: organizationType === "political_party" && Organization.PERMANENT_POLITICAL_PARTIES.includes(name),
      isNewPartyRequest: false,
      candidate: isCandidate ? { userId, fullName: name, profilePhoto: candidatePhoto, registrationSource: "polisync_user", registrationStatus: "pending", biography: String(body.description || "").trim() } : undefined,
      candidateParty: isCandidate ? candidateParty : null,
      candidateIsIndependent: isCandidate ? candidateIsIndependent : false,
      electionId: isCandidate ? selectedElection._id : null,
      region: candidateRegion,
      constituency: candidateConstituency,
      email: body.email ? String(body.email).trim().toLowerCase() : creator.email,
      phone: body.phone ? String(body.phone).trim() : creator.phone,
      website: body.website || null,
      logo: logo || null,
      description: body.description || "",
      organizationStatus: "pending",
      approvedAt: null,
      approvedBy: null,
    });

    return res.status(201).json({
      success: true,
      message: isCandidate ? "Candidate registration submitted for the selected election. Your photo and candidate details are awaiting the required approval." : "Organization request submitted. Super Admin approval is required before the organization becomes active.",
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
        organizationType: organization.organizationType,
        organizationStatus: organization.organizationStatus,
        candidateParty: organization.candidateParty,
        candidateIsIndependent: organization.candidateIsIndependent,
        electionId: organization.electionId,
        electionName: selectedElection?.name || null,
        candidatePartyLogo,
        region: organization.region,
        constituency: organization.constituency,
      },
      nextStep: "Candidate approval is required before publication in the election.",
    });
  } catch (error) {
    console.error("Create organization request error:", error);
    return res.status(500).json({ success: false, message: error.message || "Unable to submit organization request." });
  }
};

exports.getAllOrganizations = async (req, res) => {
  try {
    const admin = await requireSuperAdmin(req, res);
    if (!admin) return;
    const organizations = await Organization.find({}).sort({ createdAt: -1 }).lean();
    const organizationIds = organizations.map((item) => item._id);
    const membershipCounts = await OrganizationMembership.aggregate([
      { $match: { organizationId: { $in: organizationIds }, status: "approved" } },
      { $group: { _id: "$organizationId", members: { $sum: 1 }, admins: { $sum: { $cond: [{ $in: ["$role", ADMIN_ROLES] }, 1, 0] } } } },
    ]);
    const countMap = new Map(membershipCounts.map((item) => [String(item._id), item]));
    const enriched = organizations.map((o) => ({ ...o, memberCount: (countMap.get(String(o._id)) || {}).members || 0, adminCount: (countMap.get(String(o._id)) || {}).admins || 0 }));
    return res.json({ success: true, organizations: enriched, totals: { organizations: enriched.length, active: enriched.filter((i) => i.organizationStatus === "approved").length, pending: enriched.filter((i) => i.organizationStatus === "pending").length, suspended: enriched.filter((i) => i.organizationStatus === "suspended").length, politicalParties: enriched.filter((i) => i.organizationType === "political_party").length, observers: enriched.filter((i) => i.organizationType === "observer_organization").length } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to retrieve organizations." });
  }
};

exports.updateOrganizationLogo = async (req, res) => {
  try {
    const admin = await requireSuperAdmin(req, res);
    if (!admin) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.organizationId)) return res.status(400).json({ success: false, message: "Invalid organization ID." });
    const logo = String(req.body?.logo || "").trim();
    if (!logo) return res.status(400).json({ success: false, message: "A logo is required." });
    if (logo.length > MAX_LOGO_LENGTH) return res.status(400).json({ success: false, message: "Organization logo is too large. Use an image up to 2 MB." });
    const organization = await Organization.findByIdAndUpdate(req.params.organizationId, { $set: { logo } }, { new: true }).select("_id name organizationType politicalPartyName logo").lean();
    if (!organization) return res.status(404).json({ success: false, message: "Organization not found." });
    return res.json({ success: true, organization, message: "Organization logo updated successfully." });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || "Unable to update organization logo." });
  }
};

exports.getCandidates = async (req, res) => {
  try {
    const admin = await requireSuperAdmin(req, res);
    if (!admin) return;
    const candidates = await Organization.find({ organizationType: { $in: ["parliamentary_candidate", "presidential_candidate"] } }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, candidates, totals: { total: candidates.length, parliamentary: candidates.filter((i) => i.organizationType === "parliamentary_candidate").length, presidential: candidates.filter((i) => i.organizationType === "presidential_candidate").length, verified: candidates.filter((i) => i.candidate?.registrationStatus === "verified").length, pending: candidates.filter((i) => i.candidate?.registrationStatus === "pending").length } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to retrieve candidates." });
  }
};

exports.getPendingOrganizations = async (req, res) => {
  try {
    const admin = await requireSuperAdmin(req, res);
    if (!admin) return;
    const organizations = await Organization.find({ organizationStatus: "pending" }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, organizations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to retrieve organization requests." });
  }
};

exports.approveOrganization = async (req, res) => {
  try {
    const admin = await requireSuperAdmin(req, res);
    if (!admin) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.organizationId)) return res.status(400).json({ success: false, message: "Invalid organization ID." });
    const organization = await Organization.findById(req.params.organizationId);
    if (!organization) return res.status(404).json({ success: false, message: "Organization not found." });
    if (organization.organizationStatus !== "pending") return res.status(409).json({ success: false, message: "This organization is not pending approval." });
    organization.organizationStatus = "approved";
    organization.approvedAt = new Date();
    organization.approvedBy = admin._id;
    await organization.save();
    return res.json({ success: true, message: "Organization approved successfully. Its National Admin can now be onboarded by invitation.", organization: { id: organization._id, name: organization.name, organizationStatus: organization.organizationStatus } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to approve organization." });
  }
};

exports.rejectOrganization = async (req, res) => {
  try {
    const admin = await requireSuperAdmin(req, res);
    if (!admin) return;
    if (!mongoose.Types.ObjectId.isValid(req.params.organizationId)) return res.status(400).json({ success: false, message: "Invalid organization ID." });
    const organization = await Organization.findById(req.params.organizationId);
    if (!organization) return res.status(404).json({ success: false, message: "Organization not found." });
    organization.organizationStatus = "rejected";
    await organization.save();
    return res.json({ success: true, message: "Organization request rejected." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to reject organization." });
  }
};
