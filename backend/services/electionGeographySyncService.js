const Region = require("../models/Region");
const Constituency = require("../models/Constituency");
const PollingStation = require("../models/PollingStation");
const Election = require("../models/Election");
const Organization = require("../models/Organization");
const ElectionGeographySnapshot = require("../models/ElectionGeographySnapshot");

const SYSTEM_PARTIES = (Organization.PERMANENT_POLITICAL_PARTIES || []).filter((name) => name !== "Independent");

async function synchronizeElectionParties(election) {
  const organizations = await Organization.find({
    organizationType: "political_party",
    organizationStatus: "approved",
    politicalPartyName: { $in: SYSTEM_PARTIES },
  }).select("_id name politicalPartyName logo").lean();
  const byName = new Map(organizations.map((o) => [String(o.politicalPartyName || o.name).trim().toLowerCase(), o]));
  const existing = new Map((Array.isArray(election.parties) ? election.parties : []).map((p) => [String(p.name || "").trim().toLowerCase(), p]));
  const parties = [];
  for (const name of SYSTEM_PARTIES) {
    const org = byName.get(name.toLowerCase());
    const old = existing.get(name.toLowerCase());
    parties.push({
      partyId: org?._id || old?.partyId || null,
      name: org?.politicalPartyName || name,
      logoUrl: org?.logo || old?.logoUrl || "",
    });
  }
  election.parties = parties;
  await election.save();
  return parties;
}

async function synchronizeAllElectionParties() {
  const elections = await Election.find({}).select("_id parties");
  let synchronized = 0;
  for (const election of elections) {
    await synchronizeElectionParties(election);
    synchronized += 1;
  }
  return { elections: synchronized, parties: SYSTEM_PARTIES };
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
  const snapshot = await ElectionGeographySnapshot.findOneAndUpdate(
    { electionId },
    { $set: { source: "PoliSync official electoral geography", sourceYear: pollingStations.reduce((max, s) => Math.max(max, Number(s.sourceYear) || 0), 0) || null, synchronizedAt: new Date(), regions: regions.length, constituencies: validConstituencies.length, pollingStations: validStations.length, geographyVersion: "current", status: "synchronized", error: "" } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return { snapshot, counts: { regions: regions.length, constituencies: validConstituencies.length, pollingStations: validStations.length }, expected: { regions: 16, constituencies: 276 } };
}

async function getElectionGeographyStatus(electionId) { return ElectionGeographySnapshot.findOne({ electionId }).lean(); }

module.exports = { synchronizeElectionGeography, synchronizeElectionParties, synchronizeAllElectionParties, getElectionGeographyStatus };
