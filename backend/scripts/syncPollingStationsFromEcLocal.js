const fs = require("fs");
const path = require("path");
const Region = require("../models/Region");
const Constituency = require("../models/Constituency");
const PollingStation = require("../models/PollingStation");

const SOURCE_FILE = path.join(__dirname, "../data/ghana_polling_stations_2024.csv");
let syncPromise = null;

function normalize(value) {
  return String(value || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}
function key(value) {
  return normalize(value).toLowerCase().replace(/[’'`]/g, "").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}
function parseCSVLine(line) {
  const out = []; let value = ""; let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { value += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === "," && !quoted) { out.push(value); value = ""; }
    else value += ch;
  }
  out.push(value);
  return out;
}
function readRows() {
  if (!fs.existsSync(SOURCE_FILE)) throw new Error(`EC polling-station CSV not found: ${SOURCE_FILE}`);
  const lines = fs.readFileSync(SOURCE_FILE, "utf8").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("EC polling-station CSV contains no records.");
  const headers = parseCSVLine(lines[0]).map(normalize);
  const required = ["polling_station_code", "polling_station_name", "constituency", "district", "region"];
  for (const h of required) if (!headers.includes(h)) throw new Error(`Missing EC CSV column: ${h}`);
  return lines.slice(1).map(parseCSVLine).map(values => Object.fromEntries(headers.map((h, i) => [h, normalize(values[i])])));
}

async function syncPollingStationsFromEcPdf() {
  if (syncPromise) return syncPromise;
  syncPromise = (async () => {
    const rows = readRows();
    const [regions, constituencies] = await Promise.all([
      Region.find({ isActive: true }).lean(),
      Constituency.find({ isActive: true }).lean(),
    ]);
    if (regions.length !== 16) throw new Error(`Expected 16 active regions; found ${regions.length}.`);
    if (constituencies.length < 276) throw new Error(`Expected at least 276 active constituencies; found ${constituencies.length}.`);

    const regionMap = new Map(regions.map(r => [key(r.name), r]));
    const constituencyMap = new Map();
    for (const c of constituencies) {
      constituencyMap.set(`${String(c.regionId)}::${key(c.name)}`, c);
    }

    const operations = [];
    const seen = new Set();
    let skipped = 0;
    for (const row of rows) {
      const code = normalize(row.polling_station_code).toUpperCase();
      if (!code || seen.has(code)) { if (!code) skipped++; continue; }
      seen.add(code);
      const region = regionMap.get(key(row.region));
      const constituency = region && constituencyMap.get(`${String(region._id)}::${key(row.constituency)}`);
      if (!region || !constituency || !row.polling_station_name || !row.district) { skipped++; continue; }
      operations.push({ updateOne: { filter: { pollingStationCode: code }, update: { $set: {
        pollingStationCode: code,
        name: row.polling_station_name,
        regionId: region._id,
        constituencyId: constituency._id,
        district: row.district,
        stationType: "ordinary",
        source: row.source || "Ghana Electoral Commission 2024 Polling Stations",
        sourceYear: 2024,
        isActive: true,
      } }, upsert: true } });
    }
    if (operations.length < 1000) throw new Error(`Only ${operations.length} valid EC polling stations could be linked; refusing incomplete sync.`);

    const bulk = await PollingStation.bulkWrite(operations, { ordered: false });
    const activeCount = await PollingStation.countDocuments({ isActive: true });
    console.log(`✅ EC CSV sync complete: ${activeCount.toLocaleString()} active polling stations; ${operations.length.toLocaleString()} linked; ${skipped.toLocaleString()} skipped.`);
    return { count: activeCount, matchedRows: operations.length, skipped, modified: bulk.modifiedCount || 0, upserted: bulk.upsertedCount || 0 };
  })().finally(() => { syncPromise = null; });
  return syncPromise;
}

module.exports = { syncPollingStationsFromEcPdf, SOURCE_FILE };
