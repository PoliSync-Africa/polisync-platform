// Compatibility entry point retained for existing controllers, routes and jobs.
// The robust parser is now the single source of truth for EC polling-station sync.
module.exports = require("./syncPollingStationsFromEcRobust");
