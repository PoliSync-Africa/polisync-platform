const Organization = require("../models/Organization");
const OrganizationMembership = require("../models/OrganizationMembership");
const { synchronizeAllElectionParties } = require("../services/electionGeographySyncService");

async function getContext(req) {
  const userId = req.user?._id || req.user?.id;
  if (!userId) return null;
  const membership = await OrganizationMembership.findOne({ userId, role: "national_party_admin", status: "approved", organizationType: "political_party" }).lean();
  if (!membership) return null;
  const organization = await Organization.findOne({ _id: membership.organizationId, organizationType: "political_party", organizationStatus: "approved" });
  if (!organization) return null;
  return { membership, organization };
}

exports.getMyPartyProfile = async (req, res) => {
  try {
    const context = await getContext(req);
    if (!context) return res.status(403).json({ success: false, message: "Only an approved National Party Admin can manage the political party profile." });
    const { organization } = context;
    return res.json({ success: true, organization: { id: organization._id, name: organization.name, politicalPartyName: organization.politicalPartyName || organization.name, email: organization.email || "", phone: organization.phone || "", website: organization.website || "", logo: organization.logo || "", description: organization.description || "" } });
  } catch (error) { return res.status(500).json({ success: false, message: error.message || "Unable to load party profile." }); }
};

exports.updateMyPartyProfile = async (req, res) => {
  try {
    const context = await getContext(req);
    if (!context) return res.status(403).json({ success: false, message: "Only an approved National Party Admin can manage the political party profile." });
    const organization = context.organization;
    const { email, phone, website, description, logo } = req.body || {};
    if (email !== undefined) organization.email = String(email || "").trim().toLowerCase() || null;
    if (phone !== undefined) {
      const normalizedPhone = String(phone || "").trim();
      if (normalizedPhone && !/^\+233\d{9}$/.test(normalizedPhone)) return res.status(400).json({ success: false, message: "Party phone number must use Ghana format +233XXXXXXXXX." });
      organization.phone = normalizedPhone || null;
    }
    if (website !== undefined) organization.website = String(website || "").trim() || null;
    if (description !== undefined) organization.description = String(description || "").trim();
    if (logo !== undefined) {
      const value = String(logo || "").trim();
      if (value.length > 2 * 1024 * 1024) return res.status(400).json({ success: false, message: "Party logo is too large. Use an image up to 2 MB." });
      if (!value) return res.status(400).json({ success: false, message: "Party logo cannot be empty when updating the logo." });
      organization.logo = value;
    }
    await organization.save();
    await synchronizeAllElectionParties();
    return res.json({ success: true, organization: { id: organization._id, name: organization.name, politicalPartyName: organization.politicalPartyName || organization.name, email: organization.email || "", phone: organization.phone || "", website: organization.website || "", logo: organization.logo || "", description: organization.description || "" }, message: "Political party information updated and synchronized." });
  } catch (error) { return res.status(400).json({ success: false, message: error.message || "Unable to update party profile." }); }
};
