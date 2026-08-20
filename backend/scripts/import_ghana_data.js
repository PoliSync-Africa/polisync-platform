const fs = require("fs");
const path = require("path");

function loadElectionData(fileName) {
  const filePath = path.join(__dirname, "../../database/data", fileName);

  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${fileName}`);
    return [];
  }

  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function summarize(data, label) {
  console.log(`Imported ${data.length} ${label}`);
}

const regions = loadElectionData("regions.json");
const districts = loadElectionData("districts.json");
const constituencies = loadElectionData("constituencies.json");
const pollingStations = loadElectionData("polling_stations.json");

summarize(regions, "regions");
summarize(districts, "districts");
summarize(constituencies, "constituencies");
summarize(pollingStations, "polling stations");

console.log("Ghana Election Import Engine Ready.");
