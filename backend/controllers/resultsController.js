const Result = require("../models/Result");
const Election = require("../models/Election");
const Organization = require("../models/Organization");
const PollingStation = require("../models/PollingStation");
const OrganizationMembership = require("../models/OrganizationMembership");
const Region = require("../models/Region");
const Constituency = require("../models/Constituency");

function normaliseCandidates(items = []) {
  return items.map((item) => ({
    candidateId: String(item.candidateId || "").trim(),
    candidateName: String(item.candidateName || "").trim(),
    party: String(item.party || "").trim(),
    manualVotes: Number(item.manualVotes || 0),
    pinkSheetVotes: item.pinkSheetVotes == null ? null : Number(item.pinkSheetVotes),
    comparisonStatus: item.comparisonStatus || "not_checked",
  }));
}

exports.submitResult = async (req, res) => {
  try {
    if (req.user.role !== "polling_station_agent") {
      return res.status(403).json({ success: false, message: "Only an assigned polling station agent can submit polling-station results." });
    }
    const { electionId, pollingStationId, candidateResults, manualTotals, pinkSheetAnalysis } = req.body;
    if (!electionId || !pollingStationId || !Array.isArray(candidateResults) || !candidateResults.length || !manualTotals) {
      return res.status(400).json({ success: false, message: "Election, polling station, candidate results and manual totals are required." });
    }
    const membership = await OrganizationMembership.findOne({ userId: req.user._id, role: "polling_station_agent", pollingStationId, status: "approved" }).lean();
    if (!membership) return res.status(403).json({ success: false, message: "You are not approved for this polling station." });
    const station = await PollingStation.findById(pollingStationId).lean();
    if (!station || !station.isActive) return res.status(404).json({ success: false, message: "Polling station not found or inactive." });
    if (String(station.regionId) !== String(membership.regionId) || String(station.constituencyId) !== String(membership.constituencyId)) {
      return res.status(403).json({ success: false, message: "Polling station geography does not match the agent assignment." });
    }
    const candidates = normaliseCandidates(candidateResults);
    if (candidates.some(c => !c.candidateId || !c.candidateName || !Number.isFinite(c.manualVotes) || c.manualVotes < 0)) {
      return res.status(400).json({ success: false, message: "Every candidate must have a valid manual vote count." });
    }
    const manualValid = Number(manualTotals.totalValidVotes);
    const manualRejected = Number(manualTotals.rejectedVotes || 0);
    const manualBallots = Number(manualTotals.totalBallots);
    const candidateSum = candidates.reduce((sum, c) => sum + c.manualVotes, 0);
    if (![manualValid, manualRejected, manualBallots].every(Number.isFinite) || manualValid < 0 || manualRejected < 0 || manualBallots < 0) {
      return res.status(400).json({ success: false, message: "Invalid ballot totals." });
    }
    if (candidateSum !== manualValid || manualValid + manualRejected !== manualBallots) {
      return res.status(400).json({ success: false, message: "Manual figures do not reconcile: candidate votes, valid votes and total ballots must agree." });
    }
    const existing = await Result.findOne({ electionId, pollingStationId });
    if (existing) return res.status(409).json({ success: false, message: "A result has already been submitted for this polling station and election.", resultId: existing._id });
    const analysis = pinkSheetAnalysis && pinkSheetAnalysis.supplied ? pinkSheetAnalysis : { supplied: false, status: "not_supplied" };
    const extracted = Array.isArray(analysis.extractedCandidates) ? analysis.extractedCandidates : [];
    const hasPink = analysis.supplied === true && extracted.length > 0;
    let verificationStatus = hasPink ? "discrepancy" : "pending";
    let verificationSummary = hasPink ? "Pink-sheet comparison requires verification." : "Manual result submitted; pink sheet not supplied.";
    if (hasPink) {
      const pinkMap = new Map(extracted.map(c => [String(c.candidateId || c.candidateName).trim().toLowerCase(), Number(c.pinkSheetVotes ?? c.votes)]));
      let mismatch = false;
      for (const candidate of candidates) {
        const key = String(candidate.candidateId || candidate.candidateName).trim().toLowerCase();
        const pink = pinkMap.get(key);
        if (!Number.isFinite(pink) || pink !== candidate.manualVotes) mismatch = true;
        candidate.pinkSheetVotes = Number.isFinite(pink) ? pink : null;
        candidate.comparisonStatus = !Number.isFinite(pink) ? "unreadable" : pink === candidate.manualVotes ? "match" : "discrepancy";
      }
      const pinkTotals = analysis.extractedTotals || {};
      if (Number.isFinite(Number(pinkTotals.totalValidVotes)) && Number(pinkTotals.totalValidVotes) !== manualValid) mismatch = true;
      if (Number.isFinite(Number(pinkTotals.rejectedVotes)) && Number(pinkTotals.rejectedVotes) !== manualRejected) mismatch = true;
      if (Number.isFinite(Number(pinkTotals.totalBallots)) && Number(pinkTotals.totalBallots) !== manualBallots) mismatch = true;
      verificationStatus = mismatch ? "discrepancy" : "verified";
      verificationSummary = mismatch ? "At least one manual figure differs from the pink-sheet extraction." : "Manual result matches the pink-sheet extraction.";
    }
    const result = await Result.create({
      organizationId: membership.organizationId,
      electionId,
      pollingStationId,
      regionId: station.regionId,
      constituencyId: station.constituencyId,
      pollingStationCode: station.pollingStationCode,
      submittedBy: req.user._id,
      candidateResults: candidates,
      manualTotals: { totalValidVotes: manualValid, rejectedVotes: manualRejected, totalBallots: manualBallots },
      pinkSheetAnalysis: {
        supplied: Boolean(analysis.supplied),
        status: analysis.supplied ? (analysis.status || "complete") : "not_supplied",
        extractedCandidates: extracted,
        extractedTotals: analysis.extractedTotals || {},
        confidence: Number.isFinite(Number(analysis.confidence)) ? Number(analysis.confidence) : null,
        checkedAt: analysis.supplied ? new Date() : null,
        documentName: String(analysis.documentName || ""),
      },
      verificationStatus,
      verificationSummary,
      verifiedAt: verificationStatus === "verified" ? new Date() : null,
    });
    res.status(201).json({ success: true, message: verificationStatus === "verified" ? "Result submitted and verified." : "Result submitted successfully.", result, propagation: { pollingStationId: station._id, constituencyId: station.constituencyId, regionId: station.regionId, organizationId: membership.organizationId } });
  } catch (error) {
    console.error("submitResult:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.dashboard = async (req, res) => {
  try {
    const organizationId = String(req.query.organizationId || "").trim();
    const electionId = String(req.query.electionId || "").trim();
    const electionType = String(req.query.electionType || "").trim();

    const electionFilter = {};
    if (electionId) electionFilter._id = electionId;
    if (electionType) electionFilter.type = electionType;
    const matchingElections = await Election.find(electionFilter).select("name year type country status").sort({ year: -1, createdAt: -1 }).lean();
    const matchingElectionIds = matchingElections.map(e => e._id);

    const resultMatch = {};
    if (organizationId) resultMatch.organizationId = organizationId;
    if (matchingElectionIds.length || electionId || electionType) resultMatch.electionId = { $in: matchingElectionIds };
    if (req.user.role === "polling_station_agent") resultMatch.submittedBy = req.user._id;

    const results = await Result.find(resultMatch)
      .populate("organizationId", "name organizationType politicalPartyName")
      .populate("electionId", "name year type country status")
      .populate("regionId", "name regionNumber")
      .populate("constituencyId", "name constituencyNumber")
      .lean();

    const organizationMap = new Map();
    const electionTypeSet = new Set();
    const electionMap = new Map();
    const regions = new Map();
    const constituencies = new Map();
    const national = {};
    let totalVotes = 0;
    let submittedStations = 0;
    let pending = 0;
    let verified = 0;
    let discrepancy = 0;
    let rejected = 0;

    results.forEach(result => {
      const org = result.organizationId;
      const election = result.electionId;
      if (org?._id) organizationMap.set(String(org._id), { id: String(org._id), name: org.name, organizationType: org.organizationType, politicalPartyName: org.politicalPartyName });
      if (election?.type) electionTypeSet.add(election.type);
      if (election?._id) electionMap.set(String(election._id), election);
      submittedStations += 1;
      totalVotes += result.manualTotals?.totalValidVotes || 0;
      if (result.verificationStatus === "verified") verified += 1;
      else if (result.verificationStatus === "discrepancy" || result.verificationStatus === "disputed") discrepancy += 1;
      else if (result.verificationStatus === "rejected") rejected += 1;
      else pending += 1;

      const regionId = String(result.regionId?._id || result.regionId || "");
      const regionName = result.regionId?.name || regionId || "Unassigned region";
      if (regionId) {
        if (!regions.has(regionId)) regions.set(regionId, { id: regionId, name: regionName, regionNumber: result.regionId?.regionNumber || null, submitted: 0, validVotes: 0, candidates: {} });
        const region = regions.get(regionId);
        region.submitted += 1;
        region.validVotes += result.manualTotals?.totalValidVotes || 0;
        for (const c of result.candidateResults || []) region.candidates[c.candidateName] = (region.candidates[c.candidateName] || 0) + c.manualVotes;
      }

      const constituencyId = String(result.constituencyId?._id || result.constituencyId || "");
      if (constituencyId) {
        const constituencyName = result.constituencyId?.name || constituencyId;
        if (!constituencies.has(constituencyId)) constituencies.set(constituencyId, { id: constituencyId, name: constituencyName, constituencyNumber: result.constituencyId?.constituencyNumber || null, regionId, submitted: 0, validVotes: 0, candidates: {} });
        const constituency = constituencies.get(constituencyId);
        constituency.submitted += 1;
        constituency.validVotes += result.manualTotals?.totalValidVotes || 0;
        for (const c of result.candidateResults || []) constituency.candidates[c.candidateName] = (constituency.candidates[c.candidateName] || 0) + c.manualVotes;
      }

      for (const c of result.candidateResults || []) national[c.candidateName] = (national[c.candidateName] || 0) + c.manualVotes;
    });

    const allOrganizations = await Result.distinct("organizationId");
    const organizationsWithNoResults = allOrganizations.filter(Boolean).map(String);
    if (!organizationId && organizationsWithNoResults.length) {
      const orgDocs = await Organization.find({ _id: { $in: organizationsWithNoResults } }).select("name organizationType politicalPartyName").lean();
      orgDocs.forEach(org => organizationMap.set(String(org._id), { id: String(org._id), name: org.name, organizationType: org.organizationType, politicalPartyName: org.politicalPartyName }));
    }

    const electionTypes = Array.from(electionTypeSet).sort();
    if (!electionType) {
      const types = await Election.distinct("type");
      types.forEach(type => electionTypeSet.add(type));
    }

    res.json({
      success: true,
      filters: {
        organizations: Array.from(organizationMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
        elections: matchingElections,
        electionTypes: Array.from(electionTypeSet).sort(),
      },
      selection: { organizationId: organizationId || "all", electionId: electionId || "all", electionType: electionType || "all" },
      summary: { submittedStations, totalVotes, pending, verified, discrepancy, rejected },
      national,
      regions: Array.from(regions.values()).sort((a, b) => a.name.localeCompare(b.name)),
      constituencies: Array.from(constituencies.values()).sort((a, b) => a.name.localeCompare(b.name)),
      electionsInResults: Array.from(electionMap.values()),
    });
  } catch (error) {
    console.error("results dashboard:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getResults = async (req, res) => {
  try {
    const filter = {};
    if (req.params.electionId) filter.electionId = req.params.electionId;
    if (req.query.organizationId) filter.organizationId = req.query.organizationId;
    const results = await Result.find(filter)
      .populate("submittedBy", "fullName role email phoneNumber")
      .populate("organizationId", "name organizationType politicalPartyName")
      .populate("electionId", "name year type country status")
      .populate("regionId", "name regionNumber")
      .populate("constituencyId", "name constituencyNumber")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: results.length, results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
