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

function normalizeKey(value) {
  return normalize(value).toLowerCase();
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
          rows.push({
            code: cleanCode(row[1]),
            name: row[2],
            constituency: row[3],
            district: row[4],
            region: row[5],
          });
        }
      }
    }
  }
  return rows;
}

function extractRowsFromText(text) {
  const rows = [];
  const lines = String(text || "")
    .split(/\r?\n/)
    .map(normalize)
    .filter(Boolean);

  for (const line of lines) {
    const match = line.match(/^\d[\d,]*\s+(?<code>[A-Z]\d{6,7}[A-Z]?)\s+(?<rest>.+)$/);
    if (!match) continue;

    const parts = match.groups.rest.split(/\s{2,}/).map(normalize).filter(Boolean);
    if (parts.length < 4) continue;

    rows.push({
      code: cleanCode(match.groups.code),
      name: parts[0],
      constituency: parts[1],
      district: parts[2],
      region: parts[3],
    });
  }

  return rows;
}

async function syncPollingStationsFromEcPdf() {
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    console.log("🗳️ Polling stations are missing. Syncing the 2024 Ghana EC polling-station register...");

    const parser = new PDFParse({ url: EC_POLLING_STATIONS_PDF });
    try {
      let result;
      try {
        result = await parser.getTable();
      } catch (tableError) {
        console.warn("⚠️ EC table extraction failed; falling back to PDF text extraction:", tableError.message);
        const textResult = await parser.getText();
        result = { pages: [], text: textResult.text };
      }

      let rows = extractRowsFromTables(result);
      if (rows.length < 1000) {
        const textRows = extractRowsFromText(result?.text || "");
        if (textRows.length > rows.length) rows = textRows;
      }

      const unique = new Map(rows.map((row) => [row.code, row]));
      rows = [...unique.values()].filter((row) => row.name && row.constituency && row.district && row.region);

      if (!rows.length) {
        throw new Error("No polling-station records could be extracted from the EC 2024 PDF.");
      }

      const regions = await Region.find({ isActive: true }).lean();
      const regionMap = new Map(regions.map((region) => [normalizeKey(region.name), region]));

      const constituencies = await Constituency.find({ isActive: true }).lean();
      const constituencyMap = new Map(
        constituencies.map((item) => [`${String(item.regionId)}::${normalizeKey(item.name)}`, item])
      );

      const operations = [];
      let skipped = 0;

      for (const row of rows) {
        const region = regionMap.get(normalizeKey(row.region));
        if (!region) {
          skipped++;
          continue;
        }

        const constituency = constituencyMap.get(`${String(region._id)}::${normalizeKey(row.constituency)}`);
        if (!constituency) {
          skipped++;
          continue;
        }

        operations.push({
          updateOne: {
            filter: { pollingStationCode: row.code },
            update: {
              $set: {
                pollingStationCode: row.code,
                name: row.name,
                regionId: region._id,
                constituencyId: constituency._id,
                district: row.district,
                stationType: "ordinary",
                source: "Ghana Electoral Commission 2024 Polling Stations",
                sourceYear: 2024,
                isActive: true,
              },
            },
            upsert: true,
          },
        });
      }

      if (!operations.length) {
        throw new Error("The EC polling-station records could not be matched to PoliSync regions and constituencies.");
      }

      const resultBulk = await PollingStation.bulkWrite(operations, { ordered: false });
      const count = await PollingStation.countDocuments({ isActive: true });

      console.log(`✅ EC polling-station sync complete: ${count.toLocaleString()} active stations. Skipped ${skipped.toLocaleString()} unmatched rows.`);
      return { count, skipped, matchedRows: operations.length, modified: resultBulk.modifiedCount || 0, upserted: resultBulk.upsertedCount || 0 };
    } finally {
      await parser.destroy();
    }
  })().finally(() => {
    syncPromise = null;
  });

  return syncPromise;
}

module.exports = {
  EC_POLLING_STATIONS_PDF,
  syncPollingStationsFromEcPdf,
};
