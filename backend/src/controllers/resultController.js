const mongoose = require("mongoose");
const Result = require("../models/Result");
const Election = require("../models/Election");
const Candidate = require("../models/Candidate");
const OrganizationMembership = require("../models/OrganizationMembership");
const Region = require("../models/Region");
const Constituency = require("../models/Constituency");
const PollingStation = require("../models/PollingStation");
const { logEvent } = require("../services/audit/logEvent");

const id = (value) => mongoose.Types.ObjectId.isValid(String(value || "")) ? new mongoose.Types.ObjectId(String(value)) : null;
const asNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

async function getAccessContext(req) {
  const userId = req.user?._id;
  const platformRole = req.user?.platformRole;
  if (!userId) return { userId: null, isSuperAdmin: false, memberships: [], candidates: [] };

  if (platformRole === "super_admin") {
    return { userId, isSuperAdmin: true, memberships: [], candidates: [] };
  }

  const [memberships, candidates] = await Promise.all([
    OrganizationMembership.find({ userId, status: "approved" }).lean(),
    Candidate.find({ userId, isDeleted: { $ne: true }, status: { $in: ["approved", "active"] } }).lean(),
  ]);

  return { userId, isSuperAdmin: false, memberships, candidates };
}

function buildScopeOr(context) {
  const clauses = [];
  const memberships = context.memberships || [];

  for (const membership of memberships) {
    const base = {};
    if (membership.organizationId) base.organizationId = membership.organizationId;

    if (membership.level === "national") clauses.push(base);
    else if (membership.level === "regional" && membership.regionId) clauses.push({ ...base, regionId: membership.regionId });
    else if (membership.level === "constituency" && membership.constituencyId) clauses.push({ ...base, constituencyId: membership.constituencyId });
    else if (membership.level === "polling_station" && membership.pollingStationId) clauses.push({ ...base, pollingStationId: membership.pollingStationId });
    else if (membership.level === "candidate") clauses.push(base);
  }

  for (const candidate of context.candidates || []) {
    const base = {};
    if (candidate.organizationId) base.organizationId = candidate.organizationId;
    if (candidate.electionId) base.electionId = candidate.electionId;
    if (candidate.position === "parliamentary" && candidate.constituencyId) base.constituencyId = candidate.constituencyId;
    else if (candidate.regionId) base.regionId = candidate.regionId;
    clauses.push(base);
  }

  return clauses;
}

async function buildResultFilter(req, options = {}) {
  const context = await getAccessContext(req);
  const filter = {};

  if (!context.isSuperAdmin) {
    const accessOr = buildScopeOr(context);
    if (!accessOr.length) {
      return { context, filter: { _id: null } };
    }
    filter.$or = accessOr;
  }

  const electionId = id(options.electionId ?? req.query?.electionId);
  const regionId = id(options.regionId ?? req.query?.regionId);
  const constituencyId = id(options.constituencyId ?? req.query?.constituencyId);
  const pollingStationId = id(options.pollingStationId ?? req.query?.pollingStationId);

  if (electionId) filter.electionId = electionId;
  if (regionId) filter.regionId = regionId;
  if (constituencyId) filter.constituencyId = constituencyId;
  if (pollingStationId) filter.pollingStationId = pollingStationId;

  return { context, filter };
}

// Submit one official polling-station result.
exports.submitResult = async (req, res) => {
  try {
    const {
      electionId,
      pollingStationId,
      candidateResults,
      manualTotals,
      pinkSheetAnalysis,
    } = req.body || {};

    if (!id(electionId) || !id(pollingStationId) || !Array.isArray(candidateResults) || !candidateResults.length) {
      return res.status(400).json({ success: false, message: "Election, polling station and candidate results are required." });
    }

    const station = await PollingStation.findById(pollingStationId).lean();
    if (!station) return res.status(404).json({ success: false, message: "Polling station not found." });

    const election = await Election.findById(electionId).lean();
    if (!election) return res.status(404).json({ success: false, message: "Election not found." });
    if (!["Active", "active"].includes(election.status)) {
      return res.status(400).json({ success: false, message: "Results can only be submitted for an active election." });
    }

    const context = await getAccessContext(req);
    const organizationId = context.isSuperAdmin ? (election.organizationId || null) : (context.memberships?.[0]?.organizationId || election.organizationId || null);

    if (!context.isSuperAdmin) {
      const allowed = buildScopeOr(context).some((scope) => {
        const sameOrg = !scope.organizationId || String(scope.organizationId) === String(organizationId);
        const regionOk = !scope.regionId || String(scope.regionId) === String(station.regionId);
        const constituencyOk = !scope.constituencyId || String(scope.constituencyId) === String(station.constituencyId);
        const stationOk = !scope.pollingStationId || String(scope.pollingStationId) === String(station._id);
        return sameOrg && regionOk && constituencyOk && stationOk;
      });
      if (!allowed) return res.status(403).json({ success: false, message: "You are not assigned to this polling station or organizational scope." });
    }

    const existingResult = await Result.findOne({ electionId, pollingStationId });
    if (existingResult) return res.status(409).json({ success: false, message: "A result has already been submitted for this polling station." });

    const valid = asNumber(manualTotals?.totalValidVotes);
    const rejected = asNumber(manualTotals?.rejectedVotes);
    const ballots = asNumber(manualTotals?.totalBallots);

    const result = await Result.create({
      organizationId,
      electionId,
      pollingStationId,
      regionId: station.regionId,
      constituencyId: station.constituencyId,
      pollingStationCode: station.pollingStationCode || station.code || String(station._id),
      submittedBy: req.user._id,
      candidateResults: candidateResults.map((candidate) => ({
        candidateId: String(candidate.candidateId || ""),
        candidateName: String(candidate.candidateName || "").trim(),
        party: String(candidate.party || "").trim(),
        manualVotes: asNumber(candidate.manualVotes ?? candidate.votes),
        pinkSheetVotes: candidate.pinkSheetVotes == null ? null : asNumber(candidate.pinkSheetVotes),
        comparisonStatus: candidate.comparisonStatus || "not_checked",
      })),
      manualTotals: { totalValidVotes: valid, rejectedVotes: rejected, totalBallots: ballots },
      pinkSheetAnalysis: pinkSheetAnalysis || { supplied: false, status: "not_supplied" },
    });

    await logEvent({ stationId: pollingStationId, electionId, userId: req.user._id, action: "RESULT_CREATED", description: "Polling station result submitted." });

    return res.status(201).json({ success: true, message: "Election result submitted successfully.", data: result, result });
  } catch (error) {
    console.error("Submit result error:", error);
    return res.status(500).json({ success: false, message: error.message || "Unable to submit result." });
  }
};

