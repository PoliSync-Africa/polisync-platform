require("dotenv").config();

const { PDFParse } = require("pdf-parse");
const { CanvasFactory } = require("pdf-parse/worker");
const Region = require("../models/Region");
const Constituency = require("../models/Constituency");
const PollingStation = require("../models/PollingStation");

const EC_POLLING_STATIONS_PDF = "https://ec.gov.gh/wp-content/uploads/2024/10/Polling_stations.pdf";
const EC_SPECIAL_POLLING_STATIONS_PDF = "https://ec.gov.gh/wp-content/uploads/2024/10/special_voting_stations_11102024.pdf";
const EXPECTED_ORDINARY_POLLING_STATIONS = 40648;
const EXPECTED_SPECIAL_POLLING_STATIONS = 328;
const EXPECTED_TOTAL_POLLING_STATIONS = 40976;
const MIN_EXPECTED_POLLING_STATIONS = 40000;
let syncPromise = null;

const normalize = (v) => String(v || "").replace(/[\u00a0\u2010-\u2015]/g, " ").replace(/\s+/g, " ").trim();
const key = (v) => normalize(v).toLowerCase().replace(/[’'`]/g, "").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
const tokens = (v) => key(v).split(" ").filter(Boolean);
const codeOrdinary = (v) => /^[A-Z]\d{6,7}[A-Z]?$/.test(normalize(v).toUpperCase());
const codeSpecial = (v) => /^[A-Z]\d{4,8}SPS[A-Z]?$/.test(normalize(v).toUpperCase());

async function downloadPdf(url) {
  const response = await fetch(url, { headers: { "User-Agent": "PoliSync-Africa/1.0 (+https://polisync.africa)", Accept: "application/pdf,*/*;q=0.8" } });
  if (!response.ok) throw new Error(`EC PDF request failed with HTTP ${response.status}: ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 5 || buffer.subarray(0, 5).toString("ascii") !== "%PDF-") throw new Error(`EC source did not return a valid PDF (${buffer.length} bytes).`);
  console.log(`📥 EC PDF downloaded: ${buffer.length.toLocaleString()} bytes.`);
  return buffer;
}

async function parsePdf(url) {
  const buffer = await downloadPdf(url);
  const parser = new PDFParse({ data: buffer, CanvasFactory });
  try {
    let tables = [];
    try {
      const result = await parser.getTable();
      tables = (result?.pages || []).flatMap((page) => page?.tables || []).flatMap((pageTables) => pageTables || []);
    } catch (error) {
      console.warn(`⚠️ EC table extraction failed: ${error.message}`);
    }

    const plainText = (await parser.getText())?.text || "";
    const columnText = (await parser.getText({ cellSeparator: "\t", cellThreshold: 7 }))?.text || plainText;
    return { tables, text: plainText, columnText };
  } finally {
    await parser.destroy();
  }
}

function tableRows(tables, special) {
  const validator = special ? codeSpecial : codeOrdinary;
  return tables
    .flatMap((table) => table || [])
    .filter(Array.isArray)
    .map((r) => r.map(normalize))
    .filter((r) => r.length >= 6 && validator(r[1]))
    .map((r) => ({ code: r[1].toUpperCase(), name: r[2], constituency: r[3], district: r[4], region: r[5], stationType: special ? "special" : "ordinary" }));
}

function columnRows(text, special, regions, constituencies) {
  const validator = special ? codeSpecial : codeOrdinary;
  const cMap = constituencyMap(constituencies);
  const regionMap = new Map(regions.map((r) => [key(r.name), r]));
  const rows = [];

  for (const line of String(text || "").split(/\r?\n/)) {
    const fields = line.split("\t").map(normalize).filter(Boolean);
    if (!fields.length) continue;
    const codeIndex = fields.findIndex((field) => validator(field));
    if (codeIndex < 0 || fields.length < codeIndex + 5) continue;

    const code = fields[codeIndex].toUpperCase();
    const name = fields[codeIndex + 1];
    const sourceConstituency = fields[codeIndex + 2];
    const district = fields[codeIndex + 3];
    const regionName = fields[codeIndex + 4];
    if (!name || !district || !regionName) continue;

    const region = regionMap.get(key(regionName));
    if (!region) continue;

    if (!special) {
      const constituencyNumber = Number(code.slice(1, 3));
      const constituency = cMap.get(`${String(region._id)}::${constituencyNumber}`);
      if (!constituency) continue;
      rows.push({ code, name: name.toUpperCase(), constituency: constituency.name, district: constituency.district || district, region: region.name, stationType: "ordinary", sourceConstituency });
    } else {
      rows.push({ code, name: name.toUpperCase(), constituency: sourceConstituency, district, region: region.name, stationType: "special" });
    }
  }

  return rows;
}

function rawRows(text, special) {
  const pattern = special ? /^(?:\d[\d,]*\s+)?(?<code>[A-Z]\d{4,8}SPS[A-Z]?)\s+(?<rest>.+)$/i : /^(?:\d[\d,]*\s+)?(?<code>[A-Z]\d{6,7}[A-Z]?)\s+(?<rest>.+)$/i;
  const validator = special ? codeSpecial : codeOrdinary;
  return String(text || "").split(/\r?\n/).map(normalize).filter(Boolean).map((line) => line.match(pattern)).filter(Boolean).filter((m) => validator(m.groups.code)).map((m) => ({ code: m.groups.code.toUpperCase(), rest: normalize(m.groups.rest) }));
}

function regionFromEnd(rest, regions) {
  const ordered = regions.map((r) => ({ entity: r, key: key(r.name) })).sort((a, b) => b.key.length - a.key.length);
  const k = key(rest);
  return ordered.find((r) => k === r.key || k.endsWith(` ${r.key}`))?.entity || null;
}

function constituencyMap(constituencies) {
  const map = new Map();
  for (const c of constituencies) map.set(`${String(c.regionId)}::${Number(c.constituencyNumber)}`, c);
  return map;
}

function stripSuffixWords(text, suffix) {
  const a = tokens(text);
  const b = tokens(suffix);
  if (!b.length || a.length < b.length) return null;
  for (let i = 0; i < b.length; i += 1) if (a[a.length - b.length + i] !== b[i]) return null;
  return a.slice(0, a.length - b.length).join(" ").trim();
}

function longestCommonSuffix(rows) {
  if (!rows.length) return [];
  let suffix = tokens(rows[0]);
  for (let i = 1; i < rows.length && suffix.length; i += 1) {
    const current = tokens(rows[i]);
    let n = 0;
    while (n < suffix.length && n < current.length && suffix[suffix.length - 1 - n] === current[current.length - 1 - n]) n += 1;
    suffix = suffix.slice(suffix.length - n);
  }
  return suffix;
}

function parseOrdinaryRows(text, regions, constituencies) {
  const raw = rawRows(text, false);
  const byConstituency = new Map();
  const cMap = constituencyMap(constituencies);
  const prepared = [];

  for (const item of raw) {
    const region = regionFromEnd(item.rest, regions);
    if (!region) continue;
    const constituencyNumber = Number(item.code.slice(1, 3));
    const constituency = cMap.get(`${String(region._id)}::${constituencyNumber}`);
    if (!constituency) continue;
    const regionKey = key(region.name);
    let body = item.rest;
    if (key(body).endsWith(` ${regionKey}`)) {
      const words = normalize(body).split(" ");
      const regionWords = normalize(region.name).split(" ");
      body = words.slice(0, words.length - regionWords.length).join(" ");
    }
    const groupKey = `${String(region._id)}::${constituencyNumber}`;
    if (!byConstituency.has(groupKey)) byConstituency.set(groupKey, []);
    byConstituency.get(groupKey).push(body);
    prepared.push({ item, region, constituency, body, groupKey });
  }

  const rows = [];
  for (const item of prepared) {
    const c = item.constituency;
    const districtSuffix = stripSuffixWords(item.body, c.district);
    const stationPlusConstituency = districtSuffix !== null ? districtSuffix : item.body;
    let stationName = stripSuffixWords(stationPlusConstituency, c.name);
    if (stationName === null) {
      const common = longestCommonSuffix(byConstituency.get(item.groupKey) || []);
      stationName = common.length ? stripSuffixWords(stationPlusConstituency, common.join(" ")) : null;
    }
    if (!stationName) continue;
    rows.push({ code: item.item.code, name: stationName.toUpperCase(), constituency: c.name, district: c.district, region: item.region.name, stationType: "ordinary" });
  }
  console.log(`📄 EC ordinary fallback rows detected: ${raw.length.toLocaleString()}; linked by EC code geography: ${rows.length.toLocaleString()}; unresolved: ${(raw.length - rows.length).toLocaleString()}.`);
  return rows;
}

function parseSpecialRows(text, regions, constituencies) {
  const raw = rawRows(text, true);
  const regionNames = regions.map((r) => normalize(r.name)).sort((a, b) => b.length - a.length);
  const byRegion = new Map();
  for (const c of constituencies) {
    const r = regions.find((x) => String(x._id) === String(c.regionId));
    if (!r) continue;
    const rk = key(r.name);
    if (!byRegion.has(rk)) byRegion.set(rk, []);
    byRegion.get(rk).push({ c, constituency: normalize(c.name), district: normalize(c.district), region: normalize(r.name) });
  }
  const rows = [];
  for (const item of raw) {
    const restKey = key(item.rest);
    const regionName = regionNames.find((name) => restKey.endsWith(` ${key(name)}`) || restKey === key(name));
    if (!regionName) continue;
    const candidates = byRegion.get(key(regionName)) || [];
    let match = null;
    for (const candidate of candidates) {
      const suffix = key(`${candidate.constituency} ${candidate.district} ${candidate.region}`);
      if (restKey.endsWith(` ${suffix}`) || restKey === suffix) { match = candidate; break; }
    }
    if (!match) continue;
    const suffixKey = key(`${match.constituency} ${match.district} ${match.region}`);
    const suffixPos = restKey.lastIndexOf(suffixKey);
    const name = suffixPos > 0 ? restKey.slice(0, suffixPos).trim() : "";
    if (!name) continue;
    rows.push({ code: item.code, name: name.toUpperCase(), constituency: match.constituency, district: match.district, region: match.region, stationType: "special" });
  }
  console.log(`📄 EC special text rows detected: ${raw.length.toLocaleString()}; linked: ${rows.length.toLocaleString()}; unresolved: ${(raw.length - rows.length).toLocaleString()}.`);
  return rows;
}

function validate(rows, expected, label) {
  const map = new Map();
  for (const row of rows) {
    if (map.has(row.code)) throw new Error(`EC ${label} register contains duplicate station code ${row.code}. Refusing to write.`);
    if (!row.code || !row.name || !row.constituency || !row.district || !row.region) throw new Error(`EC ${label} register contains an incomplete row for ${row.code || "unknown code"}. Refusing to write.`);
    map.set(row.code, row);
  }
  if (map.size !== expected) throw new Error(`EC ${label} register validation failed: expected exactly ${expected.toLocaleString()} stations, parsed ${map.size.toLocaleString()}. Refusing to write incomplete or malformed electoral data.`);
  return [...map.values()];
}

async function syncPollingStationsFromEcPdf() {
  if (syncPromise) return syncPromise;
  syncPromise = (async () => {
    console.log("🗳️ Synchronizing the official Ghana EC 2024 polling-station registers with code-based geography...");
    const regions = await Region.find({ isActive: true }).lean();
    const constituencies = await Constituency.find({ isActive: true }).lean();
    if (regions.length !== 16) throw new Error(`Expected 16 active regions; found ${regions.length}.`);
    if (constituencies.length !== 276) throw new Error(`Expected 276 active constituencies; found ${constituencies.length}.`);

    const ordinaryPdf = await parsePdf(EC_POLLING_STATIONS_PDF);
    let ordinaryRows = columnRows(ordinaryPdf.columnText, false, regions, constituencies);
    console.log(`📐 EC ordinary column rows detected: ${ordinaryRows.length.toLocaleString()}.`);
    if (ordinaryRows.length !== EXPECTED_ORDINARY_POLLING_STATIONS) ordinaryRows = tableRows(ordinaryPdf.tables, false);
    if (ordinaryRows.length !== EXPECTED_ORDINARY_POLLING_STATIONS) ordinaryRows = parseOrdinaryRows(ordinaryPdf.text, regions, constituencies);
    ordinaryRows = validate(ordinaryRows, EXPECTED_ORDINARY_POLLING_STATIONS, "ordinary");

    const specialPdf = await parsePdf(EC_SPECIAL_POLLING_STATIONS_PDF);
    let specialRows = columnRows(specialPdf.columnText, true, regions, constituencies);
    if (specialRows.length !== EXPECTED_SPECIAL_POLLING_STATIONS) specialRows = tableRows(specialPdf.tables, true);
    if (specialRows.length !== EXPECTED_SPECIAL_POLLING_STATIONS) specialRows = parseSpecialRows(specialPdf.text, regions, constituencies);
    specialRows = validate(specialRows, EXPECTED_SPECIAL_POLLING_STATIONS, "special");

    const rows = [...ordinaryRows, ...specialRows];
    if (new Set(rows.map((r) => r.code)).size !== EXPECTED_TOTAL_POLLING_STATIONS) throw new Error("Combined EC register contains duplicate polling-station codes. Refusing to write.");

    const regionMap = new Map(regions.map((r) => [key(r.name), r]));
    const constituencyMapByName = new Map(constituencies.map((c) => [`${String(c.regionId)}::${key(c.name)}`, c]));
    const operations = [];
    for (const row of rows) {
      const region = regionMap.get(key(row.region));
      const constituency = region && constituencyMapByName.get(`${String(region._id)}::${key(row.constituency)}`);
      if (!region || !constituency) throw new Error(`Validated EC row ${row.code} could not be linked to PoliSync geography.`);
      operations.push({ updateOne: { filter: { pollingStationCode: row.code }, update: { $set: { pollingStationCode: row.code, name: normalize(row.name), regionId: region._id, constituencyId: constituency._id, district: normalize(row.district), stationType: row.stationType, source: "Ghana Electoral Commission 2024 Polling Stations", sourceYear: 2024, isActive: true } }, upsert: true } });
    }
    if (operations.length !== EXPECTED_TOTAL_POLLING_STATIONS) throw new Error(`Refusing partial write: only ${operations.length.toLocaleString()} EC stations linked.`);

    console.log(`✅ EC registers validated: ${ordinaryRows.length.toLocaleString()} ordinary + ${specialRows.length.toLocaleString()} special = ${rows.length.toLocaleString()}.`);
    const bulk = await PollingStation.bulkWrite(operations, { ordered: false });
    const count = await PollingStation.countDocuments({ isActive: true });
    if (count < MIN_EXPECTED_POLLING_STATIONS) throw new Error(`Polling-station safety check failed after write: ${count.toLocaleString()} active stations.`);
    console.log(`✅ Polling-station sync complete: ${count.toLocaleString()} active stations; upserted ${bulk.upsertedCount || 0}, modified ${bulk.modifiedCount || 0}.`);
    return { count, ordinaryCount: ordinaryRows.length, specialCount: specialRows.length, expectedTotal: EXPECTED_TOTAL_POLLING_STATIONS, matchedRows: operations.length, skipped: 0, healthy: count >= MIN_EXPECTED_POLLING_STATIONS };
  })().finally(() => { syncPromise = null; });
  return syncPromise;
}

module.exports = { EC_POLLING_STATIONS_PDF, EC_SPECIAL_POLLING_STATIONS_PDF, EXPECTED_ORDINARY_POLLING_STATIONS, EXPECTED_SPECIAL_POLLING_STATIONS, EXPECTED_TOTAL_POLLING_STATIONS, MIN_EXPECTED_POLLING_STATIONS, syncPollingStationsFromEcPdf };
