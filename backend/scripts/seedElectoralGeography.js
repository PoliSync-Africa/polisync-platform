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
// DATABASE CONNECTION
// ============================================================

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("ERROR: MONGO_URI is not configured.");
  process.exit(1);
}

// ============================================================
// DATA FILE
// ============================================================
//
// Expected location:
//
// backend/data/ghana_polling_stations_2024.csv
//
// The CSV must contain:
//
// number
// polling_station_code
// polling_station_name
// constituency
// district
// region
// source
// ============================================================

const DATA_FILE = path.join(
  __dirname,
  "../data/ghana_polling_stations_2024.csv"
);

// ============================================================
// GHANA'S 16 REGIONS
// ============================================================

const GHANA_REGIONS = [
  "Ahafo",
  "Ashanti",
  "Bono",
  "Bono East",
  "Central",
  "Eastern",
  "Greater Accra",
  "North East",
  "Northern",
  "Oti",
  "Savannah",
  "Upper East",
  "Upper West",
  "Volta",
  "Western",
  "Western North",
];

// ============================================================
// CSV PARSER
// ============================================================
//
// This parser handles quoted CSV fields and commas inside
// quoted values without requiring another npm package.
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

// ============================================================
// LOAD CSV
// ============================================================

function loadCSV(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `EC data file not found:\n${filePath}`
    );
  }

  const raw = fs.readFileSync(
    filePath,
    "utf8"
  );

  const lines = raw
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    throw new Error(
      "EC polling-station CSV is empty or incomplete."
    );
  }

  const headers = parseCSVLine(lines[0]).map(
    (header) => header.trim()
  );

  const requiredHeaders = [
    "number",
    "polling_station_code",
    "polling_station_name",
    "constituency",
    "district",
    "region",
  ];

  for (const header of requiredHeaders) {
    if (!headers.includes(header)) {
      throw new Error(
        `Missing required CSV column: ${header}`
      );
    }
  }

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

function normalizeRegion(value) {
  const cleaned = normalize(value);

  const region = GHANA_REGIONS.find(
    (item) =>
      item.toLowerCase() ===
      cleaned.toLowerCase()
  );

  if (!region) {
    throw new Error(
      `Unknown Ghana region: "${value}"`
    );
  }

  return region;
}

