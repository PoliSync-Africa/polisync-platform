// Compatibility entry point retained for existing controllers, routes and jobs.
// The primary synchronizer uses the official Ghana Electoral Commission
// polling-station register and performs table/text extraction with validation.
module.exports = require("./syncPollingStationsFromEcRobust");
