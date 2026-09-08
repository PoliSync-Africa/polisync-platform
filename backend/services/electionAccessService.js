const OrganizationMembership = require("../models/OrganizationMembership");
const PlatformSettings = require("../models/PlatformSettings");

const DEFAULT_PERSONAL_ELECTION_VIEW = true;
const DEFAULT_ORGANIZATION_ELECTION_CREATION = true;

// Roles that an organization may explicitly assign to someone for election
// operations. Ordinary organization members and personal users do not receive
// organization election access merely because they have an account.
const ELECTION_VIEW_ROLES = [
  "national_party_admin",
  "regional_party_admin",
  "constituency_admin",
  "polling_station_agent",
  "national_observer_admin",
  "regional_observer_admin",
  "constituency_observer_admin",
  "observer_polling_station_agent",
  "presidential_candidate",
  "parliamentary_candidate",
];

const REGION_ROLES = new Set(["regional_party_admin", "regional_observer_admin"]);
const CONSTITUENCY_ROLES = new Set(["constituency_admin", "constituency_observer_admin"]);
const STATION_ROLES = new Set(["polling_station_agent", "observer_polling_station_agent"]);
const NATIONAL_OR_CANDIDATE_ROLES = new Set(["national_party_admin", "national_observer_admin", "presidential_candidate", "parliamentary_candidate"]);

async function getPlatformElectionControls() {
  try {
    const settings = await PlatformSettings.findOne({ singleton: "platform" })
      .select("allowOrganizationElectionCreation allowPersonalElectionResultsView")
      .lean();
    return {
      allowOrganizationElectionCreation: settings?.allowOrganizationElectionCreation ?? DEFAULT_ORGANIZATION_ELECTION_CREATION,
      allowPersonalElectionResultsView: settings?.allowPersonalElectionResultsView ?? DEFAULT_PERSONAL_ELECTION_VIEW,
    };
  } catch (error) {
    // A missing/unavailable settings document must not accidentally lock the
    // platform out of its election workspace. Defaults are intentionally on.
    console.error("Election platform controls lookup:", error);
    return {
      allowOrganizationElectionCreation: DEFAULT_ORGANIZATION_ELECTION_CREATION,
      allowPersonalElectionResultsView: DEFAULT_PERSONAL_ELECTION_VIEW,
    };
  }
}

function isOrganizationElection(election) {
  if (!election) return false;
  return Boolean(election.organizationId) || election.managedBy === "organization";
}

async function getElectionAccess(user) {
  const controls = await getPlatformElectionControls();
  if (user?.platformRole === "super_admin") {
    return {
      isSuperAdmin: true,
      canViewOrganizationElections: true,
      canViewPersonalElectionsAndResults: true,
      allowOrganizationElectionCreation: true,
      organizationIds: [],
      memberships: [],
    };
  }

  const memberships = await OrganizationMembership.find({
    userId: user?._id,
    status: "approved",
    role: { $in: ELECTION_VIEW_ROLES },
  }).lean();

  const organizationIds = [...new Set(
    memberships.map((membership) => String(membership.organizationId || "")).filter(Boolean)
  )];

  // canViewOrganizationElections is retained as the frontend workspace-access
  // flag for compatibility. Organization access itself remains determined by
  // organizationIds, while personal access is controlled independently below.
  return {
    isSuperAdmin: false,
    canViewOrganizationElections: organizationIds.length > 0 || controls.allowPersonalElectionResultsView,
    canViewPersonalElectionsAndResults: controls.allowPersonalElectionResultsView,
    allowOrganizationElectionCreation: controls.allowOrganizationElectionCreation,
    memberships,
    organizationIds,
  };
}

function canViewOrganizationElection(access, election) {
  if (!isOrganizationElection(election)) return Boolean(access?.isSuperAdmin || access?.canViewPersonalElectionsAndResults);
  if (access?.isSuperAdmin) return true;
  const organizationId = String(election.organizationId?._id || election.organizationId || "");
  return Boolean(organizationId && access.organizationIds?.includes(organizationId));
}

function electionVisibilityFilter(access) {
  if (access?.isSuperAdmin) return {};
  const clauses = [];

  if (access?.canViewPersonalElectionsAndResults) {
    clauses.push({
      organizationId: null,
      $or: [{ managedBy: "platform" }, { managedBy: { $exists: false } }],
    });
  }
  if (access?.organizationIds?.length) clauses.push({ organizationId: { $in: access.organizationIds } });

  // No visible election workspace is represented by an impossible _id filter.
  if (!clauses.length) return { _id: null };
  return clauses.length === 1 ? clauses[0] : { $or: clauses };
}

function resultScopeForMemberships(memberships, organizationId) {
  const matching = memberships.filter(
    (membership) => String(membership.organizationId || "") === String(organizationId || "")
  );

  if (!matching.length) return null;
  if (matching.some((membership) => NATIONAL_OR_CANDIDATE_ROLES.has(membership.role))) return {};

  const scope = { $or: [] };
  for (const membership of matching) {
    if (REGION_ROLES.has(membership.role) && membership.regionId) scope.$or.push({ regionId: membership.regionId });
    if (CONSTITUENCY_ROLES.has(membership.role) && membership.constituencyId) scope.$or.push({ constituencyId: membership.constituencyId });
    if (STATION_ROLES.has(membership.role) && membership.pollingStationId) scope.$or.push({ pollingStationId: membership.pollingStationId });
  }

  return scope.$or.length ? scope : null;
}

function resultVisibilityFilter(access, organizationIds = null) {
  if (access?.isSuperAdmin) return {};

  const ids = organizationIds?.length ? organizationIds : access?.organizationIds || [];
  const clauses = [];
  if (access?.canViewPersonalElectionsAndResults) clauses.push({ organizationId: null });
  for (const organizationId of ids) {
    const scope = resultScopeForMemberships(access.memberships || [], organizationId);
    if (scope === null) continue;
    if (Object.keys(scope).length === 0) clauses.push({ organizationId });
    else clauses.push({ organizationId, ...scope });
  }

  return clauses.length === 0 ? { _id: null } : clauses.length === 1 ? clauses[0] : { $or: clauses };
}

module.exports = {
  ELECTION_VIEW_ROLES,
  isOrganizationElection,
  getPlatformElectionControls,
  getElectionAccess,
  canViewOrganizationElection,
  electionVisibilityFilter,
  resultScopeForMemberships,
  resultVisibilityFilter,
};
