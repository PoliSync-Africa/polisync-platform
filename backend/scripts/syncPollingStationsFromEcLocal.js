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
  return lines.slice(1).map(parseCSVLine).map(values => Object.fromEntries(headers.map((h, i) => [h, normalize(values[i])])))
    .filter(row => row.polling_station_code);
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

    // Build candidate lists by name instead of relying on a single region
    // document. This is important when a database contains duplicate legacy
    // Region records: the UI may use one region _id while the importer had
    // previously linked stations to another _id for the same named region.
    const regionNameById = new Map(regions.map(r => [String(r._id), key(r.name)]));
    const regionCandidates = new Map();
    for (const region of regions) {
      const k = key(region.name);
      const list = regionCandidates.get(k) || [];
      list.push(region);
      regionCandidates.set(k, list);
    }

    const constituencyCandidates = new Map();
    for (const c of constituencies) {
      const k = key(c.name);
      const list = constituencyCandidates.get(k) || [];
      list.push(c);
      constituencyCandidates.set(k, list);
    }

    const operations = [];
    const seen = new Set();
    let skipped = 0;
    let ambiguous = 0;

    for (const row of rows) {
      const code = normalize(row.polling_station_code).toUpperCase();
      if (!code || seen.has(code)) { if (!code) skipped++; continue; }
      seen.add(code);

      const regionKey = key(row.region);
      const regionOptions = regionCandidates.get(regionKey) || [];
      const constituencyOptions = constituencyCandidates.get(key(row.constituency)) || [];

      // Prefer a constituency whose referenced region has the same EC region
      // name. If there are duplicate legacy records, prefer the candidate whose
      // region _id is also one of the active region records for this EC region.
      let constituency = constituencyOptions.find(c => {
        const candidateRegionKey = regionNameById.get(String(c.regionId));
        return candidateRegionKey === regionKey;
      });

      // If no matching region relationship exists, use the unique constituency
      // name as a safe fallback. Ghana's parliamentary constituency names are
      // unique within the official geography dataset.
      if (!constituency && constituencyOptions.length === 1) {
        constituency = constituencyOptions[0];
      }

      let region = regionOptions.find(r => String(r._id) === String(constituency?.regionId)) || regionOptions[0];

      if (!region || !constituency || !row.polling_station_name || !row.district) {
        skipped++;
        continue;
      }
      if (constituencyOptions.length > 1) ambiguous++;

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
    console.log(`EC CSV sync complete: ${activeCount.toLocaleString()} active polling stations; ${operations.length.toLocaleString()} linked; ${skipped.toLocaleString()} skipped; ${ambiguous.toLocaleString()} duplicate-name candidates resolved.`);
    return { count: activeCount, matchedRows: operations.length, skipped, ambiguous, modified: bulk.modifiedCount || 0, upserted: bulk.upsertedCount || 0 };
  })().finally(() => { syncPromise = null; });
  return syncPromise;
}

module.exports = { syncPollingStationsFromEcPdf, SOURCE_FILE };
