const fs = require("fs");
const path = require("path");

const requiredModules = [
  "../app.js",
  "../routes/health.js",
  "../routes/results.js",
  "../routes/organization.js",
  "../routes/aiRoutes.js",
  "../controllers/resultsController.js",
  "../controllers/resultsAdminController.js",
  "../controllers/organizationController.js",
  "../services/ai/assistant/assistantService.js",
  "../services/ai/config/aiConfig.js",
  "../gis/loaders/geoJsonLoader.js",
  "../gis/services/gisService.js",
];

for (const relative of requiredModules) {
  const file = path.resolve(__dirname, relative);
  if (!fs.existsSync(file)) throw new Error(`Missing required module: ${file}`);
  require(file);
  console.log(`OK ${relative}`);
}

const geojson = path.resolve(__dirname, "../gis/ghana/regions/ghana-regions.geojson");
if (!fs.existsSync(geojson)) throw new Error(`Missing GeoJSON dataset: ${geojson}`);
const parsed = JSON.parse(fs.readFileSync(geojson, "utf8"));
if (parsed.type !== "FeatureCollection" || !Array.isArray(parsed.features)) throw new Error("Invalid Ghana regions GeoJSON dataset.");
console.log(`OK Ghana regions GeoJSON (${parsed.features.length} features)`);
console.log("PoliSync backend smoke test passed.");
