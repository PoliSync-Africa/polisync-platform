const StationTimeline = require("../../models/StationTimeline");

async function logEvent(data) {
  return StationTimeline.create(data);
}

module.exports = {
  logEvent
};
