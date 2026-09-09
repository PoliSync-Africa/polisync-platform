// Compatibility entry point retained for existing controllers, routes and jobs.
// The authoritative synchronizer uses EC polling-station codes to resolve
// constituency geography, then validates the complete official registers
// before writing anything to MongoDB.
module.exports = require("./syncPollingStationsFromEcCodeBased");
