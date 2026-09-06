const fs = require("fs");
const path = require("path");
const Region = require("../models/Region");
const Constituency = require("../models/Constituency");
const PollingStation = require("../models/PollingStation");

const SOURCE_FILE = path.join(__dirname, "../data/ghana_polling_stations_2024.csv");

function normalize(value) { return String(value || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim(); }
function key(value) { return normalize(value).toLowerCase().replace(/[’'`]/g, "").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim(); }
function parseCSVLine(line) {
  const out = []; let value = ""; let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (quoted && line[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted; }
    else if (ch === "," && !quoted) { out.push(value); value = ""; } else value += ch;
  }
  out.push(value); return out;
}
function readRows() {
  if (!fs.existsSync(SOURCE_FILE)) throw new Error("Official EC polling-station source is unavailable.");
  const lines = fs.readFileSync(SOURCE_FILE, "utf8").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("Official EC polling-station source contains no records.");
  const headers = parseCSVLine(lines[0]).map(normalize);
  const required = ["polling_station_code", "polling_station_name", "constituency", "district", "region"];
  const missingHeaders = required.filter(h => !headers.includes(h));
  if (missingHeaders.length) throw new Error(`Source is missing required columns: ${missingHeaders.join(", ")}`);
  return lines.slice(1).map(parseCSVLine).map(values => Object.fromEntries(headers.map((h, i) => [h, normalize(values[i])])))
    .filter(row => row.polling_station_code);
}

async function buildReconciliation() {
  const rows = readRows();
  const [regions, constituencies, stations] = await Promise.all([
    Region.find({ isActive: true }).lean(),
    Constituency.find({ isActive: true }).lean(),
    PollingStation.find({}).lean(),
  ]);
  if (regions.length !== 16) throw new Error(`Expected 16 active regions; found ${regions.length}.`);
  if (constituencies.length < 276) throw new Error(`Expected at least 276 active constituencies; found ${constituencies.length}.`);

  const regionCandidates = new Map();
  for (const r of regions) { const k = key(r.name); const list = regionCandidates.get(k) || []; list.push(r); regionCandidates.set(k, list); }
  const regionNameById = new Map(regions.map(r => [String(r._id), key(r.name)]));
  const constituencyCandidates = new Map();
  for (const c of constituencies) { const k = key(c.name); const list = constituencyCandidates.get(k) || []; list.push(c); constituencyCandidates.set(k, list); }
  const existing = new Map(stations.map(s => [String(s.pollingStationCode || "").toUpperCase(), s]));
  const seen = new Set();
  const changes = [];
  const summary = { sourceRows: rows.length, validRows: 0, newStations: 0, changedStations: 0, unchangedStations: 0, missingFromSource: 0, unresolved: 0, duplicateSourceCodes: 0 };

  for (const row of rows) {
    const code = normalize(row.polling_station_code).toUpperCase();
    if (!code) continue;
    if (seen.has(code)) { summary.duplicateSourceCodes++; continue; }
    seen.add(code);
    const regionKey = key(row.region);
    const regionOptions = regionCandidates.get(regionKey) || [];
    const constituencyOptions = constituencyCandidates.get(key(row.constituency)) || [];
    let constituency = constituencyOptions.find(c => regionNameById.get(String(c.regionId)) === regionKey);
    if (!constituency && constituencyOptions.length === 1) constituency = constituencyOptions[0];
    const region = regionOptions.find(r => String(r._id) === String(constituency?.regionId)) || regionOptions[0];
    if (!region || !constituency || !row.polling_station_name || !row.district) {
      summary.unresolved++;
      changes.push({ pollingStationCode: code, changeType: "unresolved", before: existing.get(code) || null, after: null, reason: "Could not safely map source row to an active region and constituency." });
      continue;
    }
    summary.validRows++;
    const after = { pollingStationCode: code, name: row.polling_station_name, regionId: String(region._id), constituencyId: String(constituency._id), district: row.district, stationType: "ordinary", source: row.source || "Ghana Electoral Commission 2024 Polling Stations", sourceYear: 2024, isActive: true };
    const before = existing.get(code);
    if (!before) { summary.newStations++; changes.push({ pollingStationCode: code, changeType: "new", before: null, after }); continue; }
    const changed = String(before.name || "") !== after.name || String(before.regionId) !== after.regionId || String(before.constituencyId) !== after.constituencyId || String(before.district || "") !== after.district || Boolean(before.isActive) !== true;
    if (changed) { summary.changedStations++; changes.push({ pollingStationCode: code, changeType: "changed", before: { name: before.name, regionId: String(before.regionId), constituencyId: String(before.constituencyId), district: before.district, isActive: before.isActive }, after, reason: "Source values differ from the current database record." }); }
    else summary.unchangedStations++;
  }

  for (const station of stations) {
    const code = String(station.pollingStationCode || "").toUpperCase();
    if (station.isActive && code && !seen.has(code)) {
      summary.missingFromSource++;
      changes.push({ pollingStationCode: code, changeType: "missing", before: { name: station.name, regionId: String(station.regionId), constituencyId: String(station.constituencyId), district: station.district, isActive: station.isActive }, after: null, reason: "Active database station is absent from the source; no automatic deactivation." });
    }
  }

  if (summary.validRows < 1000) throw new Error(`Reconciliation blocked: only ${summary.validRows} source rows could be safely mapped.`);
  if (summary.duplicateSourceCodes > 0) throw new Error(`Reconciliation blocked: ${summary.duplicateSourceCodes} duplicate source polling-station code(s) detected.`);
  if (summary.unresolved > 0) throw new Error(`Reconciliation blocked: ${summary.unresolved} source row(s) could not be safely resolved.`);
  return { source: "Ghana Electoral Commission 2024 Polling Stations", sourceYear: 2024, summary, changes };
}

module.exports = { buildReconciliation };
