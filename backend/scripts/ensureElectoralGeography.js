const fs = require("fs");
const path = require("path");
const Region = require("../models/Region");
const Constituency = require("../models/Constituency");
const PollingStation = require("../models/PollingStation");
const { syncPollingStationsFromEcPdf, MIN_EXPECTED_POLLING_STATIONS, EXPECTED_TOTAL_POLLING_STATIONS } = require("./syncPollingStationsFromEc");

const GEOGRAPHY_FILE = path.join(__dirname, "../data/ghana_regions_constituencies.csv");
let hierarchyPromise = null;

function normalize(value) {
  return String(value || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function key(value) {
  return normalize(value).toLowerCase().replace(/[’'`]/g, "").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function slug(value) {
  return normalize(value).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function parseCSVLine(line) {
  const out = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { value += '"'; i += 1; }
      else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      out.push(value); value = "";
    } else value += ch;
  }
  out.push(value);
  return out;
}

function readGeographyRows() {
  if (!fs.existsSync(GEOGRAPHY_FILE)) throw new Error(`Ghana geography source file not found: ${GEOGRAPHY_FILE}`);
  const lines = fs.readFileSync(GEOGRAPHY_FILE, "utf8").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("Ghana geography source file contains no records.");
  const headers = parseCSVLine(lines[0]).map(normalize);
  for (const required of ["region_number", "region", "constituency_number_in_region", "constituency"]) {
    if (!headers.includes(required)) throw new Error(`Missing geography CSV column: ${required}`);
  }
  return lines.slice(1).map(parseCSVLine)
    .map(values => Object.fromEntries(headers.map((h, i) => [h, normalize(values[i])])))
    .filter(row => row.region && row.constituency);
}

async function seedRegionsAndConstituencies() {
  const rows = readGeographyRows();
  const regionRows = new Map();
  for (const row of rows) {
    const name = normalize(row.region);
    regionRows.set(key(name), { name, number: Number(row.region_number) });
  }
  if (regionRows.size !== 16) throw new Error(`Expected 16 Ghana regions in source data; found ${regionRows.size}.`);

  const regionMap = new Map();
  for (const item of [...regionRows.values()].sort((a, b) => a.number - b.number)) {
    const region = await Region.findOneAndUpdate(
      { name: item.name },
      { $set: { name: item.name, slug: slug(item.name), country: "Ghana", regionNumber: item.number, isActive: true } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    regionMap.set(key(item.name), region);
  }

  const constituencyKeys = new Set();
  for (const row of rows) {
    const region = regionMap.get(key(row.region));
    if (!region) throw new Error(`Region not found while bootstrapping: ${row.region}`);
    const name = normalize(row.constituency);
    constituencyKeys.add(`${key(row.region)}::${key(name)}`);
    await Constituency.findOneAndUpdate(
      { regionId: region._id, name },
      { $set: { name, slug: slug(name), regionId: region._id, constituencyNumber: Number(row.constituency_number_in_region), isActive: true } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  if (constituencyKeys.size !== 276) throw new Error(`Expected 276 Ghana constituencies in source data; found ${constituencyKeys.size}.`);
  return { regions: regionMap.size, constituencies: constituencyKeys.size };
}

async function ensureElectoralGeography() {
  if (hierarchyPromise) return hierarchyPromise;
  hierarchyPromise = (async () => {
    let [regions, constituencies] = await Promise.all([
      Region.countDocuments({ isActive: true }),
      Constituency.countDocuments({ isActive: true }),
    ]);
    if (regions < 16 || constituencies < 276) {
      console.log(`🗺️ Repairing Ghana geography hierarchy (${regions}/16 regions, ${constituencies}/276 constituencies).`);
      await seedRegionsAndConstituencies();
      [regions, constituencies] = await Promise.all([
        Region.countDocuments({ isActive: true }),
        Constituency.countDocuments({ isActive: true }),
      ]);
    }
    if (regions < 16 || constituencies < 276) {
      throw new Error(`Ghana geography hierarchy remains incomplete (${regions} regions, ${constituencies} constituencies).`);
    }
    const pollingStations = await PollingStation.countDocuments({ isActive: true });
    return { regions, constituencies, pollingStations, pollingStationsReady: pollingStations >= MIN_EXPECTED_POLLING_STATIONS };
  })().finally(() => { hierarchyPromise = null; });
  return hierarchyPromise;
}

async function refreshElectoralGeography() {
  await ensureElectoralGeography();
  const result = await syncPollingStationsFromEcPdf();
  const [regions, constituencies, pollingStations] = await Promise.all([
    Region.countDocuments({ isActive: true }),
    Constituency.countDocuments({ isActive: true }),
    PollingStation.countDocuments({ isActive: true }),
  ]);
  if (regions < 16 || constituencies < 276) throw new Error(`Electoral geography hierarchy is incomplete after refresh (${regions} regions, ${constituencies} constituencies).`);
  if (pollingStations < MIN_EXPECTED_POLLING_STATIONS) {
    throw new Error(`Polling-station refresh produced an unsafe result (${pollingStations.toLocaleString()} active stations; minimum ${MIN_EXPECTED_POLLING_STATIONS.toLocaleString()}).`);
  }
  if (result.matchedRows !== EXPECTED_TOTAL_POLLING_STATIONS) {
    throw new Error(`Polling-station refresh did not reconcile the complete EC register (${result.matchedRows.toLocaleString()}/${EXPECTED_TOTAL_POLLING_STATIONS.toLocaleString()}).`);
  }
  return { regions, constituencies, pollingStations, pollingStationSync: result };
}

module.exports = { ensureElectoralGeography, refreshElectoralGeography, seedRegionsAndConstituencies, MIN_EXPECTED_POLLING_STATIONS, EXPECTED_TOTAL_POLLING_STATIONS };
