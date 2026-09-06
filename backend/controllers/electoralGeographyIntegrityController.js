const { checkElectoralGeographyIntegrity } = require("../services/electoralGeographyIntegrityService");

exports.report = async (req, res) => {
  try {
    const report = await checkElectoralGeographyIntegrity();
    return res.json({ success: true, data: report });
  } catch (error) {
    console.error("Electoral geography integrity check failed:", error);
    return res.status(500).json({
      success: false,
      code: "ELECTORAL_GEOGRAPHY_INTEGRITY_FAILED",
      message: "Unable to validate electoral geography integrity.",
    });
  }
};
