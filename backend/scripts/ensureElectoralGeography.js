const { execFile } = require("child_process");
const { promisify } = require("util");
const Region = require("../models/Region");
const Constituency = require("../models/Constituency");
const PollingStation = require("../models/PollingStation");

const execFileAsync = promisify(execFile);

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

  console.log(`🗺️ Electoral geography incomplete (${regions}/${16} regions, ${constituencies}/${276} constituencies, ${pollingStations} polling stations). Starting canonical Ghana EC import...`);
  const { stdout, stderr } = await execFileAsync(process.execPath, [require("path").join(__dirname, "seedElectoralGeography.js")], {
    cwd: require("path").join(__dirname, ".."),
    env: process.env,
    maxBuffer: 20 * 1024 * 1024,
  });
  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);
}

module.exports = { ensureElectoralGeography };
