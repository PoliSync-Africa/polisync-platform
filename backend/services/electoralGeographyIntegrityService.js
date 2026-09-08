const Region = require("../models/Region");
const Constituency = require("../models/Constituency");
const PollingStation = require("../models/PollingStation");

const EXPECTED_GHANA_CONSTITUENCIES = 276;
const EXPECTED_CONSTITUENCIES_BY_REGION = {
  Ahafo: 6,
  Ashanti: 47,
  Bono: 12,
  "Bono East": 11,
  Central: 23,
  Eastern: 33,
  "Greater Accra": 34,
  "North East": 6,
  Northern: 18,
  Oti: 9,
  Savannah: 7,
  "Upper East": 15,
  "Upper West": 11,
  Volta: 18,
  Western: 17,
  "Western North": 9,
};

async function checkElectoralGeographyIntegrity() {
  const [regions, constituencies, pollingStations] = await Promise.all([
    Region.find({ isActive: true }).select("_id name slug regionNumber").sort({ regionNumber: 1, name: 1 }).lean(),
    Constituency.find({ isActive: true }).select("_id name slug regionId district constituencyNumber").lean(),
    PollingStation.find({ isActive: true }).select("_id pollingStationCode name regionId constituencyId district stationType source sourceYear").lean(),
  ]);

  const regionIds = new Set(regions.map((r) => r._id.toString()));
  const constituencyIds = new Set(constituencies.map((c) => c._id.toString()));
  const constituencyCountsByRegion = new Map();
  for (const constituency of constituencies) {
    const key = constituency.regionId?.toString();
    constituencyCountsByRegion.set(key, (constituencyCountsByRegion.get(key) || 0) + 1);
  }

  const regionalCoverage = regions.map((region) => {
    const actual = constituencyCountsByRegion.get(region._id.toString()) || 0;
    const expected = EXPECTED_CONSTITUENCIES_BY_REGION[region.name] ?? null;
    return {
      regionId: region._id,
      regionNumber: region.regionNumber,
      name: region.name,
      expectedConstituencies: expected,
      actualConstituencies: actual,
      constituencyGap: expected === null ? null : actual - expected,
      complete: expected === null ? actual > 0 : actual === expected,
    };
  });

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
    if (items.length > 1) duplicateConstituencyGroups.push({ key, records: items.map((c) => ({ id: c._id, name: c.name, regionId: c.regionId })) });
  }

  const duplicateStationGroups = [];
  const stationCodes = new Map();
  for (const station of pollingStations) {
    const code = String(station.pollingStationCode || "").trim().toUpperCase();
    if (!stationCodes.has(code)) stationCodes.set(code, []);
    stationCodes.get(code).push(station);
  }
  for (const [code, items] of stationCodes) {
    if (code && items.length > 1) duplicateStationGroups.push({ code, records: items.map((s) => ({ id: s._id, name: s.name, constituencyId: s.constituencyId, regionId: s.regionId })) });
  }

  const inconsistentStationParents = [];
  const constituencyMap = new Map(constituencies.map((c) => [c._id.toString(), c]));
  for (const station of pollingStations) {
    const constituency = constituencyMap.get(station.constituencyId?.toString());
    if (!constituency) continue;
    if (station.regionId?.toString() !== constituency.regionId?.toString()) inconsistentStationParents.push({ id: station._id, code: station.pollingStationCode, constituencyId: station.constituencyId, stationRegionId: station.regionId, constituencyRegionId: constituency.regionId });
  }

  const expectedGhanaRegions = 16;
  const issues = [];
  if (regions.length !== expectedGhanaRegions) issues.push(`Expected ${expectedGhanaRegions} active Ghana regions, found ${regions.length}.`);
  if (constituencies.length !== EXPECTED_GHANA_CONSTITUENCIES) issues.push(`Expected ${EXPECTED_GHANA_CONSTITUENCIES} active Ghana constituencies, found ${constituencies.length}.`);
  for (const coverage of regionalCoverage) if (!coverage.complete) issues.push(`${coverage.name}: expected ${coverage.expectedConstituencies ?? "a valid"} active constituencies, found ${coverage.actualConstituencies}.`);
  if (orphanConstituencies.length) issues.push(`${orphanConstituencies.length} active constituencies reference a missing/inactive region.`);
  if (orphanPollingStations.length) issues.push(`${orphanPollingStations.length} active polling stations reference a missing/inactive parent.`);
  if (duplicateConstituencyGroups.length) issues.push(`${duplicateConstituencyGroups.length} duplicate constituency-name groups require review.`);
  if (duplicateStationGroups.length) issues.push(`${duplicateStationGroups.length} duplicate polling-station codes require review.`);
  if (inconsistentStationParents.length) issues.push(`${inconsistentStationParents.length} polling stations have a region/constituency parent mismatch.`);

  return {
    healthy: issues.length === 0,
    checkedAt: new Date().toISOString(),
    counts: { regions: regions.length, constituencies: constituencies.length, pollingStations: pollingStations.length, expectedRegions: expectedGhanaRegions, expectedConstituencies: EXPECTED_GHANA_CONSTITUENCIES },
    coverage: { constituencyCountComplete: constituencies.length === EXPECTED_GHANA_CONSTITUENCIES, regionsComplete: regions.length === expectedGhanaRegions, regionalConstituencies: regionalCoverage },
    issues,
    details: { orphanConstituencies, orphanPollingStations, duplicateConstituencyGroups, duplicateStationGroups, inconsistentStationParents, regionalCoverage },
  };
}

module.exports = { checkElectoralGeographyIntegrity, EXPECTED_GHANA_CONSTITUENCIES, EXPECTED_CONSTITUENCIES_BY_REGION };
