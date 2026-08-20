const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../../database/data");

// ---------- Utility Functions ----------

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadJSON(fileName) {
  const filePath = path.join(DATA_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    return [];
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function saveJSON(fileName, data) {
  const filePath = path.join(DATA_DIR, fileName);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function log(title, value) {
  console.log(`${title}: ${value}`);
}

// ---------- Validation ----------

function validateRegions(regions) {
  const ids = new Set();

  for (const region of regions) {
    if (ids.has(region.id)) {
      throw new Error(`Duplicate region ID: ${region.id}`);
    }

    ids.add(region.id);
  }

  return true;
}

// ---------- Data Generators ----------

function generateDistricts(regions) {
  console.log("District generator ready.");
  console.log(
    "Official Electoral Commission district dataset will populate this file."
  );

  return [];
}

function generateConstituencies(regions, districts) {
  console.log("Constituency generator ready.");
  console.log(
    "Official Electoral Commission constituency dataset will populate this file."
  );

  return [];
}

function generatePollingStations(regions, districts, constituencies) {
  console.log("Polling station generator ready.");
  console.log(
    "Official Electoral Commission polling station dataset will populate this file."
  );

  return [];
}

// ---------- Main ----------

function run() {
  ensureDataDirectory();

  console.log("========================================");
  console.log("POLISYNC AFRICA DATA GENERATOR");
  console.log("========================================");

  const regions = loadJSON("regions.json");

  validateRegions(regions);

  const districts = generateDistricts(regions);
  saveJSON("districts.json", districts);

  const constituencies = generateConstituencies(regions, districts);
  saveJSON("constituencies.json", constituencies);

  const pollingStations = generatePollingStations(
    regions,
    districts,
    constituencies
  );
  saveJSON("polling_stations.json", pollingStations);

  console.log("----------------------------------------");
  log("Regions", regions.length);
  log("Districts", districts.length);
  log("Constituencies", constituencies.length);
  log("Polling Stations", pollingStations.length);
  console.log("----------------------------------------");
  console.log("Generation completed successfully.");
}

run();
