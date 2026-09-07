const OrganizationMembership = require("../models/OrganizationMembership");
const User = require("../models/User");
const PollingStation = require("../models/PollingStation");
const Result = require("../models/Result");
const Election = require("../models/Election");
const { getElectionAccess, canViewOrganizationElection, resultScopeForMemberships } = require("../services/electionAccessService");

const clean = (value) => String(value || "").trim();

function person(user) {
  return {
    id: user?._id || null,
    name: user?.displayName || [user?.firstName, user?.middleName, user?.lastName].filter(Boolean).join(" ") || user?.username || "Unknown",
    telephone: user?.phone || null,
    username: user?.username || null,
    isOnline: Boolean(user?.isOnline),
  };
}

function statusForStation(results, stationId) {
  const matching = results.filter((r) => clean(r.pollingStationId) === clean(stationId));
  if (!matching.length) return { status: "not_submitted", label: "Not submitted", resultId: null };
  const result = matching.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))[0];
  const status = result.verificationStatus || "pending";
  const labels = { verified: "Verified", rejected: "Rejected", discrepancy: "Discrepancy", disputed: "Disputed", pending: "Pending verification" };
  return { status, label: labels[status] || "Pending verification", resultId: result._id };
}

function membershipMatchesScope(membership, access, regionId, constituencyId, pollingStationId) {
  const role = membership.role;
  const national = ["national_party_admin", "national_observer_admin", "presidential_candidate", "parliamentary_candidate"].includes(role);
  if (national) return true;
  if (["regional_party_admin", "regional_observer_admin"].includes(role)) {
    if (!membership.regionId) return false;
    if (regionId && regionId !== "all") return String(membership.regionId) === regionId;
    return true;
  }
  if (["constituency_admin", "constituency_observer_admin"].includes(role)) {
    if (!membership.constituencyId) return false;
    if (constituencyId && constituencyId !== "all") return String(membership.constituencyId) === constituencyId;
    return true;
  }
  if (["polling_station_agent", "observer_polling_station_agent"].includes(role)) {
    if (!membership.pollingStationId) return false;
    if (pollingStationId && pollingStationId !== "all") return String(membership.pollingStationId) === pollingStationId;
    return true;
  }
  return false;
}

