const ocrService = require("./ocr/ocrService");
const translateService = require("./translation/translateService");
const reportGenerator = require("./reports/reportGenerator");
const anomalyDetector = require("./anomaly/anomalyDetector");
const assistantService = require("./assistant/assistantService");
const briefingGenerator = require("./briefing/briefingGenerator");

module.exports = {
  ocrService,
  translateService,
  reportGenerator,
  anomalyDetector,
  assistantService,
  briefingGenerator,
};
