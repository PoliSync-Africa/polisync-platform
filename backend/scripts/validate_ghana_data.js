const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../../database/data");

function load(file) {
  return JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, file), "utf8")
  );
}

function validateUniqueIds(records, name) {
  const ids = new Set();

  for (const record of records) {
    if (ids.has(record.id)) {
      throw new Error(`Duplicate ${name} ID: ${record.id}`);
    }

    ids.add(record.id);
  }

  console.log(`✓ ${name}: ${records.length} records validated.`);
}

function run() {
  const regions = load("regions.json");
  const districts = load("districts.json");
  const constituencies = load("constituencies.json");
  const pollingStations = load("polling_stations.json");

  validateUniqueIds(regions, "Regions");
  validateUniqueIds(districts, "Districts");
  validateUniqueIds(constituencies, "Constituencies");
  validateUniqueIds(pollingStations, "Polling Stations");

  console.log("✓ Ghana National Dataset Validation Complete.");
}

run();