exports.getElectionResults = async (req, res) => {
  try {
    const { filter } = await buildResultFilter(req, { electionId: req.params.electionId });
    const results = await Result.find(filter)
      .populate("pollingStationId", "code pollingStationCode name country regionId constituencyId")
      .populate("submittedBy", "firstName lastName platformRole")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getResults = async (req, res) => {
  try {
    const { filter } = await buildResultFilter(req);
    const results = await Result.find(filter)
      .populate("pollingStationId", "code pollingStationCode name country regionId constituencyId")
      .populate("submittedBy", "firstName lastName platformRole")
      .populate("electionId", "name year type country status")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Shared live-results data source for national, regional, constituency,
// polling-station, party, observer and candidate dashboards.
exports.dashboard = async (req, res) => {
  try {
    const { context, filter } = await buildResultFilter(req);
    const requestedElectionId = id(req.query?.electionId);
    const view = String(req.query?.view || "national").toLowerCase();

    // A candidate's dashboard must always be anchored to that candidate's
    // actual election/constituency when the caller has candidate membership.
    if (!context.isSuperAdmin && context.candidates?.length) {
      const candidateClauses = context.candidates.map((candidate) => {
        const clause = {};
        if (candidate.organizationId) clause.organizationId = candidate.organizationId;
        if (candidate.electionId) clause.electionId = candidate.electionId;
        if (candidate.position === "parliamentary" && candidate.constituencyId) clause.constituencyId = candidate.constituencyId;
        return clause;
      }).filter((x) => Object.keys(x).length);
      if (candidateClauses.length) {
        const existingOr = filter.$or;
        filter.$and = [
          ...(existingOr ? [{ $or: existingOr }] : []),
          { $or: candidateClauses },
        ];
        delete filter.$or;
      }
    }

    const results = await Result.find(filter).lean();

    const regionIds = [...new Set(results.map((r) => String(r.regionId)).filter(Boolean))].map(id).filter(Boolean);
    const constituencyIds = [...new Set(results.map((r) => String(r.constituencyId)).filter(Boolean))].map(id).filter(Boolean);
    const [regions, constituencies] = await Promise.all([
      regionIds.length ? Region.find({ _id: { $in: regionIds } }).select("name code latitude longitude center").lean() : [],
      constituencyIds.length ? Constituency.find({ _id: { $in: constituencyIds } }).select("name code regionId latitude longitude center").lean() : [],
    ]);

    const regionName = new Map(regions.map((r) => [String(r._id), r.name]));
    const constituencyName = new Map(constituencies.map((c) => [String(c._id), c.name]));

    const candidateTotals = new Map();
    let totalValidVotes = 0;
    let rejectedVotes = 0;
    let totalBallots = 0;

    const regionCoverage = new Map();
    const constituencyCoverage = new Map();

    for (const result of results) {
      totalValidVotes += asNumber(result.manualTotals?.totalValidVotes);
      rejectedVotes += asNumber(result.manualTotals?.rejectedVotes);
      totalBallots += asNumber(result.manualTotals?.totalBallots);

      const rid = String(result.regionId || "");
      const cid = String(result.constituencyId || "");
      if (rid) {
        const item = regionCoverage.get(rid) || { regionId: result.regionId, name: regionName.get(rid) || "Unknown region", received: 0 };
        item.received += 1;
        regionCoverage.set(rid, item);
      }
      if (cid) {
        const item = constituencyCoverage.get(cid) || { constituencyId: result.constituencyId, name: constituencyName.get(cid) || "Unknown constituency", received: 0 };
        item.received += 1;
        constituencyCoverage.set(cid, item);
      }

      for (const candidate of result.candidateResults || []) {
        const key = String(candidate.candidateId || candidate.candidateName || "Unknown");
        const current = candidateTotals.get(key) || {
          candidateId: candidate.candidateId,
          candidateName: candidate.candidateName,
          party: candidate.party || "",
          votes: 0,
        };
        current.votes += asNumber(candidate.manualVotes ?? candidate.votes);
        candidateTotals.set(key, current);
      }
    }

    const stationCountFilter = {};
    if (requestedElectionId) {
      // Electoral geography is independent of an election; the total station
      // count therefore comes from the selected geographic scope, not reports.
      if (view === "polling_station" && id(req.query?.pollingStationId)) stationCountFilter._id = id(req.query.pollingStationId);
      else if (view === "constituency" && id(req.query?.constituencyId)) stationCountFilter.constituencyId = id(req.query.constituencyId);
      else if (view === "regional" && id(req.query?.regionId)) stationCountFilter.regionId = id(req.query.regionId);
    }
    if (context.memberships?.length && !context.isSuperAdmin) {
      const scopeOr = buildScopeOr(context).map((scope) => {
        const x = {};
        if (scope.regionId) x.regionId = scope.regionId;
        if (scope.constituencyId) x.constituencyId = scope.constituencyId;
        if (scope.pollingStationId) x._id = scope.pollingStationId;
        return x;
      }).filter((x) => Object.keys(x).length);
      if (scopeOr.length) stationCountFilter.$or = scopeOr;
    }

    const totalPollingStations = await PollingStation.countDocuments(stationCountFilter);
    const selectedStation = id(req.query?.pollingStationId);
    const selectedConstituency = id(req.query?.constituencyId);
    const selectedRegion = id(req.query?.regionId);

    const nationalTotal = selectedStation ? 1 : selectedConstituency ? await PollingStation.countDocuments({ constituencyId: selectedConstituency }) : selectedRegion ? await PollingStation.countDocuments({ regionId: selectedRegion }) : totalPollingStations;
    const selectedResults = results.length;

    const coverage = {
      national: {
        totalPollingStations: nationalTotal,
        received: selectedResults,
        awaitingPending: Math.max(nationalTotal - selectedResults, 0),
        totalValidVotes,
        rejectedVotes,
        totalBallots,
      },
      regions: [...regionCoverage.values()].map((item) => ({ ...item, totalPollingStations: 0, awaitingPending: 0 })),
      constituencies: [...constituencyCoverage.values()].map((item) => ({ ...item, totalPollingStations: 0, awaitingPending: 0 })),
    };

    const [regionStationCounts, constituencyStationCounts] = await Promise.all([
      coverage.regions.length ? Promise.all(coverage.regions.map(async (r) => ({ ...r, totalPollingStations: await PollingStation.countDocuments({ regionId: r.regionId }), awaitingPending: Math.max((await PollingStation.countDocuments({ regionId: r.regionId })) - r.received, 0) }))) : [],
      coverage.constituencies.length ? Promise.all(coverage.constituencies.map(async (c) => ({ ...c, totalPollingStations: await PollingStation.countDocuments({ constituencyId: c.constituencyId }), awaitingPending: Math.max((await PollingStation.countDocuments({ constituencyId: c.constituencyId })) - c.received, 0) }))) : [],
    ]);

    coverage.regions = regionStationCounts;
    coverage.constituencies = constituencyStationCounts;

    const election = requestedElectionId ? await Election.findById(requestedElectionId).select("name year type status organizationId").lean() : null;

    return res.json({
      success: true,
      data: {
        scope: view,
        election,
        coverage,
        presidentialSummary: election?.type === "Presidential" ? [...candidateTotals.values()].sort((a, b) => b.votes - a.votes) : [],
        parliamentarySummary: {
          candidates: election?.type === "Parliamentary" ? [...candidateTotals.values()].sort((a, b) => b.votes - a.votes) : [],
          seatsByParty: {},
        },
        results,
        totalResults: results.length,
        totalValidVotes,
        rejectedVotes,
        totalBallots,
        candidate: context.candidates?.[0] || null,
      },
    });
  } catch (error) {
    console.error("Results dashboard error:", error);
    return res.status(500).json({ success: false, message: error.message || "Unable to load election results." });
  }
};

exports.verifyResult = async (req, res) => {
  try {
    const { filter } = await buildResultFilter(req);
    const result = await Result.findOne({ ...filter, _id: req.params.id });
    if (!result) return res.status(404).json({ success: false, message: "Result not found for your organizational scope." });
    if (result.verificationStatus === "verified") return res.status(400).json({ success: false, message: "Result is already verified." });

    result.verificationStatus = "verified";
    result.verifiedBy = req.user._id;
    result.verifiedAt = new Date();
    await result.save();

    await logEvent({ stationId: result.pollingStationId, electionId: result.electionId, userId: req.user._id, action: "RESULT_APPROVED", description: "Polling station result verified." });
    return res.json({ success: true, message: "Result verified successfully.", data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
