const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../../database/data");
const SOURCE_DIR = path.join(__dirname, "../../database/source");

// ---------- Utilities ----------

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadJSON(dir, file) {
  const filePath = path.join(dir, file);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function saveJSON(file, data) {
  fs.writeFileSync(
    path.join(DATA_DIR, file),
    JSON.stringify(data, null, 2)
  );
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
}

// ---------- Constituency Generator ----------

function generateConstituencies() {
  const source = loadJSON(SOURCE_DIR, "ghana_constituencies.json");

  let id = 1;
  const output = [];

  for (const region of source.regions) {
    for (const constituency of region.constituencies) {
      output.push({
        id: id++,
        region_id: region.region_id,
        name: constituency
      });
    }
  }

  return output;
}

// ---------- Future Generators ----------

function generateDistricts() {
  return [];
}

function generatePollingStations() {
  return [];
}

// ---------- Main ----------

function run() {
  ensureDirectory(DATA_DIR);
  ensureDirectory(SOURCE_DIR);

  console.log("====================================");
  console.log("POLISYNC AFRICA DATA GENERATOR");
  console.log("====================================");

  const regions = loadJSON(DATA_DIR, "regions.json");

  validateRegions(regions);

  const districts = generateDistricts();
  saveJSON("districts.json", districts);

  const constituencies = generateConstituencies();
  saveJSON("constituencies.json", constituencies);

  const pollingStations = generatePollingStations();
  saveJSON("polling_stations.json", pollingStations);

  console.log("------------------------------------");
  console.log(`Regions: ${regions.length}`);
  console.log(`Districts: ${districts.length}`);
  console.log(`Constituencies: ${constituencies.length}`);
  console.log(`Polling Stations: ${pollingStations.length}`);
  console.log("------------------------------------");
  console.log("Generation completed successfully.");
}

run();
