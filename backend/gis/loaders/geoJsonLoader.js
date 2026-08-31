const fs = require("fs");
const path = require("path");

function resolveDataPath(relativePath) {
  return path.resolve(__dirname, "..", relativePath);
}

function loadGeoJSON(relativePath) {
  const filePath = resolveDataPath(relativePath);
  if (!fs.existsSync(filePath)) {
    const error = new Error(`GeoJSON file not found: ${filePath}`);
    error.code = "GEOJSON_NOT_FOUND";
    throw error;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    const parseError = new Error(`Invalid GeoJSON JSON: ${filePath}`);
    parseError.code = "GEOJSON_INVALID_JSON";
    parseError.cause = error;
    throw parseError;
  }

  if (!data || data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
    const error = new Error(`Invalid GeoJSON FeatureCollection: ${filePath}`);
    error.code = "GEOJSON_INVALID_COLLECTION";
    throw error;
  }

  return data;
}

module.exports = { loadGeoJSON };
