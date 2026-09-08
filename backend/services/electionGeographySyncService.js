const Region = require("../models/Region");
const Constituency = require("../models/Constituency");
const PollingStation = require("../models/PollingStation");
const Election = require("../models/Election");
const Organization = require("../models/Organization");
const ElectionGeographySnapshot = require("../models/ElectionGeographySnapshot");

async function getApprovedParties() {
  return Organization.find({ organizationType: "political_party", organizationStatus: "approved" })
    .select("_id name politicalPartyName logo")
    .lean();
}

function partyNameKey(value) {
  return String(value || "").trim().toLowerCase();
}

/**
 * Synchronize canonical political-party organizations with every election.
 * Existing election party/candidate logos are first imported into the party
 * organization when that organization does not yet have a logo. The
 * organization then becomes the canonical source for all election logos.
 */
async function synchronizeAllElectionParties() {
  const [organizations, elections] = await Promise.all([
    getApprovedParties(),
    Election.find({}).select("_id parties candidates").lean(),
  ]);

  const organizationById = new Map(organizations.map((org) => [String(org._id), org]));
  const organizationByName = new Map(
    organizations.map((org) => [partyNameKey(org.politicalPartyName || org.name), org])
  );

  const logoUpdates = new Map();
  const rememberLogo = (partyId, partyName, logo) => {
    const normalizedLogo = String(logo || "").trim();
    if (!normalizedLogo) return;
    const org =
      (partyId && organizationById.get(String(partyId))) ||
      organizationByName.get(partyNameKey(partyName));
    if (!org || String(org.logo || "").trim()) return;
    logoUpdates.set(String(org._id), normalizedLogo);
  };

  for (const election of elections) {
    for (const party of Array.isArray(election.parties) ? election.parties : []) {
      rememberLogo(party.partyId, party.name, party.logoUrl);
    }
    for (const candidate of Array.isArray(election.candidates) ? election.candidates : []) {
      if (String(candidate.party || "").trim().toLowerCase() === "independent") continue;
      rememberLogo(candidate.partyId, candidate.party, candidate.partyLogoUrl);
    }
  }

  if (logoUpdates.size) {
    await Promise.all(
      Array.from(logoUpdates.entries()).map(([organizationId, logo]) =>
        Organization.updateOne({ _id: organizationId }, { $set: { logo } })
      )
    );
    logoUpdates.forEach((logo, organizationId) => {
      const org = organizationById.get(organizationId);
      if (org) org.logo = logo;
    });
  }

  const organizationParties = organizations.map((org) => ({
    partyId: org._id,
    name: org.politicalPartyName || org.name,
    logoUrl: String(org.logo || "").trim(),
  }));

  let synchronized = 0;
  for (const election of elections) {
    const oldById = new Map(
      (Array.isArray(election.parties) ? election.parties : []).map((party) => [String(party.partyId || ""), party])
    );
    const oldByName = new Map(
      (Array.isArray(election.parties) ? election.parties : []).map((party) => [partyNameKey(party.name), party])
    );

    const parties = organizationParties.map((party) => {
      const old = oldById.get(String(party.partyId)) || oldByName.get(partyNameKey(party.name));
      return {
        partyId: party.partyId,
        name: party.name,
        logoUrl: party.logoUrl || String(old?.logoUrl || "").trim(),
      };
    });

    const candidateByPartyId = new Map(parties.map((party) => [String(party.partyId), party]));
    const candidateByName = new Map(parties.map((party) => [partyNameKey(party.name), party]));
    const candidates = (Array.isArray(election.candidates) ? election.candidates : []).map((candidate) => {
      const party =
        (candidate.partyId && candidateByPartyId.get(String(candidate.partyId))) ||
        candidateByName.get(partyNameKey(candidate.party));
      if (!party) return candidate;
      return {
        ...candidate,
        partyId: party.partyId,
        party: party.name,
        partyLogoUrl: party.logoUrl || String(candidate.partyLogoUrl || "").trim(),
      };
    });

    await Election.updateOne({ _id: election._id }, { $set: { parties, candidates } });
    synchronized += 1;
  }

  return {
    elections: synchronized,
    parties: organizationParties.map((party) => party.name),
    logosImported: logoUpdates.size,
  };
}

async function synchronizeElectionParties(election) {
  const organizations = await getApprovedParties();
  const existing = new Map(
    (Array.isArray(election.parties) ? election.parties : []).map((p) => [partyNameKey(p.partyId || p.name), p])
  );
  election.parties = organizations.map((org) => {
    const name = org.politicalPartyName || org.name;
    const old = existing.get(String(org._id).toLowerCase()) || existing.get(partyNameKey(name));
    return {
      partyId: org._id,
      name,
      logoUrl: String(org.logo || old?.logoUrl || "").trim(),
    };
  });
  election.candidates = (Array.isArray(election.candidates) ? election.candidates : []).map((candidate) => {
    const party = election.parties.find(
      (item) => String(item.partyId) === String(candidate.partyId || "") || partyNameKey(item.name) === partyNameKey(candidate.party)
    );
    return party
      ? { ...(candidate.toObject?.() || candidate), partyId: party.partyId, party: party.name, partyLogoUrl: party.logoUrl || String(candidate.partyLogoUrl || "").trim() }
      : candidate;
  });
  await election.save();
  return election.parties;
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
