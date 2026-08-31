const Result = require("../models/Result");
const Election = require("../models/Election");
const Organization = require("../models/Organization");
const Region = require("../models/Region");
const Constituency = require("../models/Constituency");
const PollingStation = require("../models/PollingStation");

const id = (value) => String(value || "").trim();

function addCandidateTotals(target, candidates = []) {
  for (const candidate of candidates) {
    const key = candidate.candidateName || candidate.candidateId;
    if (!key) continue;
    target[key] = (target[key] || 0) + Number(candidate.manualVotes || 0);
  }
}

exports.dashboard = async (req, res) => {
  try {
    const organizationId = id(req.query.organizationId);
    const electionId = id(req.query.electionId);
    const electionType = id(req.query.electionType);
    const regionId = id(req.query.regionId);
    const constituencyId = id(req.query.constituencyId);
    const pollingStationId = id(req.query.pollingStationId);
    const view = id(req.query.view) || "national";

    const electionFilter = {};
    if (electionId && electionId !== "all") electionFilter._id = electionId;
    if (electionType && electionType !== "all") electionFilter.type = electionType;
    const elections = await Election.find(electionFilter)
      .select("name year type country status")
      .sort({ year: -1, createdAt: -1 })
      .lean();
    const electionIds = elections.map((e) => e._id);

    const resultMatch = {};
    if (organizationId && organizationId !== "all") resultMatch.organizationId = organizationId;
    if (electionIds.length) resultMatch.electionId = { $in: electionIds };
    else if (electionId && electionId !== "all") resultMatch.electionId = electionId;
    if (regionId && regionId !== "all") resultMatch.regionId = regionId;
    if (constituencyId && constituencyId !== "all") resultMatch.constituencyId = constituencyId;
    if (pollingStationId && pollingStationId !== "all") resultMatch.pollingStationId = pollingStationId;
    if (req.user.role === "polling_station_agent") resultMatch.submittedBy = req.user._id;

    const results = await Result.find(resultMatch).lean();

    const national = {};
    const regionTotals = new Map();
    const constituencyTotals = new Map();
    const stationTotals = new Map();
    let validVotes = 0;
    let submittedStations = 0;
    let pending = 0;
    let verified = 0;
    let discrepancy = 0;
    let rejected = 0;

    for (const result of results) {
      submittedStations += 1;
      validVotes += Number(result.manualTotals?.totalValidVotes || 0);
      if (result.verificationStatus === "verified") verified += 1;
      else if (["discrepancy", "disputed"].includes(result.verificationStatus)) discrepancy += 1;
      else if (result.verificationStatus === "rejected") rejected += 1;
      else pending += 1;
      addCandidateTotals(national, result.candidateResults);

      const rKey = id(result.regionId);
      if (rKey) {
        if (!regionTotals.has(rKey)) regionTotals.set(rKey, { id: rKey, submitted: 0, validVotes: 0, candidates: {} });
        const item = regionTotals.get(rKey);
        item.submitted += 1;
        item.validVotes += Number(result.manualTotals?.totalValidVotes || 0);
        addCandidateTotals(item.candidates, result.candidateResults);
      }
      const cKey = id(result.constituencyId);
      if (cKey) {
        if (!constituencyTotals.has(cKey)) constituencyTotals.set(cKey, { id: cKey, regionId: rKey, submitted: 0, validVotes: 0, candidates: {} });
        const item = constituencyTotals.get(cKey);
        item.submitted += 1;
        item.validVotes += Number(result.manualTotals?.totalValidVotes || 0);
        addCandidateTotals(item.candidates, result.candidateResults);
      }
      const sKey = id(result.pollingStationId);
      if (sKey) {
        if (!stationTotals.has(sKey)) stationTotals.set(sKey, { id: sKey, constituencyId: cKey, regionId: rKey, submitted: 0, validVotes: 0, candidates: {} });
        const item = stationTotals.get(sKey);
        item.submitted += 1;
        item.validVotes += Number(result.manualTotals?.totalValidVotes || 0);
        addCandidateTotals(item.candidates, result.candidateResults);
      }
    }

    const organizations = await Organization.find({})
      .select("name organizationType politicalPartyName organizationStatus")
      .sort({ name: 1 })
      .lean();
    const regions = await Region.find({ isActive: true })
      .select("name regionNumber country")
      .sort({ regionNumber: 1, name: 1 })
      .lean();

    const constituencyFilter = { isActive: true };
    if (regionId && regionId !== "all") constituencyFilter.regionId = regionId;
    const constituencies = await Constituency.find(constituencyFilter)
      .select("name constituencyNumber district regionId")
      .populate("regionId", "name regionNumber")
      .sort({ regionId: 1, constituencyNumber: 1, name: 1 })
      .lean();

    const stationFilter = { isActive: true };
    if (regionId && regionId !== "all") stationFilter.regionId = regionId;
    if (constituencyId && constituencyId !== "all") stationFilter.constituencyId = constituencyId;
    const pollingStations = await PollingStation.find(stationFilter)
      .select("name pollingStationCode district stationType regionId constituencyId")
      .populate("regionId", "name regionNumber")
      .populate("constituencyId", "name constituencyNumber")
      .sort({ pollingStationCode: 1, name: 1 })
      .lean();

    const decorate = (items, totals) => items.map((item) => {
      const t = totals.get(id(item._id)) || {};
      return { ...item, submitted: t.submitted || 0, validVotes: t.validVotes || 0, candidates: t.candidates || {} };
    });

    const selectedRegion = regionId && regionId !== "all" ? await Region.findById(regionId).select("name regionNumber").lean() : null;
    const selectedConstituency = constituencyId && constituencyId !== "all" ? await Constituency.findById(constituencyId).select("name constituencyNumber district regionId").populate("regionId", "name regionNumber").lean() : null;
    const selectedStation = pollingStationId && pollingStationId !== "all" ? await PollingStation.findById(pollingStationId).select("name pollingStationCode district stationType regionId constituencyId").populate("regionId", "name regionNumber").populate("constituencyId", "name constituencyNumber").lean() : null;

    res.json({
      success: true,
      source: "PoliSync EC electoral geography",
      filters: {
        organizations,
        elections,
        electionTypes: await Election.distinct("type"),
        regions,
        constituencies,
        pollingStations,
      },
      selection: { view, organizationId: organizationId || "all", electionId: electionId || "all", electionType: electionType || "all", regionId: regionId || "all", constituencyId: constituencyId || "all", pollingStationId: pollingStationId || "all" },
      selected: { region: selectedRegion, constituency: selectedConstituency, pollingStation: selectedStation },
      summary: { submittedStations, validVotes, pending, verified, discrepancy, rejected },
      national,
      regional: decorate(regions, regionTotals),
      constituency: decorate(constituencies, constituencyTotals),
      pollingStation: decorate(pollingStations, stationTotals),
    });
  } catch (error) {
    console.error("dynamic results dashboard:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
