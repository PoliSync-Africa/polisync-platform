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
const MIN_EXPECTED_POLLING_STATIONS = 40000;
const EXPECTED_TOTAL_POLLING_STATIONS = 40976;
let syncPromise = null;

function normalize(value) {
  return String(value || "")
    .replace(/[\u00a0\u2010-\u2015]/g, " ")
    .replace(/[–—]/g, "-")
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

function isOrdinaryStationCode(value) {
  return /^[A-Z]\d{6,7}[A-Z]?$/.test(normalize(value).toUpperCase());
}

function isSpecialStationCode(value) {
  return /^[A-Z]\d{4,8}SPS[A-Z]?$/.test(normalize(value).toUpperCase());
}

function cleanCode(value) {
  return normalize(value).toUpperCase();
}

async function downloadPdf(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "PoliSync-Africa/1.0 (+https://polisync.africa)",
      Accept: "application/pdf,*/*;q=0.8",
    },
  });
  if (!response.ok) throw new Error(`EC PDF request failed with HTTP ${response.status}: ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 5 || buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    const preview = buffer.subarray(0, 80).toString("utf8").replace(/\s+/g, " ");
    throw new Error(`EC source did not return a valid PDF (${buffer.length} bytes; starts with ${JSON.stringify(preview)}).`);
  }
  console.log(`📥 EC PDF downloaded: ${buffer.length.toLocaleString()} bytes.`);
  return buffer;
}

async function parsePdfBuffer(buffer) {
  const parser = new PDFParse({ data: buffer, CanvasFactory });
  try {
    let tableRows = [];
    try {
      const tableResult = await parser.getTable();
      tableRows = tableResult?.pages?.flatMap((page) => page?.tables || [])?.flatMap((tables) => tables || []) || [];
    } catch (error) {
      console.warn("⚠️ EC PDF table extraction failed; falling back to text extraction:", error.message);
    }

    const textResult = await parser.getText();
    return {
      tables: tableRows,
      text: textResult?.text || "",
    };
  } finally {
    await parser.destroy();
  }
}

function extractRowsFromTables(tableRows, stationType) {
  const rows = [];
  const codeValidator = stationType === "special" ? isSpecialStationCode : isOrdinaryStationCode;
  for (const rawRow of tableRows || []) {
    const row = Array.isArray(rawRow) ? rawRow.map(normalize) : [];
    if (row.length >= 6 && codeValidator(row[1])) {
      rows.push({
        code: cleanCode(row[1]),
        name: row[2],
        constituency: row[3],
        district: row[4],
        region: row[5],
        stationType,
      });
    }
  }
  return rows;
}

function extractRawTextRows(text, stationType) {
  const rows = [];
  const codePattern = stationType === "special" ? "[A-Z]\\d{4,8}SPS[A-Z]?" : "[A-Z]\\d{6,7}[A-Z]?";
  const codeValidator = stationType === "special" ? isSpecialStationCode : isOrdinaryStationCode;
  const lines = String(text || "").split(/\r?\n/).map(normalize).filter(Boolean);
  const linePattern = new RegExp(`^\\d[\\d,]*\\s+(?<code>${codePattern})\\s+(?<rest>.+)$`, "i");
  for (const line of lines) {
    const match = line.match(linePattern);
    if (match && codeValidator(match.groups.code)) {
      rows.push({ code: cleanCode(match.groups.code), rest: normalize(match.groups.rest), stationType });
    }
  }
  return rows;
}

function buildGeographyMaps(constituencies, regions) {
  const regionNames = regions.map((r) => normalize(r.name)).filter(Boolean).sort((a, b) => b.length - a.length);
  const byRegion = new Map();
  for (const c of constituencies) {
    const region = regions.find((r) => String(r._id) === String(c.regionId));
    if (!region) continue;
    const key = matchKey(region.name);
    if (!byRegion.has(key)) byRegion.set(key, []);
    byRegion.get(key).push({ constituency: normalize(c.name), district: normalize(c.district || ""), region: normalize(region.name) });
  }
  for (const list of byRegion.values()) {
    list.sort((a, b) => `${b.constituency} ${b.district}`.length - `${a.constituency} ${a.district}`.length);
  }
  return { regionNames, byRegion };
}

function parseTextRowsWithGeography(text, constituencies, regions, stationType) {
  const rawRows = extractRawTextRows(text, stationType);
  const { regionNames, byRegion } = buildGeographyMaps(constituencies, regions);
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
    rows.push({
      code: raw.code,
      name: nameKey,
      constituency: matched.constituency,
      district: matched.district,
      region: matched.region,
      stationType,
    });
  }
  console.log(`📄 EC ${stationType} text rows detected: ${rawRows.length.toLocaleString()}; matched: ${rows.length.toLocaleString()}; unmatched: ${unmatched.toLocaleString()}.`);
  return rows;
}

function deduplicateRows(rows) {
  const unique = new Map();
  const duplicates = [];
  for (const row of rows) {
    if (unique.has(row.code)) {
      duplicates.push(row.code);
      continue;
    }
    unique.set(row.code, row);
  }
  return { rows: [...unique.values()], duplicates };
}

function validateRows(rows, expectedCount, label) {
  const { rows: uniqueRows, duplicates } = deduplicateRows(rows);
  if (duplicates.length) {
    throw new Error(`EC ${label} register contains ${duplicates.length.toLocaleString()} duplicate station codes; refusing to write.`);
  }
  if (uniqueRows.length !== expectedCount) {
    throw new Error(`EC ${label} register validation failed: expected exactly ${expectedCount.toLocaleString()} stations, parsed ${uniqueRows.length.toLocaleString()}. Refusing to write incomplete or malformed electoral data.`);
  }
  const incomplete = uniqueRows.filter((row) => !row.code || !row.name || !row.constituency || !row.district || !row.region);
  if (incomplete.length) {
    throw new Error(`EC ${label} register contains ${incomplete.length.toLocaleString()} incomplete rows; refusing to write.`);
  }
  return uniqueRows;
}

async function parseOfficialRegister(url, stationType, expectedCount, regions, constituencies) {
  const buffer = await downloadPdf(url);
  const parsed = await parsePdfBuffer(buffer);
  let rows = extractRowsFromTables(parsed.tables, stationType);
  console.log(`📄 EC ${stationType} PDF table extraction returned ${rows.length.toLocaleString()} candidate rows.`);

  if (rows.length !== expectedCount) {
    rows = parseTextRowsWithGeography(parsed.text, constituencies, regions, stationType);
  }

  return validateRows(rows, expectedCount, stationType);
}

async function syncPollingStationsFromEcPdf() {
  if (syncPromise) return syncPromise;
  syncPromise = (async () => {
    console.log("🗳️ Synchronizing the official Ghana EC 2024 polling-station registers...");
    const regions = await Region.find({ isActive: true }).lean();
    const constituencies = await Constituency.find({ isActive: true }).lean();
    if (regions.length !== 16) throw new Error(`Expected 16 active regions before polling-station sync; found ${regions.length}.`);
    if (constituencies.length !== 276) throw new Error(`Expected 276 active constituencies before polling-station sync; found ${constituencies.length}.`);

    // Parse and fully validate BOTH EC registers before touching MongoDB.
    const ordinaryRows = await parseOfficialRegister(
      EC_POLLING_STATIONS_PDF,
      "ordinary",
      EXPECTED_ORDINARY_POLLING_STATIONS,
      regions,
      constituencies
    );
    const specialRows = await parseOfficialRegister(
      EC_SPECIAL_POLLING_STATIONS_PDF,
      "special",
      EXPECTED_SPECIAL_POLLING_STATIONS,
      regions,
      constituencies
    );
    const rows = [...ordinaryRows, ...specialRows];

    if (rows.length !== EXPECTED_TOTAL_POLLING_STATIONS) {
      throw new Error(`Combined EC register validation failed: expected ${EXPECTED_TOTAL_POLLING_STATIONS.toLocaleString()} stations, parsed ${rows.length.toLocaleString()}. Refusing to write.`);
    }

    const allCodes = new Set(rows.map((row) => row.code));
    if (allCodes.size !== rows.length) {
      throw new Error("Combined EC register contains duplicate polling-station codes across ordinary and special registers; refusing to write.");
    }

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
          update: {
            $set: {
              pollingStationCode: row.code,
              name: normalize(row.name),
              regionId: region._id,
              constituencyId: constituency._id,
              district: normalize(row.district),
              stationType: row.stationType,
              source: "Ghana Electoral Commission 2024 Polling Stations",
              sourceYear: 2024,
              isActive: true,
            },
          },
          upsert: true,
        },
      });
    }

    if (skipped || operations.length !== EXPECTED_TOTAL_POLLING_STATIONS) {
      throw new Error(`Validated EC rows could not all be linked to PoliSync geography: ${operations.length.toLocaleString()} linked, ${skipped.toLocaleString()} skipped. Refusing to write partial data.`);
    }

    console.log(`✅ EC register fully validated: ${ordinaryRows.length.toLocaleString()} ordinary + ${specialRows.length.toLocaleString()} special = ${rows.length.toLocaleString()} stations.`);
    const bulk = await PollingStation.bulkWrite(operations, { ordered: false });
    const count = await PollingStation.countDocuments({ isActive: true });
    if (count < MIN_EXPECTED_POLLING_STATIONS) {
      throw new Error(`Polling-station sync completed but database safety check failed: ${count.toLocaleString()} active stations.`);
    }

    console.log(`✅ Polling-station sync complete: ${count.toLocaleString()} active stations; modified ${bulk.modifiedCount || 0}, upserted ${bulk.upsertedCount || 0}.`);
    return {
      count,
      ordinaryCount: ordinaryRows.length,
      specialCount: specialRows.length,
      expectedTotal: EXPECTED_TOTAL_POLLING_STATIONS,
      matchedRows: operations.length,
      skipped,
      modified: bulk.modifiedCount || 0,
      upserted: bulk.upsertedCount || 0,
      healthy: count >= MIN_EXPECTED_POLLING_STATIONS,
    };
  })().finally(() => { syncPromise = null; });
  return syncPromise;
}

module.exports = {
  EC_POLLING_STATIONS_PDF,
  EC_SPECIAL_POLLING_STATIONS_PDF,
  EXPECTED_ORDINARY_POLLING_STATIONS,
  EXPECTED_SPECIAL_POLLING_STATIONS,
  EXPECTED_TOTAL_POLLING_STATIONS,
  MIN_EXPECTED_POLLING_STATIONS,
  syncPollingStationsFromEcPdf,
};
