const PersonalWorkspaceProfile = require("../models/PersonalWorkspaceProfile");
const ResearchResource = require("../models/ResearchResource");

const DEFINITIONS = {
  personal_use: {
    label: "Personal / Civic User",
    description: "Explore public political and electoral information for personal civic use.",
    accessProfile: "public_read",
    permissions: ["view_public_data", "explore_electoral_geography", "view_results", "view_candidates", "save_items", "use_ai_analyzer"],
  },
  researcher: {
    label: "Researcher",
    description: "Conduct structured political, electoral and civic research using public datasets and documented sources.",
    accessProfile: "research_read",
    permissions: ["view_public_data", "explore_electoral_geography", "view_results", "view_candidates", "compare_regions", "save_research", "export_public_data", "use_ai_analyzer"],
  },
  journalist: {
    label: "Journalist",
    description: "Investigate and report on public political and electoral developments with source and verification tools.",
    accessProfile: "journalist_read",
    permissions: ["view_public_data", "explore_electoral_geography", "view_results", "view_candidates", "source_verification", "fact_check", "press_calendar", "use_ai_analyzer"],
  },
  media_house: {
    label: "Media House",
    description: "Operate a newsroom-facing workspace for public election data, editorial planning, verification and reporting.",
    accessProfile: "media_read",
    permissions: ["view_public_data", "explore_electoral_geography", "view_results", "view_candidates", "source_verification", "fact_check", "newsroom", "editorial_calendar", "use_ai_analyzer"],
  },
};

function userId(req) {
  return req.user?._id || req.user?.id;
}

exports.definitions = async (req, res) => {
  return res.json({ success: true, data: DEFINITIONS });
};

exports.getProfile = async (req, res) => {
  const profile = await PersonalWorkspaceProfile.findOne({ userId: userId(req) }).lean();
  return res.json({ success: true, data: profile || null, definitions: DEFINITIONS });
};

exports.upsertProfile = async (req, res) => {
  const { purpose, scopeLevel, regionIds, constituencyIds, pollingStationIds, organizationName, researchFields, journalismBeat } = req.body || {};
  const definition = DEFINITIONS[purpose];

  if (!definition) {
    return res.status(400).json({ success: false, message: "Invalid personal workspace purpose." });
  }

  if (purpose === "media_house" && !String(organizationName || "").trim()) {
    return res.status(400).json({ success: false, message: "Media house name is required." });
  }

  const profile = await PersonalWorkspaceProfile.findOneAndUpdate(
    { userId: userId(req) },
    {
      $set: {
        purpose,
        scopeLevel: scopeLevel || "public_platform",
        regionIds: Array.isArray(regionIds) ? regionIds : [],
        constituencyIds: Array.isArray(constituencyIds) ? constituencyIds : [],
        pollingStationIds: Array.isArray(pollingStationIds) ? pollingStationIds : [],
        organizationName: String(organizationName || "").trim(),
        researchFields: Array.isArray(researchFields) ? researchFields : [],
        journalismBeat: String(journalismBeat || "").trim(),
        accessProfile: definition.accessProfile,
        permissions: definition.permissions,
        onboardingComplete: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.json({ success: true, data: profile, role: definition });
};

exports.resources = async (req, res) => {
  const profile = await PersonalWorkspaceProfile.findOne({ userId: userId(req) }).lean();
  const purpose = profile?.purpose || "personal_use";
  const resources = await ResearchResource.find({ isActive: true, audience: purpose }).sort({ category: 1, title: 1 }).lean();
  return res.json({ success: true, data: resources, purpose, role: DEFINITIONS[purpose] });
};

exports.resourceCatalog = async (req, res) => {
  const resources = await ResearchResource.find({ isActive: true }).sort({ category: 1, title: 1 }).lean();
  return res.json({ success: true, data: resources });
};

exports.roleDefinitions = DEFINITIONS;
