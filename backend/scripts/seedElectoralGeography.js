require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// ============================================================
// MODELS
// ============================================================

const Region = require("../models/Region");
const Constituency = require("../models/Constituency");
const PollingStation = require("../models/PollingStation");

// ============================================================
// DATABASE CONFIGURATION
// ============================================================

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error(
    "ERROR: MONGODB_URI is not configured."
  );
  process.exit(1);
}

// ============================================================
// SOURCE DATA
// ============================================================

const GEOGRAPHY_FILE = path.join(
  __dirname,
  "../data/ghana_regions_constituencies.csv"
);

const POLLING_STATIONS_FILE = path.join(
  __dirname,
  "../data/ghana_polling_stations_2024.csv"
);

// ============================================================
// CSV PARSER
// ============================================================

function parseCSVLine(line) {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const character = line[i];

    if (character === '"') {
      if (
        insideQuotes &&
        line[i + 1] === '"'
      ) {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (
      character === "," &&
      !insideQuotes
    ) {
      values.push(current);
      current = "";
    } else {
      current += character;
    }
  }

  values.push(current);

  return values;
}

function readCSV(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `CSV file not found:\n${filePath}`
    );
  }

  const content = fs.readFileSync(
    filePath,
    "utf8"
  );

  const lines = content
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    throw new Error(
      `CSV file contains no data:\n${filePath}`
    );
  }

  const headers = parseCSVLine(lines[0]).map(
    (header) => header.trim()
  );

  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    const row = {};

    headers.forEach((header, index) => {
      row[header] =
        values[index] !== undefined
          ? values[index].trim()
          : "";
    });

    rows.push(row);
  }

  return rows;
}

// ============================================================
// NORMALIZATION
// ============================================================

