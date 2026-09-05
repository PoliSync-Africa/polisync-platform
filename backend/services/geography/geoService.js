
const GeoUnit = require("../../models/GeoUnit");

async function getChildren(parentId) {
  return GeoUnit.find({ parent: parentId }).sort("name");
}

async function getRegions(countryId) {
  return GeoUnit.find({
    country: countryId,
    level: "Region"
  }).sort("name");
}

async function getPollingStations(constituencyId) {
  return GeoUnit.find({
    parent: constituencyId,
    level: "PollingStation"
  }).sort("name");
}

module.exports = {
  getChildren,
  getRegions,
  getPollingStations
};
