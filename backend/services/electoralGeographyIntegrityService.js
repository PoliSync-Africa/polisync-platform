const Region = require("../models/Region");
const Constituency = require("../models/Constituency");
const PollingStation = require("../models/PollingStation");

async function checkElectoralGeographyIntegrity() {
  const [regions, constituencies, pollingStations] = await Promise.all([
    Region.find({ isActive: true }).select("_id name slug regionNumber").sort({ regionNumber: 1 }).lean(),
    Constituency.find({ isActive: true }).select("_id name slug regionId district constituencyNumber").lean(),
    PollingStation.find({ isActive: true }).select("_id pollingStationCode name regionId constituencyId district stationType source sourceYear").lean(),
  ]);

  const regionIds = new Set(regions.map((r) => r._id.toString()));
  const constituencyIds = new Set(constituencies.map((c) => c._id.toString()));

  const orphanConstituencies = constituencies.filter((c) => !regionIds.has(c.regionId?.toString())).map((c) => ({
    id: c._id,
    name: c.name,
    regionId: c.regionId || null,
  }));

  const orphanPollingStations = pollingStations.filter((s) =>
    !regionIds.has(s.regionId?.toString()) || !constituencyIds.has(s.constituencyId?.toString())
  ).map((s) => ({
    id: s._id,
    code: s.pollingStationCode,
    name: s.name,
    regionId: s.regionId || null,
    constituencyId: s.constituencyId || null,
  }));

  const duplicateConstituencyGroups = [];
  const constituencyNames = new Map();
  for (const constituency of constituencies) {
    const key = `${constituency.regionId?.toString() || "missing"}|${String(constituency.name || "").trim().toLowerCase()}`;
    if (!constituencyNames.has(key)) constituencyNames.set(key, []);
    constituencyNames.get(key).push(constituency);
  }
  for (const [key, items] of constituencyNames) {
    if (items.length > 1) {
      duplicateConstituencyGroups.push({
        key,
        records: items.map((c) => ({ id: c._id, name: c.name, regionId: c.regionId })),
      });
    }
  }

  const duplicateStationGroups = [];
  const stationCodes = new Map();
  for (const station of pollingStations) {
    const code = String(station.pollingStationCode || "").trim().toUpperCase();
    if (!stationCodes.has(code)) stationCodes.set(code, []);
    stationCodes.get(code).push(station);
  }
  for (const [code, items] of stationCodes) {
    if (code && items.length > 1) {
      duplicateStationGroups.push({
        code,
        records: items.map((s) => ({ id: s._id, name: s.name, constituencyId: s.constituencyId, regionId: s.regionId })),
      });
    }
  }

  const inconsistentStationParents = [];
  const constituencyMap = new Map(constituencies.map((c) => [c._id.toString(), c]));
  for (const station of pollingStations) {
    const constituency = constituencyMap.get(station.constituencyId?.toString());
    if (!constituency) continue;
    if (station.regionId?.toString() !== constituency.regionId?.toString()) {
      inconsistentStationParents.push({
        id: station._id,
        code: station.pollingStationCode,
        constituencyId: station.constituencyId,
        stationRegionId: station.regionId,
        constituencyRegionId: constituency.regionId,
      });
    }
  }

  const expectedGhanaRegions = 16;
  const issues = [];
  if (regions.length !== expectedGhanaRegions) issues.push(`Expected ${expectedGhanaRegions} active Ghana regions, found ${regions.length}.`);
  if (orphanConstituencies.length) issues.push(`${orphanConstituencies.length} active constituencies reference a missing/inactive region.`);
  if (orphanPollingStations.length) issues.push(`${orphanPollingStations.length} active polling stations reference a missing/inactive parent.`);
  if (duplicateConstituencyGroups.length) issues.push(`${duplicateConstituencyGroups.length} duplicate constituency-name groups require review.`);
  if (duplicateStationGroups.length) issues.push(`${duplicateStationGroups.length} duplicate polling-station codes require review.`);
  if (inconsistentStationParents.length) issues.push(`${inconsistentStationParents.length} polling stations have a region/constituency parent mismatch.`);

  return {
    healthy: issues.length === 0,
    checkedAt: new Date().toISOString(),
    counts: {
      regions: regions.length,
      constituencies: constituencies.length,
      pollingStations: pollingStations.length,
    },
    issues,
    details: {
      orphanConstituencies,
      orphanPollingStations,
      duplicateConstituencyGroups,
      duplicateStationGroups,
      inconsistentStationParents,
    },
  };
}

module.exports = { checkElectoralGeographyIntegrity };
