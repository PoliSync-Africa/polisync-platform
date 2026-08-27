const geoService = require("../services/geography/geoService");
const GeoUnit = require("../models/GeoUnit");

exports.getRegions = async (req, res) => {
  const regions = await geoService.getRegions(req.params.countryId);

  res.json({
    success: true,
    data: regions,
  });
};

exports.getChildren = async (req, res) => {
  const children = await geoService.getChildren(req.params.parentId);

  res.json({
    success: true,
    data: children,
  });
};

exports.createGeoUnit = async (req, res) => {
  const unit = await GeoUnit.create(req.body);

  res.status(201).json({
    success: true,
    data: unit,
  });
};
