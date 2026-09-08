const Region = require("../models/Region");
const Constituency = require("../models/Constituency");
const PollingStation = require("../models/PollingStation");
const Election = require("../models/Election");
const Organization = require("../models/Organization");
const ElectionGeographySnapshot = require("../models/ElectionGeographySnapshot");

async function getApprovedParties() {
  return Organization.find({ organizationType: "political_party", organizationStatus: "approved" }).select("_id name politicalPartyName logo").lean();
}

async function synchronizeElectionParties(election) {
  const organizations = await getApprovedParties();
  const existing = new Map((Array.isArray(election.parties) ? election.parties : []).map((p) => [String(p.partyId || p.name || "").trim().toLowerCase(), p]));
  election.parties = organizations.map((org) => {
    const name = org.politicalPartyName || org.name;
    const old = existing.get(String(org._id).toLowerCase()) || existing.get(String(name).trim().toLowerCase());
    return { partyId: org._id, name, logoUrl: org.logo || old?.logoUrl || "" };
  });
  await election.save();
  return election.parties;
}

async function synchronizeAllElectionParties() {
  const elections = await Election.find({}).select("_id parties");
  let synchronized = 0;
  for (const election of elections) { await synchronizeElectionParties(election); synchronized += 1; }
  const organizations = await getApprovedParties();
  return { elections: synchronized, parties: organizations.map((o) => o.politicalPartyName || o.name) };
}

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
  const counts = { regions: regions.length, constituencies: validConstituencies.length, pollingStations: validStations.length };
  const synchronizedAt = new Date();

  await Election.findByIdAndUpdate(electionId, {
    $set: {
      totalRegions: counts.regions,
      totalConstituencies: counts.constituencies,
      totalPollingStations: counts.pollingStations,
      geographySynchronizedAt: synchronizedAt,
    },
  });

  const snapshot = await ElectionGeographySnapshot.findOneAndUpdate(
    { electionId },
    { $set: { source: "PoliSync official electoral geography", sourceYear: pollingStations.reduce((max, s) => Math.max(max, Number(s.sourceYear) || 0), 0) || null, synchronizedAt, regions: counts.regions, constituencies: counts.constituencies, pollingStations: counts.pollingStations, geographyVersion: "current", status: "synchronized", error: "" } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return { snapshot, counts, expected: { regions: 16, constituencies: 276 } };
}

async function synchronizeAllElectionGeography() {
  const elections = await Election.find({}).select("_id").lean();
  let synchronized = 0;
  for (const election of elections) { await synchronizeElectionGeography(election._id); synchronized += 1; }
  return { elections: synchronized };
}

async function getElectionGeographyStatus(electionId) { return ElectionGeographySnapshot.findOne({ electionId }).lean(); }
module.exports = { synchronizeElectionGeography, synchronizeAllElectionGeography, synchronizeElectionParties, synchronizeAllElectionParties, getElectionGeographyStatus };
