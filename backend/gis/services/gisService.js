const { loadGeoJSON } = require("../loaders/geoJsonLoader");

function getGhanaRegions() {
  return loadGeoJSON("ghana/regions/ghana-regions.geojson");
}

function getRegionBoundary(regionCode) {
  const data = getGhanaRegions();

  return data.features.find(
    (feature) => feature.properties.code === regionCode
  );
}

module.exports = {
  getGhanaRegions,
  getRegionBoundary,
};
