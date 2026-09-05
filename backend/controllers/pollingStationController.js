const stationProfileService = require("../services/pollingStation/stationProfileService");

exports.getStationProfile = async (req, res) => {
  const profile = await stationProfileService.getProfile(req.params.id);

  res.json({
    success: true,
    data: profile,
  });
};
