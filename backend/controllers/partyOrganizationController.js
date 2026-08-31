const mongoose = require("mongoose");
const User = require("../models/User");
const Organization = require("../models/Organization");

const getAuthenticatedUserId = (req) => req.user?._id || req.user?.id || req.auth?.id || null;

// Political-party organization creation is a REQUEST, not an automatic approval.
// The personal account remains separate from the organization.
exports.createPoliticalParty = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return res.status(401).json({ success: false, message: "Authentication required." });

    const creator = await User.findById(userId);
    if (!creator || creator.platformRole !== "user" || creator.accountStatus !== "approved") {
      return res.status(403).json({ success: false, message: "An approved personal account is required to request a political party organization." });
    }

    const { name, slug, politicalPartyName, email, phone, website, logo, description } = req.body || {};
    const normalizedName = String(name || politicalPartyName || "").trim();
    const normalizedSlug = String(slug || normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, "-")).trim().replace(/^-+|-+$/g, "").toLowerCase();

    if (!normalizedName || !normalizedSlug) return res.status(400).json({ success: false, message: "Political party name is required." });
    if (!Organization.PERMANENT_POLITICAL_PARTIES.includes(normalizedName)) return res.status(400).json({ success: false, message: "Select a recognized political party. New parties require Super Admin onboarding." });

    const existing = await Organization.findOne({ $or: [{ slug: normalizedSlug }, { organizationType: "political_party", politicalPartyName: normalizedName }] });
    if (existing) return res.status(409).json({ success: false, message: "This political party already exists or is already under review in PoliSync Africa.", organizationId: existing._id });

    const organization = await Organization.create({
      name: normalizedName,
      slug: normalizedSlug,
      organizationType: "political_party",
      politicalPartyName: normalizedName,
      isPermanentParty: true,
      isNewPartyRequest: false,
      email: email || creator.email,
      phone: phone || creator.phone,
      website: website || null,
      logo: logo || null,
      description: description || "",
      organizationStatus: "pending",
      approvedAt: null,
      approvedBy: null,
    });

    return res.status(201).json({
      success: true,
      message: "Political party organization request submitted. Super Admin approval is required before activation.",
      organization: { id: organization._id, name: organization.name, slug: organization.slug, organizationType: organization.organizationType, organizationStatus: organization.organizationStatus },
      nextStep: "After approval, the party's National Admin is onboarded through the organization invitation workflow.",
    });
  } catch (error) {
    console.error("Create political party request error:", error);
    return res.status(500).json({ success: false, message: error.message || "Unable to submit political party request." });
  }
};