exports.getGeographicAssignments = async (req, res) => {
  try {
    const electionId = clean(req.query.electionId);
    const regionId = clean(req.query.regionId);
    const constituencyId = clean(req.query.constituencyId);
    const pollingStationId = clean(req.query.pollingStationId);
    if (!electionId || electionId === "all") return res.status(400).json({ success: false, message: "Election is required." });

    const election = await Election.findById(electionId).lean();
    if (!election) return res.status(404).json({ success: false, message: "Election not found." });
    const access = await getElectionAccess(req.user);
    if (!canViewOrganizationElection(access, election)) return res.status(404).json({ success: false, message: "Election not found." });

    const membershipQuery = {
      status: "approved",
      role: { $in: [
        "national_party_admin", "regional_party_admin", "constituency_admin", "polling_station_agent",
        "national_observer_admin", "regional_observer_admin", "constituency_observer_admin", "observer_polling_station_agent",
        "presidential_candidate", "parliamentary_candidate",
      ] },
    };
    if (election.organizationId) membershipQuery.organizationId = election.organizationId;
    else if (!access.isSuperAdmin) return res.json({
      success: true,
      electionId,
      filters: { regionId: regionId || "all", constituencyId: constituencyId || "all", pollingStationId: pollingStationId || "all" },
      assignments: { regional: [], constituency: [], pollingStation: [] },
      stations: [],
      summary: { regionalAssignments: 0, constituencyAssignments: 0, pollingStationAssignments: 0, stations: 0, submitted: 0, verified: 0, pending: 0, rejected: 0, discrepancy: 0 },
    });

    const memberships = await OrganizationMembership.find(membershipQuery)
      .populate("userId", "displayName firstName middleName lastName username phone isOnline")
      .populate("regionId", "name regionNumber")
      .populate("constituencyId", "name constituencyNumber")
      .populate("pollingStationId", "name pollingStationCode")
      .populate("organizationId", "name politicalPartyName organizationType")
      .sort({ level: 1, createdAt: 1 })
      .lean();

    const visibleMemberships = access.isSuperAdmin
      ? memberships
      : memberships.filter((m) => access.organizationIds.includes(String(m.organizationId?._id || m.organizationId)) && membershipMatchesScope(m, access, regionId, constituencyId, pollingStationId));

    const stationQuery = { isActive: true };
    if (regionId && regionId !== "all") stationQuery.regionId = regionId;
    if (constituencyId && constituencyId !== "all") stationQuery.constituencyId = constituencyId;
    if (pollingStationId && pollingStationId !== "all") stationQuery._id = pollingStationId;

    const stations = await PollingStation.find(stationQuery)
      .select("_id name pollingStationCode district regionId constituencyId")
      .populate("regionId", "name regionNumber")
      .populate("constituencyId", "name constituencyNumber")
      .sort({ pollingStationCode: 1, name: 1 })
      .lean();

    const resultQuery = { electionId };
    if (election.organizationId) {
      const organizationId = String(election.organizationId);
      if (access.isSuperAdmin) resultQuery.organizationId = organizationId;
      else {
        const scope = resultScopeForMemberships(access.memberships, organizationId);
        if (scope === null) return res.status(403).json({ success: false, message: "You are not assigned an election duty for this organization." });
        resultQuery.organizationId = organizationId;
        if (Object.keys(scope).length) Object.assign(resultQuery, scope);
      }
    } else {
      resultQuery.organizationId = null;
    }
    if (regionId && regionId !== "all") resultQuery.regionId = regionId;
    if (constituencyId && constituencyId !== "all") resultQuery.constituencyId = constituencyId;
    if (pollingStationId && pollingStationId !== "all") resultQuery.pollingStationId = pollingStationId;

    const results = await Result.find(resultQuery)
      .select("_id pollingStationId verificationStatus updatedAt createdAt")
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    const assignments = visibleMemberships
      .filter((m) => m.userId && membershipMatchesScope(m, access, regionId, constituencyId, pollingStationId))
      .map((m) => ({
        id: m._id,
        level: m.level,
        role: m.role,
        status: m.status,
        person: person(m.userId),
        organization: m.organizationId ? { id: m.organizationId._id, name: m.organizationId.name || m.organizationId.politicalPartyName || "Organization" } : null,
        region: m.regionId ? { id: m.regionId._id, name: m.regionId.name, number: m.regionId.regionNumber } : null,
        constituency: m.constituencyId ? { id: m.constituencyId._id, name: m.constituencyId.name, number: m.constituencyId.constituencyNumber } : null,
        pollingStation: m.pollingStationId ? { id: m.pollingStationId._id, name: m.pollingStationId.name, code: m.pollingStationId.pollingStationCode } : null,
      }));

    const byStation = new Map();
    for (const assignment of assignments) {
      const key = clean(assignment.pollingStation?.id);
      if (!key) continue;
      if (!byStation.has(key)) byStation.set(key, []);
      byStation.get(key).push(assignment);
    }

    const stationRows = stations.map((station) => ({
      id: station._id,
      name: station.name,
      code: station.pollingStationCode,
      district: station.district,
      region: station.regionId ? { id: station.regionId._id, name: station.regionId.name } : null,
      constituency: station.constituencyId ? { id: station.constituencyId._id, name: station.constituencyId.name } : null,
      result: statusForStation(results, station._id),
      assignedPersons: byStation.get(clean(station._id)) || [],
    }));

    const regional = assignments.filter((a) => a.level === "regional");
    const constituency = assignments.filter((a) => a.level === "constituency");
    const pollingStation = assignments.filter((a) => a.level === "polling_station");

    return res.json({
      success: true,
      electionId,
      filters: { regionId: regionId || "all", constituencyId: constituencyId || "all", pollingStationId: pollingStationId || "all" },
      assignments: { regional, constituency, pollingStation },
      stations: stationRows,
      summary: {
        regionalAssignments: regional.length,
        constituencyAssignments: constituency.length,
        pollingStationAssignments: pollingStation.length,
        stations: stationRows.length,
        submitted: stationRows.filter((s) => s.result.status !== "not_submitted").length,
        verified: stationRows.filter((s) => s.result.status === "verified").length,
        pending: stationRows.filter((s) => ["pending", "not_submitted"].includes(s.result.status)).length,
        rejected: stationRows.filter((s) => s.result.status === "rejected").length,
        discrepancy: stationRows.filter((s) => ["discrepancy", "disputed"].includes(s.result.status)).length,
      },
    });
  } catch (error) {
    console.error("Geographic assignments error:", error);
    return res.status(500).json({ success: false, message: "Unable to load geographic assignments." });
  }
};