function normalize(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeKey(value) {
  return normalize(value).toLowerCase();
}

function createSlug(value) {
  return normalize(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ============================================================
// VALIDATE GEOGRAPHY DATA
// ============================================================

function validateGeographyData(rows) {
  const requiredColumns = [
    "region_number",
    "region",
    "constituency_number_in_region",
    "constituency",
  ];

  if (!rows.length) {
    throw new Error(
      "The geography CSV contains no records."
    );
  }

  for (const column of requiredColumns) {
    if (!(column in rows[0])) {
      throw new Error(
        `Missing geography CSV column: ${column}`
      );
    }
  }

  const regions = new Map();
  const constituencies = new Set();

  for (const row of rows) {
    const region = normalize(row.region);
    const constituency =
      normalize(row.constituency);

    if (!region) {
      throw new Error(
        "A geography record has no region."
      );
    }

    if (!constituency) {
      throw new Error(
        `Region "${region}" has a record without a constituency.`
      );
    }

    regions.set(
      normalizeKey(region),
      region
    );

    constituencies.add(
      `${normalizeKey(region)}::${normalizeKey(
        constituency
      )}`
    );
  }

  if (regions.size !== 16) {
    throw new Error(
      `Expected 16 regions but found ${regions.size}.`
    );
  }

  if (constituencies.size !== 276) {
    throw new Error(
      `Expected 276 constituencies but found ${constituencies.size}.`
    );
  }

  return {
    regionCount: regions.size,
    constituencyCount:
      constituencies.size,
  };
}

// ============================================================
// VALIDATE POLLING STATION DATA
// ============================================================

function validatePollingStationData(rows) {
  const requiredColumns = [
    "polling_station_code",
    "polling_station_name",
    "constituency",
    "district",
    "region",
  ];

  if (!rows.length) {
    throw new Error(
      "The polling-station CSV contains no records."
    );
  }

  for (const column of requiredColumns) {
    if (!(column in rows[0])) {
      throw new Error(
        `Missing polling-station CSV column: ${column}`
      );
    }
  }

  const codes = new Set();

  for (const row of rows) {
    const code = normalize(
      row.polling_station_code
    ).toUpperCase();

    if (!code) {
      throw new Error(
        "A polling station has no EC polling-station code."
      );
    }

    if (codes.has(code)) {
      throw new Error(
        `Duplicate EC polling-station code: ${code}`
      );
    }

    codes.add(code);

    if (!normalize(row.polling_station_name)) {
      throw new Error(
        `Polling station ${code} has no name.`
      );
    }

    if (!normalize(row.region)) {
      throw new Error(
        `Polling station ${code} has no region.`
      );
    }

    if (!normalize(row.constituency)) {
      throw new Error(
        `Polling station ${code} has no constituency.`
      );
    }

    if (!normalize(row.district)) {
      throw new Error(
        `Polling station ${code} has no district.`
      );
    }
  }

  return {
    pollingStationCount: codes.size,
  };
}

// ============================================================
// CREATE / UPDATE REGIONS
// ============================================================

async function seedRegions(rows) {
  const regionMap = new Map();

  const uniqueRegions = new Map();

  for (const row of rows) {
    const name = normalize(row.region);
    const number = Number(
      row.region_number
    );

    uniqueRegions.set(
      normalizeKey(name),
      {
        name,
        number,
      }
    );
  }

  const regions = [...uniqueRegions.values()]
    .sort(
      (a, b) => a.number - b.number
    );

  for (const item of regions) {
    const region =
      await Region.findOneAndUpdate(
        {
          name: item.name,
        },
        {
          $set: {
            name: item.name,
            slug: createSlug(item.name),
            country: "Ghana",
            regionNumber: item.number,
            isActive: true,
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

    regionMap.set(
      normalizeKey(item.name),
      region
    );
  }

  return regionMap;
}

// ============================================================
// CREATE / UPDATE CONSTITUENCIES
// ============================================================

async function seedConstituencies(
  rows,
  regionMap
) {
  const constituencyMap = new Map();

  for (const row of rows) {
    const regionName =
      normalize(row.region);

    const constituencyName =
      normalize(row.constituency);

    const constituencyNumber =
      Number(
        row.constituency_number_in_region
      );

    const region =
      regionMap.get(
        normalizeKey(regionName)
      );

    if (!region) {
      throw new Error(
        `Region not found: ${regionName}`
      );
    }

    const constituency =
      await Constituency.findOneAndUpdate(
        {
          regionId: region._id,
          name: constituencyName,
        },
        {
          $set: {
            name: constituencyName,
            slug: createSlug(
              constituencyName
            ),
            regionId: region._id,
            constituencyNumber,
            isActive: true,
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

    constituencyMap.set(
      `${normalizeKey(
        regionName
      )}::${normalizeKey(
        constituencyName
      )}`,
      constituency
    );
  }

  return constituencyMap;
}

// ============================================================
// CREATE / UPDATE POLLING STATIONS
// ============================================================

async function seedPollingStations(
  rows,
  regionMap,
  constituencyMap
) {
  let processed = 0;

  for (const row of rows) {
    const code = normalize(
      row.polling_station_code
    ).toUpperCase();

    const stationName =
      normalize(
        row.polling_station_name
      );

    const regionName =
      normalize(row.region);

    const constituencyName =
      normalize(row.constituency);

    const district =
      normalize(row.district);

    const region =
      regionMap.get(
        normalizeKey(regionName)
      );

    if (!region) {
      throw new Error(
        `Unknown region "${regionName}" for polling station ${code}.`
      );
    }

    const constituency =
      constituencyMap.get(
        `${normalizeKey(
          regionName
        )}::${normalizeKey(
          constituencyName
        )}`
      );

    if (!constituency) {
      throw new Error(
        `Unknown constituency "${constituencyName}" in "${regionName}" for polling station ${code}.`
      );
    }

    await PollingStation.findOneAndUpdate(
      {
        pollingStationCode: code,
      },
      {
        $set: {
          pollingStationCode: code,
          name: stationName,
          regionId: region._id,
          constituencyId:
            constituency._id,
          district,
          stationType: "ordinary",
          source:
            row.source ||
            "Ghana Electoral Commission 2024 Polling Stations",
          sourceYear: 2024,
          isActive: true,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    processed++;

    if (processed % 1000 === 0) {
      console.log(
        `Processed ${processed.toLocaleString()} polling stations...`
      );
    }
  }

  return processed;
}

// ============================================================
// MAIN IMPORT PROCESS
// ============================================================

async function main() {
  try {
    console.log(
      "\n=============================================="
    );

    console.log(
      "POLISYNC AFRICA"
    );

    console.log(
      "GHANA ELECTORAL GEOGRAPHY IMPORTER"
    );

    console.log(
      "==============================================\n"
    );

    // --------------------------------------------------------
    // READ SOURCE FILES
    // --------------------------------------------------------

    console.log(
      "Reading regions and constituencies..."
    );

    const geographyRows =
      readCSV(GEOGRAPHY_FILE);

    console.log(
      `Loaded ${geographyRows.length} geography rows.`
    );

    console.log(
      "\nReading polling stations..."
    );

    const pollingStationRows =
      readCSV(
        POLLING_STATIONS_FILE
      );

    console.log(
      `Loaded ${pollingStationRows.length.toLocaleString()} polling-station rows.`
    );

    // --------------------------------------------------------
    // VALIDATE SOURCE DATA
    // --------------------------------------------------------

    console.log(
      "\nValidating geography..."
    );

    const geographySummary =
      validateGeographyData(
        geographyRows
      );

    console.log(
      `✓ Regions: ${geographySummary.regionCount}`
    );

    console.log(
      `✓ Constituencies: ${geographySummary.constituencyCount}`
    );

    console.log(
      "\nValidating polling stations..."
    );

    const pollingSummary =
      validatePollingStationData(
        pollingStationRows
      );

    console.log(
      `✓ Polling station codes: ${pollingSummary.pollingStationCount.toLocaleString()}`
    );

    // --------------------------------------------------------
    // CONNECT TO MONGODB
    // --------------------------------------------------------

    console.log(
      "\nConnecting to MongoDB..."
    );

    await mongoose.connect(
      MONGODB_URI
    );

    console.log(
      "✓ MongoDB connected."
    );

    // --------------------------------------------------------
    // REGIONS
    // --------------------------------------------------------

    console.log(
      "\nCreating/updating regions..."
    );

    const regionMap =
      await seedRegions(
        geographyRows
      );

    console.log(
      `✓ ${regionMap.size} regions ready.`
    );

    // --------------------------------------------------------
    // CONSTITUENCIES
    // --------------------------------------------------------

    console.log(
      "\nCreating/updating constituencies..."
    );

    const constituencyMap =
      await seedConstituencies(
        geographyRows,
        regionMap
      );

    console.log(
      `✓ ${constituencyMap.size} constituencies ready.`
    );

    // --------------------------------------------------------
    // POLLING STATIONS
    // --------------------------------------------------------

    console.log(
      "\nCreating/updating polling stations..."
    );

    const processed =
      await seedPollingStations(
        pollingStationRows,
        regionMap,
        constituencyMap
      );

    console.log(
      `✓ ${processed.toLocaleString()} polling stations processed.`
    );

    // --------------------------------------------------------
    // VERIFY DATABASE
    // --------------------------------------------------------

    console.log(
      "\nVerifying database..."
    );

    const regionCount =
      await Region.countDocuments({
        isActive: true,
      });

    const constituencyCount =
      await Constituency.countDocuments({
        isActive: true,
      });

    const pollingStationCount =
      await PollingStation.countDocuments({
        isActive: true,
      });

    // --------------------------------------------------------
    // FINAL REPORT
    // --------------------------------------------------------

    console.log(
      "\n=============================================="
    );

    console.log(
      "IMPORT COMPLETE"
    );

    console.log(
      "=============================================="
    );

    console.log(
      `Regions: ${regionCount}`
    );

    console.log(
      `Constituencies: ${constituencyCount}`
    );

    console.log(
      `Polling stations: ${pollingStationCount.toLocaleString()}`
    );

    console.log(
      "==============================================\n"
    );

    await mongoose.disconnect();

    console.log(
      "MongoDB connection closed."
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "\n=============================================="
    );

    console.error(
      "IMPORT FAILED"
    );

    console.error(
      "=============================================="
    );

    console.error(
      error.message
    );

    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      // Ignore disconnect errors.
    }

    process.exit(1);
  }
}

// ============================================================
// START
// ============================================================

main();
