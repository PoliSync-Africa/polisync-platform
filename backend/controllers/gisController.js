const gisService = require("../gis/services/gisService");

exports.getGhanaRegions = (req, res) => {
  try {
    return res.json({ success: true, data: gisService.getGhanaRegions() });
  } catch (error) {
    console.error("GIS regions error:", error);
    return res.status(503).json({ success: false, message: error.message || "Ghana region geometry is unavailable." });
  }
};

exports.getRegion = (req, res) => {
  try {
    const region = gisService.getRegionBoundary(String(req.params.code || "").trim());
    if (!region) return res.status(404).json({ success: false, message: "Region boundary not found." });
    return res.json({ success: true, data: region });
  } catch (error) {
    console.error("GIS region error:", error);
    return res.status(503).json({ success: false, message: error.message || "Region geometry is unavailable." });
  }
};
