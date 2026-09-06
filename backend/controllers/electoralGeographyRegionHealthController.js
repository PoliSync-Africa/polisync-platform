const Region = require("../models/Region");
const Constituency = require("../models/Constituency");
const PollingStation = require("../models/PollingStation");
const { checkElectoralGeographyIntegrity } = require("../services/electoralGeographyIntegrityService");

exports.report = async (req, res) => {
  try {
    const [regions, constituencies, pollingStations, integrity] = await Promise.all([
      Region.find({ isActive: true }).select("_id name slug regionNumber").sort({ regionNumber: 1 }).lean(),
      Constituency.find({ isActive: true }).select("_id regionId").lean(),
      PollingStation.find({ isActive: true }).select("_id pollingStationCode regionId constituencyId").lean(),
      checkElectoralGeographyIntegrity(),
    ]);

    const byRegion = new Map(regions.map((region) => [region._id.toString(), {
      regionId: region._id,
      regionNumber: region.regionNumber,
      name: region.name,
      slug: region.slug,
      constituencyCount: 0,
      pollingStationCount: 0,
      orphanConstituencyCount: 0,
      orphanPollingStationCount: 0,
      duplicateConstituencyGroupCount: 0,
      duplicateStationCodeGroupCount: 0,
      parentMismatchCount: 0,
      status: "Healthy",
    }]));

    for (const constituency of constituencies) {
      const row = byRegion.get(constituency.regionId?.toString());
      if (row) row.constituencyCount += 1;
    }

    for (const station of pollingStations) {
      const row = byRegion.get(station.regionId?.toString());
      if (row) row.pollingStationCount += 1;
    }

    for (const item of integrity.details.orphanConstituencies || []) {
      const row = byRegion.get(item.regionId?.toString());
      if (row) row.orphanConstituencyCount += 1;
    }

    for (const item of integrity.details.orphanPollingStations || []) {
      const row = byRegion.get(item.regionId?.toString());
      if (row) row.orphanPollingStationCount += 1;
    }

    for (const group of integrity.details.duplicateConstituencyGroups || []) {
      const regionId = group.records?.[0]?.regionId?.toString();
      const row = byRegion.get(regionId);
      if (row) row.duplicateConstituencyGroupCount += 1;
    }

    for (const group of integrity.details.duplicateStationGroups || []) {
      const regionId = group.records?.[0]?.regionId?.toString();
      const row = byRegion.get(regionId);
      if (row) row.duplicateStationCodeGroupCount += 1;
    }

    for (const item of integrity.details.inconsistentStationParents || []) {
      const row = byRegion.get(item.stationRegionId?.toString());
      if (row) row.parentMismatchCount += 1;
    }

    const data = Array.from(byRegion.values()).map((row) => {
      const hasIssue = row.orphanConstituencyCount || row.orphanPollingStationCount || row.duplicateConstituencyGroupCount || row.duplicateStationCodeGroupCount || row.parentMismatchCount;
      const missingConstituencies = row.constituencyCount === 0;
      return { ...row, status: hasIssue || missingConstituencies ? "Needs Review" : "Healthy" };
    });

    return res.json({
      success: true,
      data: {
        checkedAt: integrity.checkedAt,
        expectedRegions: 16,
        activeRegions: regions.length,
        healthyRegions: data.filter((r) => r.status === "Healthy").length,
        regionsNeedingReview: data.filter((r) => r.status === "Needs Review").length,
        regions: data,
      },
    });
  } catch (error) {
    console.error("Regional electoral health report failed:", error);
    return res.status(500).json({ success: false, code: "ELECTORAL_REGION_HEALTH_FAILED", message: "Unable to build the regional electoral health report." });
  }
};
