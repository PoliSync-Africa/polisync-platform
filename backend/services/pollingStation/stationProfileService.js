const PollingStationProfile = require("../../models/PollingStationProfile");

async function getProfile(stationId) {
  return PollingStationProfile.findOne({
    pollingStation: stationId
  });
}

module.exports = {
  getProfile
};
