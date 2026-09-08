const Region = require("../models/Region");
const Constituency = require("../models/Constituency");
const PollingStation = require("../models/PollingStation");
const ElectionGeographySnapshot = require("../models/ElectionGeographySnapshot");

async function synchronizeElectionGeography(electionId) {
  const [regions, constituencies, pollingStations] = await Promise.all([
    Region.find({ isActive: true }).select("_id name regionNumber sourceYear source").lean(),
    Constituency.find({ isActive: true }).select("_id name constituencyNumber regionId sourceYear source").lean(),
    PollingStation.find({ isActive: true }).select("_id name pollingStationCode regionId constituencyId district stationType sourceYear source").lean(),
  ]);

  const regionIds = new Set(regions.map((r) => String(r._id)));
  const constituencyIds = new Set(constituencies.map((c) => String(c._id)));
  const validConstituencies = constituencies.filter((c) => regionIds.has(String(c.regionId)));
  const validStations = pollingStations.filter((s) => regionIds.has(String(s.regionId)) && constituencyIds.has(String(s.constituencyId)));

  const snapshot = await ElectionGeographySnapshot.findOneAndUpdate(
    { electionId },
    {
      $set: {
        source: "PoliSync official electoral geography",
        sourceYear: pollingStations.reduce((max, s) => Math.max(max, Number(s.sourceYear) || 0), 0) || null,
        synchronizedAt: new Date(),
        regions: regions.length,
        constituencies: validConstituencies.length,
        pollingStations: validStations.length,
        geographyVersion: "current",
        status: "synchronized",
        error: "",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return {
    snapshot,
    counts: {
      regions: regions.length,
      constituencies: validConstituencies.length,
      pollingStations: validStations.length,
    },
    expected: { regions: 16, constituencies: 276 },
  };
}

async function getElectionGeographyStatus(electionId) {
  return ElectionGeographySnapshot.findOne({ electionId }).lean();
}

module.exports = { synchronizeElectionGeography, getElectionGeographyStatus };
