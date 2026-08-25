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
// DATABASE
// ============================================================

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("ERROR: MONGO_URI is not configured.");
  process.exit(1);
}

// ============================================================
// SOURCE DATA FILES
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
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);

  return values;
}

function readCSV(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found:\n${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf8");

  const lines = raw
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    throw new Error(`CSV file is empty:\n${filePath}`);
  }

  const headers = parseCSVLine(lines[0]).map((header) =>
    header.trim()
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
// TEXT HELPERS
// ============================================================

function normalize(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function createSlug(value) {
  return normalize(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ============================================================
// VALIDATE GEOGRAPHY FILE
// ============================================================

function validateGeographyData(rows) {
  const requiredHeaders = [
    "region_number",
    "region",
    "constituency_number_in_region",
    "constituency",
  ];

  if (rows.length === 0) {
    throw new Error(
      "The regions/constituencies CSV contains no records."
    );
  }

  for (const header of requiredHeaders) {
    if (!(header in rows[0])) {
      throw new Error(
        `Missing geography CSV column: ${header}`
      );
    }
  }

  const regionSet = new Set();
  const constituencySet = new Set();

  for (const row of rows) {
    const region = normalize(row.region);
    const constituency = normalize(row.constituency);

    if (!region) {
      throw new Error(
        "A geography record is missing its region."
      );
    }

    if (!constituency) {
      throw new Error(
        `Region "${region}" has a record without a constituency.`
      );
    }

    regionSet.add(region);

    constituencySet.add(
      `${region}::${constituency}`
    );
  }

  if (regionSet.size !== 16) {
    throw new Error(
      `Expected 16 regions but found ${regionSet.size}.`
    );
  }

  if (constituencySet.size !== 276) {
    throw new Error(
      `Expected 276 constituencies but found ${constituencySet.size}.`
    );
  }

  return {
    regions: regionSet.size,
    constituencies: constituencySet.size,
  };
}

// ============================================================
// VALIDATE POLLING-STATION FILE
// ============================================================

function validatePollingData(rows) {
  const requiredHeaders = [
    "polling_station_code",
    "polling_station_name",
    "constituency",
    "district",
    "region",
  ];

  if (rows.length === 0) {
    throw new Error(
      "The polling-station CSV contains no records."
    );
  }

  for (const header of requiredHeaders) {
    if (!(header in rows[0])) {
      throw new Error(
        `Missing polling-station CSV column: ${header}`
      );
    }
  }

  const codeSet = new Set();

  for (const row of rows) {
    const code = normalize(
      row.polling_station_code
    ).toUpperCase();

    if (!code) {
      throw new Error(
        "A polling station is missing its EC polling-station code."
      );
    }

    if (codeSet.has(code)) {
      throw new Error(
        `Duplicate polling-station code found: ${code}`
      );
    }

    codeSet.add(code);

    if (!normalize(row.polling_station_name)) {
      throw new Error(
        `Polling station ${code} is missing its name.`
      );
    }

    if (!normalize(row.constituency)) {
      throw new Error(
        `Polling station ${code} is missing its constituency.`
      );
    }

    if (!normalize(row.region)) {
      throw new Error(
        `Polling station ${code} is missing its region.`
      );
    }
  }

  return {
    pollingStations: codeSet.size,
  };
}

// ============================================================
// SEED REGIONS
// ============================================================

async function seedRegions(geographyRows) {
  const regionMap = new Map();

  const uniqueRegions = new Map();

  for (const row of geographyRows) {
    const region = normalize(row.region);
    const regionNumber = Number(
      row.region_number
    );

    if (!uniqueRegions.has(region)) {
      uniqueRegions.set(region, regionNumber);
    }
  }

  const sortedRegions = [...uniqueRegions.entries()]
    .sort((a, b) => a[1] - b[1]);

  for (const [name, regionNumber] of sortedRegions) {
    const region = await Region.findOneAndUpdate(
      { name },
      {
        $set: {
          name,
          slug: createSlug(name),
          country: "Ghana",
          regionNumber,
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
      `Region ready: ${regionNumber}. ${name}`
    );
  }

  return regionMap;
}

// ============================================================
// SEED CONSTITUENCIES
// ============================================================

async function seedConstituencies(
  geographyRows,
  regionMap
) {
  const constituencyMap = new Map();

  for (const row of geographyRows) {
    const regionName = normalize(row.region);
    const constituencyName =
      normalize(row.constituency);

    const constituencyNumber = Number(
      row.constituency_number_in_region
    );

    const region = regionMap.get(regionName);

    if (!region) {
      throw new Error(
        `Region "${regionName}" does not exist.`
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
      `${regionName}::${constituencyName}`,
      constituency
    );
  }

  return constituencyMap;
}

// ============================================================
// SEED POLLING STATIONS
// ============================================================

async function seedPollingStations(
  pollingRows,
  regionMap,
  constituencyMap
) {
  let processed = 0;

  for (const row of pollingRows) {
    const code = normalize(
      row.polling_station_code
    ).toUpperCase();

    const stationName = normalize(
      row.polling_station_name
    );

    const regionName = normalize(row.region);

    const constituencyName =
      normalize(row.constituency);

    const district = normalize(row.district);

    const region = regionMap.get(regionName);

    if (!region) {
      throw new Error(
        `Polling station ${code} references unknown region: ${regionName}`
      );
    }

    const constituency =
      constituencyMap.get(
        `${regionName}::${constituencyName}`
      );

    if (!constituency) {
      throw new Error(
        `Polling station ${code} references unknown constituency: ${constituencyName} in ${regionName}`
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
        `Polling stations processed: ${processed.toLocaleString()}`
      );
    }
  }

  return processed;
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
      "Ghana Electoral Geography Import"
    );

    console.log(
      "=============================================="
    );

    // --------------------------------------------------------
    // LOAD SOURCE FILES
    // --------------------------------------------------------

    console.log(
      "\nLoading regional/constituency data..."
    );

    const geographyRows =
      readCSV(GEOGRAPHY_FILE);

    console.log(
      `Loaded ${geographyRows.length} geography records.`
    );

    console.log(
      "\nLoading polling-station data..."
    );

    const pollingRows =
      readCSV(POLLING_STATIONS_FILE);

    console.log(
      `Loaded ${pollingRows.length.toLocaleString()} polling-station records.`
    );

    // --------------------------------------------------------
    // VALIDATE
    // --------------------------------------------------------

    console.log(
      "\nValidating geography data..."
    );

    const geographySummary =
      validateGeographyData(
        geographyRows
      );

    console.log(
      `✓ ${geographySummary.regions} regions`
    );

    console.log(
      `✓ ${geographySummary.constituencies} constituencies`
    );

    console.log(
      "\nValidating polling-station data..."
    );

    const pollingSummary =
      validatePollingData(
        pollingRows
      );

    console.log(
      `✓ ${pollingSummary.pollingStations.toLocaleString()} unique polling-station codes`
    );

    // --------------------------------------------------------
    // CONNECT TO DATABASE
    // --------------------------------------------------------

    console.log(
      "\nConnecting to MongoDB..."
    );

    await mongoose.connect(MONGO_URI);

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

    // --------------------------------------------------------
    // POLLING STATIONS
    // --------------------------------------------------------

    console.log(
      "\nCreating/updating polling stations..."
    );

    const pollingStationsProcessed =
      await seedPollingStations(
        pollingRows,
        regionMap,
        constituencyMap
      );

    // --------------------------------------------------------
    // FINAL DATABASE COUNTS
    // --------------------------------------------------------

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
      "ELECTORAL GEOGRAPHY IMPORT COMPLETE"
    );

    console.log(
      "=============================================="
    );

    console.log(
      `Regions in database: ${regionCount}`
    );

    console.log(
      `Constituencies in database: ${constituencyCount}`
    );

    console.log(
      `Polling stations in database: ${pollingStationCount.toLocaleString()}`
    );

    console.log(
      `Polling stations processed this run: ${pollingStationsProcessed.toLocaleString()}`
    );

    console.log(
      "=============================================="
    );

    await mongoose.disconnect();

    console.log(
      "\nMongoDB connection closed."
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "\n=============================================="
    );

    console.error(
      "ELECTORAL GEOGRAPHY IMPORT FAILED"
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
