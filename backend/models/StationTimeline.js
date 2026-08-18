const mongoose = require("mongoose");

const StationTimelineSchema = new mongoose.Schema(
  {
    pollingStation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GeoUnit"
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    eventType: {
      type: String,
      enum: [
        "AgentAssigned",
        "CheckedIn",
        "IncidentReported",
        "EC8Uploaded",
        "Verified",
        "Alert"
      ]
    },

    message: String,

    metadata: Object
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "StationTimeline",
  StationTimelineSchema
);
