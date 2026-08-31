const { syncPollingStationsFromEcPdf } = require("./syncPollingStationsFromEc");
const Region = require("../models/Region");
const Constituency = require("../models/Constituency");
const PollingStation = require("../models/PollingStation");

async function ensureElectoralGeography() {
  const [regions, constituencies, pollingStations] = await Promise.all([
    Region.countDocuments({ isActive: true }),
    Constituency.countDocuments({ isActive: true }),
    PollingStation.countDocuments({ isActive: true }),
  ]);

  if (regions >= 16 && constituencies >= 276 && pollingStations > 0) {
    console.log(`🗺️ Electoral geography ready: ${regions} regions, ${constituencies} constituencies, ${pollingStations} polling stations.`);
    return;
  }

  console.log(`🗺️ Electoral geography incomplete (${regions}/16 regions, ${constituencies}/276 constituencies, ${pollingStations} polling stations).`);

  // The old repository CSV placeholder is empty in the deployed project.
  // Use the official Ghana EC 2024 polling-station PDF as the authoritative source.
  if (pollingStations === 0) {
    await syncPollingStationsFromEcPdf();
  }
}

module.exports = { ensureElectoralGeography };