function createSlug(value) {
  return normalize(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ============================================================
// VALIDATE SOURCE DATA
// ============================================================

function validateRows(rows) {
  const codes = new Set();
  const constituencies = new Set();
  const regions = new Set();

  for (const row of rows) {
    if (!row.polling_station_code) {
      throw new Error(
        "A polling station is missing its EC code."
      );
    }

    if (!row.polling_station_name) {
      throw new Error(
        `Polling station ${row.polling_station_code} is missing its name.`
      );
    }

    if (!row.constituency) {
      throw new Error(
        `Polling station ${row.polling_station_code} is missing its constituency.`
      );
    }

    if (!row.district) {
      throw new Error(
        `Polling station ${row.polling_station_code} is missing its district.`
      );
    }

    if (!row.region) {
      throw new Error(
        `Polling station ${row.polling_station_code} is missing its region.`
      );
    }

    const code = normalize(
      row.polling_station_code
    ).toUpperCase();

    if (codes.has(code)) {
      throw new Error(
        `Duplicate polling station code detected: ${code}`
      );
    }

    codes.add(code);

    const region = normalizeRegion(
      row.region
    );

    regions.add(region);

    constituencies.add(
      `${region}::${normalize(
        row.constituency
      )}`
    );
  }

  return {
    pollingStations: codes.size,
    constituencies: constituencies.size,
    regions: regions.size,
  };
}

// ============================================================
// SEED REGIONS
// ============================================================

async function seedRegions() {
  const regionMap = new Map();

  for (
    let index = 0;
    index < GHANA_REGIONS.length;
    index++
  ) {
    const name = GHANA_REGIONS[index];

    const region =
      await Region.findOneAndUpdate(
        { name },
        {
          $set: {
            name,
            slug: createSlug(name),
            country: "Ghana",
            regionNumber: index + 1,
            isActive: true,
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

    regionMap.set(name, region);

    console.log(
      `Region ready: ${index + 1}. ${name}`
    );
  }

  return regionMap;
}

// ============================================================
// SEED CONSTITUENCIES
// ============================================================

async function seedConstituencies(
  rows,
  regionMap
) {
  const constituencyMap = new Map();

  // Use a Set so we create each constituency only once.

  const uniqueConstituencies =
    new Map();

  for (const row of rows) {
    const regionName =
      normalizeRegion(row.region);

    const constituencyName =
      normalize(row.constituency);

    const district =
      normalize(row.district);

    const key =
      `${regionName}::${constituencyName}`;

    if (!uniqueConstituencies.has(key)) {
      uniqueConstituencies.set(key, {
        regionName,
        constituencyName,
        district,
      });
    }
  }

  for (const item of uniqueConstituencies.values()) {
    const region =
      regionMap.get(item.regionName);

    if (!region) {
      throw new Error(
        `Region not found: ${item.regionName}`
      );
    }

    const constituency =
      await Constituency.findOneAndUpdate(
        {
          regionId: region._id,
          name: item.constituencyName,
        },
        {
          $set: {
            name: item.constituencyName,
            slug: createSlug(
              item.constituencyName
            ),
            regionId: region._id,
            district: item.district,
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
      `${item.regionName}::${item.constituencyName}`,
      constituency
    );
  }

  return constituencyMap;
}

// ============================================================
// SEED POLLING STATIONS
// ============================================================

async function seedPollingStations(
  rows,
  regionMap,
  constituencyMap
) {
  let imported = 0;

  for (const row of rows) {
    const regionName =
      normalizeRegion(row.region);

    const constituencyName =
      normalize(row.constituency);

    const code =
      normalize(
        row.polling_station_code
      ).toUpperCase();

    const stationName =
      normalize(
        row.polling_station_name
      );

    const district =
      normalize(row.district);

    const region =
      regionMap.get(regionName);

    if (!region) {
      throw new Error(
        `Region not found for polling station ${code}`
      );
    }

    const constituency =
      constituencyMap.get(
        `${regionName}::${constituencyName}`
      );

    if (!constituency) {
      throw new Error(
        `Constituency not found for polling station ${code}`
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
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    imported++;

    if (
      imported % 1000 === 0
    ) {
      console.log(
        `Polling stations processed: ${imported}`
      );
    }
  }

  return imported;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  try {
    console.log(
      "=============================================="
    );

    console.log(
      "POLISYNC AFRICA"
    );

    console.log(
      "Ghana Electoral Geography Seeder"
    );

    console.log(
      "=============================================="
    );

    console.log(
      `Loading EC data from:\n${DATA_FILE}`
    );

    const rows = loadCSV(DATA_FILE);

    console.log(
      `Loaded ${rows.length.toLocaleString()} records.`
    );

    const summary =
      validateRows(rows);

    console.log(
      "\nSource validation:"
    );

    console.log(
      `Regions: ${summary.regions}`
    );

    console.log(
      `Constituencies: ${summary.constituencies}`
    );

    console.log(
      `Polling stations: ${summary.pollingStations.toLocaleString()}`
    );

    if (summary.regions !== 16) {
      throw new Error(
        `Expected 16 regions but found ${summary.regions}.`
      );
    }

    if (summary.constituencies !== 276) {
      throw new Error(
        `Expected 276 constituencies but found ${summary.constituencies}.`
      );
    }

    await mongoose.connect(
      MONGO_URI
    );

    console.log(
      "\nConnected to MongoDB."
    );

    const regionMap =
      await seedRegions();

    console.log(
      "\n16 regions are ready."
    );

    const constituencyMap =
      await seedConstituencies(
        rows,
        regionMap
      );

    console.log(
      `${constituencyMap.size} constituencies are ready.`
    );

    const imported =
      await seedPollingStations(
        rows,
        regionMap,
        constituencyMap
      );

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
      `Regions: ${regionMap.size}`
    );

    console.log(
      `Constituencies: ${constituencyMap.size}`
    );

    console.log(
      `Polling stations processed: ${imported.toLocaleString()}`
    );

    console.log(
      "EC electoral geography is ready."
    );

    console.log(
      "=============================================="
    );

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error(
      "\n=============================================="
    );

    console.error(
      "GEOGRAPHY IMPORT FAILED"
    );

    console.error(
      "=============================================="
    );

    console.error(
      error.message
    );

    try {
      await mongoose.disconnect();
    } catch {}

    process.exit(1);
  }
}

// ============================================================
// START
// ============================================================

main();
