const mongoose = require("mongoose");
const User = require("../models/User");
const Organization = require("../models/Organization");
const OrganizationMembership = require("../models/OrganizationMembership");

const getUserId = (req) => req.user?._id || req.user?.id || req.auth?.id || null;
const isSuperAdmin = (user) => user?.platformRole === "super_admin" && user?.accountStatus === "approved";

const ALLOWED_TYPES = ["political_party", "observer_organization", "parliamentary_candidate", "presidential_candidate", "research"];
const ALLOWED_RESEARCH_TYPES = ["individual_researcher", "research_institution"];
const ADMIN_ROLES = [
  "national_party_admin",
  "regional_party_admin",
  "constituency_admin",
  "national_observer_admin",
  "regional_observer_admin",
  "constituency_observer_admin",
  "research_institution_admin",
];

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

    if (organizationType === "political_party" && !Organization.PERMANENT_POLITICAL_PARTIES.includes(name)) {
      return res.status(400).json({ success: false, message: "Select a recognized political party. New parties require Super Admin onboarding." });
    }

    if (organizationType === "research" && body.researchType && !ALLOWED_RESEARCH_TYPES.includes(body.researchType)) {
      return res.status(400).json({ success: false, message: "Invalid research organization type." });
    }

    const existing = await Organization.findOne({ slug });
    if (existing) return res.status(409).json({ success: false, message: "An organization with this identifier already exists or is already under review.", organizationId: existing._id });

    const organization = await Organization.create({
      name,
      slug,
      organizationType,
      researchType: organizationType === "research" ? (body.researchType || "individual_researcher") : null,
      politicalPartyName: organizationType === "political_party" ? name : null,
      isPermanentParty: organizationType === "political_party" && Organization.PERMANENT_POLITICAL_PARTIES.includes(name),
      isNewPartyRequest: organizationType === "political_party" && !Organization.PERMANENT_POLITICAL_PARTIES.includes(name),
      email: body.email ? String(body.email).trim().toLowerCase() : creator.email,
      phone: body.phone ? String(body.phone).trim() : creator.phone,
      website: body.website || null,
      logo: body.logo || null,
      description: body.description || "",
      organizationStatus: "pending",
      approvedAt: null,
      approvedBy: null,
    });

    return res.status(201).json({
      success: true,
      message: "Organization request submitted. Super Admin approval is required before the organization becomes active.",
      organization: { id: organization._id, name: organization.name, slug: organization.slug, organizationType: organization.organizationType, organizationStatus: organization.organizationStatus },
      nextStep: "After approval, the organization can onboard its National Admin through its invitation workflow.",
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
      { $group: {
        _id: "$organizationId",
        members: { $sum: 1 },
        admins: { $sum: { $cond: [{ $in: ["$role", ADMIN_ROLES] }, 1, 0] } },
      } },
    ]);

    const countMap = new Map(membershipCounts.map((item) => [String(item._id), item]));
    const enriched = organizations.map((organization) => {
      const counts = countMap.get(String(organization._id)) || { members: 0, admins: 0 };
      return {
        ...organization,
        memberCount: counts.members || 0,
        adminCount: counts.admins || 0,
      };
    });

    return res.json({
      success: true,
      organizations: enriched,
      totals: {
        organizations: enriched.length,
        active: enriched.filter((item) => ["approved"].includes(item.organizationStatus)).length,
        pending: enriched.filter((item) => item.organizationStatus === "pending").length,
        suspended: enriched.filter((item) => item.organizationStatus === "suspended").length,
        politicalParties: enriched.filter((item) => item.organizationType === "political_party").length,
        observers: enriched.filter((item) => item.organizationType === "observer_organization").length,
      },
    });
  } catch (error) {
    console.error("Get all organizations error:", error);
    return res.status(500).json({ success: false, message: error.message || "Unable to retrieve organizations." });
  }
};

exports.getCandidates = async (req, res) => {
  try {
    const admin = await requireSuperAdmin(req, res);
    if (!admin) return;

    const candidates = await Organization.find({
      organizationType: { $in: ["parliamentary_candidate", "presidential_candidate"] },
    }).sort({ createdAt: -1 }).lean();

    return res.json({
      success: true,
      candidates,
      totals: {
        total: candidates.length,
        parliamentary: candidates.filter((item) => item.organizationType === "parliamentary_candidate").length,
        presidential: candidates.filter((item) => item.organizationType === "presidential_candidate").length,
        verified: candidates.filter((item) => item.candidate?.registrationStatus === "verified").length,
        pending: candidates.filter((item) => item.candidate?.registrationStatus === "pending").length,
      },
    });
  } catch (error) {
    console.error("Get candidates error:", error);
    return res.status(500).json({ success: false, message: error.message || "Unable to retrieve candidates." });
  }
};

exports.getPendingOrganizations = async (req, res) => {
  try {
    const admin = await requireSuperAdmin(req, res);
    if (!admin) return;
    const organizations = await Organization.find({ organizationStatus: "pending" }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, organizations });
  } catch (error) { return res.status(500).json({ success: false, message: error.message || "Unable to retrieve organization requests." }); }
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
  } catch (error) { return res.status(500).json({ success: false, message: error.message || "Unable to approve organization." }); }
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
    return res.json({ success: true, message: "Organization request rejected.", organization: { id: organization._id, name: organization.name, organizationStatus: organization.organizationStatus } });
  } catch (error) { return res.status(500).json({ success: false, message: error.message || "Unable to reject organization." }); }
};
