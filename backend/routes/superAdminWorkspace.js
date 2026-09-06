const express = require("express");
const mongoose = require("mongoose");
const Organization = require("../models/Organization");
const OrganizationMembership = require("../models/OrganizationMembership");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

const ORGANIZATION_WORKSPACE_TYPES = [
  "political_party",
  "observer_organization",
  "parliamentary_candidate",
  "presidential_candidate",
  "research",
];

function isValidId(value) {
  return mongoose.Types.ObjectId.isValid(String(value || ""));
}

async function requireApprovedSuperAdmin(req, res, next) {
  if (!req.user || req.user.platformRole !== "super_admin") {
    return res.status(403).json({ success: false, message: "Only the Super Admin can enter organization workspaces." });
  }
  if (req.user.accountStatus && req.user.accountStatus !== "approved") {
    return res.status(403).json({ success: false, message: "Super Admin account approval is required." });
  }
  return next();
}

router.use(protect, authorize("super_admin"), requireApprovedSuperAdmin);

router.get("/catalog", async (req, res) => {
  try {
    const organizations = await Organization.find({ organizationType: { $in: ORGANIZATION_WORKSPACE_TYPES } })
      .select("name slug organizationType organizationStatus politicalPartyName researchType candidate")
      .sort({ organizationType: 1, name: 1 })
      .lean();

    const counts = organizations.length ? await OrganizationMembership.aggregate([
      { $match: { organizationId: { $in: organizations.map((item) => item._id) } } },
      { $group: { _id: "$organizationId", total: { $sum: 1 }, approved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } } } },
    ]) : [];
    const countMap = new Map(counts.map((item) => [String(item._id), item]));

    const catalog = organizations.map((organization) => ({
      id: String(organization._id),
      name: organization.name,
      slug: organization.slug,
      organizationType: organization.organizationType,
      organizationStatus: organization.organizationStatus,
      politicalPartyName: organization.politicalPartyName || null,
      researchType: organization.researchType || null,
      memberCount: countMap.get(String(organization._id))?.total || 0,
      approvedMemberCount: countMap.get(String(organization._id))?.approved || 0,
      canOpen: true,
      mode: "organization",
    }));

    res.json({
      success: true,
      catalog,
      templates: ORGANIZATION_WORKSPACE_TYPES.map((organizationType) => ({
        organizationType,
        name: `Super Admin Test ${organizationType.replace(/_/g, " ")}`,
        canOpenWithoutOrganization: true,
        mode: "sandbox",
      })),
    });
  } catch (error) {
    console.error("Super Admin workspace catalog error:", error);
    res.status(500).json({ success: false, message: "Unable to load organization workspace catalog." });
  }
});

router.get("/session/:workspaceType", async (req, res) => {
  try {
    const { workspaceType } = req.params;
    if (!ORGANIZATION_WORKSPACE_TYPES.includes(workspaceType)) {
      return res.status(400).json({ success: false, message: "Unsupported organization workspace type." });
    }

    const requestedOrganizationId = String(req.query.organizationId || "").trim();
    let organization = null;
    let mode = "sandbox";

    if (requestedOrganizationId) {
      if (!isValidId(requestedOrganizationId)) {
        return res.status(400).json({ success: false, message: "Invalid organization ID." });
      }
      organization = await Organization.findOne({ _id: requestedOrganizationId, organizationType: workspaceType })
        .select("name slug organizationType organizationStatus politicalPartyName researchType candidate")
        .lean();
      if (!organization) return res.status(404).json({ success: false, message: "Organization not found for this workspace." });
      mode = "organization";
    }

    res.json({
      success: true,
      mode,
      workspaceType,
      organization: organization || {
        _id: null,
        name: `Super Admin Test ${workspaceType.replace(/_/g, " ")}`,
        slug: `__super-admin-sandbox-${workspaceType}`,
        organizationType: workspaceType,
        organizationStatus: "sandbox",
        politicalPartyName: null,
        researchType: workspaceType === "research" ? "research_institution" : null,
        candidate: null,
      },
      actor: { id: String(req.user._id), role: "super_admin", isWorkspacePreview: true },
      permissions: {
        canView: true,
        canCreate: true,
        canEdit: true,
        canTest: true,
        canRepair: true,
        canManageMemberships: true,
        canSubmitResultsForTesting: false,
      },
    });
  } catch (error) {
    console.error("Super Admin workspace session error:", error);
    res.status(500).json({ success: false, message: "Unable to open the requested organization workspace." });
  }
});

module.exports = router;
