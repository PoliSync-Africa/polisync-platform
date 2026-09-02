require("dotenv").config();

const { PDFParse } = require("pdf-parse");
const Region = require("../models/Region");
const Constituency = require("../models/Constituency");
const PollingStation = require("../models/PollingStation");

const EC_POLLING_STATIONS_PDF = "https://ec.gov.gh/wp-content/uploads/2024/10/Polling_stations.pdf";
let syncPromise = null;

function normalize(value) {
  return String(value || "")
    .replace(/[\u00a0\u2010-\u2015]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchKey(value) {
  return normalize(value)
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isStationCode(value) {
  return /^[A-Z]\d{6,7}[A-Z]?$/.test(normalize(value).toUpperCase());
}

function cleanCode(value) {
  return normalize(value).toUpperCase();
}

function extractRowsFromTables(result) {
  const rows = [];
  for (const page of result?.pages || []) {
    for (const table of page?.tables || []) {
      for (const rawRow of table || []) {
        const row = Array.isArray(rawRow) ? rawRow.map(normalize) : [];
        if (row.length >= 6 && isStationCode(row[1])) {
          rows.push({ code: cleanCode(row[1]), name: row[2], constituency: row[3], district: row[4], region: row[5] });
        }
      }
    }
  }
  return rows;
}

function extractRawTextRows(text) {
  const rows = [];
  const lines = String(text || "").split(/\r?\n/).map(normalize).filter(Boolean);
  for (const line of lines) {
    const match = line.match(/^\d[\d,]*\s+(?<code>[A-Z]\d{6,7}[A-Z]?)\s+(?<rest>.+)$/i);
    if (match && isStationCode(match.groups.code)) {
      rows.push({ code: cleanCode(match.groups.code), rest: normalize(match.groups.rest) });
    }
  }
  return rows;
}

function parseTextRowsWithGeography(text, constituencies, regions) {
  const rawRows = extractRawTextRows(text);
  const regionNames = regions.map((r) => normalize(r.name)).filter(Boolean).sort((a, b) => b.length - a.length);
  const byRegion = new Map();
  for (const c of constituencies) {
    const region = regions.find((r) => String(r._id) === String(c.regionId));
    if (!region) continue;
    const key = matchKey(region.name);
    if (!byRegion.has(key)) byRegion.set(key, []);
    byRegion.get(key).push({ constituency: normalize(c.name), district: normalize(c.district), region: normalize(region.name) });
  }
  for (const list of byRegion.values()) list.sort((a, b) => `${b.constituency} ${b.district}`.length - `${a.constituency} ${a.district}`.length);

  const rows = [];
  let unmatched = 0;
  for (const raw of rawRows) {
    const restKey = matchKey(raw.rest);
    let matched = null;
    for (const regionName of regionNames) {
      const regionKey = matchKey(regionName);
      if (!restKey.endsWith(` ${regionKey}`) && restKey !== regionKey) continue;
      const candidates = byRegion.get(regionKey) || [];
      for (const candidate of candidates) {
        const suffix = matchKey(`${candidate.constituency} ${candidate.district} ${candidate.region}`);
        if (restKey.endsWith(` ${suffix}`) || restKey === suffix) {
          matched = candidate;
          break;
        }
      }
      if (matched) break;
    }
    if (!matched) {
      unmatched++;
      continue;
    }

    const suffixKey = matchKey(`${matched.constituency} ${matched.district} ${matched.region}`);
    const suffixPos = restKey.lastIndexOf(suffixKey);
    const nameKey = suffixPos > 0 ? restKey.slice(0, Math.max(0, suffixPos - 1)).trim() : "";
    if (!nameKey) {
      unmatched++;
      continue;
    }
    rows.push({ code: raw.code, name: nameKey, constituency: matched.constituency, district: matched.district, region: matched.region });
  }
  console.log(`📄 EC text rows detected: ${rawRows.length.toLocaleString()}; matched to electoral geography: ${rows.length.toLocaleString()}; unmatched: ${unmatched.toLocaleString()}.`);
  return rows;
}

async function syncPollingStationsFromEcPdf() {
  if (syncPromise) return syncPromise;
  syncPromise = (async () => {
    console.log("🗳️ Synchronizing the official Ghana EC 2024 polling-station register...");
    const parser = new PDFParse({ url: EC_POLLING_STATIONS_PDF });
    try {
      const regions = await Region.find({ isActive: true }).lean();
      const constituencies = await Constituency.find({ isActive: true }).lean();
      if (regions.length !== 16) throw new Error(`Expected 16 active regions before polling-station sync; found ${regions.length}.`);
      if (!constituencies.length) throw new Error("No active constituencies exist before polling-station sync.");

      let rows = [];
      try {
        rows = extractRowsFromTables(await parser.getTable());
        console.log(`📄 EC PDF table extraction returned ${rows.length.toLocaleString()} rows.`);
      } catch (error) {
        console.warn("⚠️ EC table extraction failed; using text extraction:", error.message);
      }

      if (rows.length < 1000) {
        const textResult = await parser.getText();
        rows = parseTextRowsWithGeography(textResult?.text || "", constituencies, regions);
      }

      const unique = new Map(rows.map((row) => [row.code, row]));
      rows = [...unique.values()].filter((row) => row.name && row.constituency && row.district && row.region);
      if (rows.length < 1000) throw new Error(`Only ${rows.length.toLocaleString()} polling-station records were parsed from the EC PDF; refusing to write incomplete electoral data.`);

      const regionMap = new Map(regions.map((r) => [matchKey(r.name), r]));
      const constituencyMap = new Map(constituencies.map((c) => [`${String(c.regionId)}::${matchKey(c.name)}`, c]));
      const operations = [];
      let skipped = 0;

      for (const row of rows) {
        const region = regionMap.get(matchKey(row.region));
        const constituency = region && constituencyMap.get(`${String(region._id)}::${matchKey(row.constituency)}`);
        if (!region || !constituency) {
          skipped++;
          continue;
        }
        operations.push({
          updateOne: {
            filter: { pollingStationCode: row.code },
            update: { $set: {
              pollingStationCode: row.code,
              name: normalize(row.name),
              regionId: region._id,
              constituencyId: constituency._id,
              district: normalize(row.district),
              stationType: "ordinary",
              source: "Ghana Electoral Commission 2024 Polling Stations",
              sourceYear: 2024,
              isActive: true,
            } },
            upsert: true,
          },
        });
      }
      if (!operations.length) throw new Error("No parsed EC polling stations could be linked to PoliSync electoral geography.");
      const bulk = await PollingStation.bulkWrite(operations, { ordered: false });
      const count = await PollingStation.countDocuments({ isActive: true });
      console.log(`✅ Polling-station sync complete: ${count.toLocaleString()} active stations; matched ${operations.length.toLocaleString()}, skipped ${skipped.toLocaleString()}.`);
      return { count, skipped, matchedRows: operations.length, modified: bulk.modifiedCount || 0, upserted: bulk.upsertedCount || 0 };
    } finally {
      await parser.destroy();
    }
  })().finally(() => { syncPromise = null; });
  return syncPromise;
}

module.exports = { EC_POLLING_STATIONS_PDF, syncPollingStationsFromEcPdf };
