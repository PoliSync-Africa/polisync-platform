const gisService = require("../gis/services/gisService");

exports.getGhanaRegions = (req, res) => {

  res.json({
    success: true,
    data: gisService.getGhanaRegions()
  });

};

exports.getRegion = (req, res) => {

  const region =
    gisService.getRegionBoundary(req.params.code);

  res.json({
    success: true,
    data: region
  });

};
