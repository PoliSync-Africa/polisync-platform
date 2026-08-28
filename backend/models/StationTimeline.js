const mongoose = require("mongoose");

const StationTimelineSchema = new mongoose.Schema(
  {
    pollingStation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GeoUnit",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },

    eventType: {
      type: String,
      enum: [
        "AgentAssigned",
        "CheckedIn",
        "IncidentReported",
        "EC8Uploaded",
        "Verified",
        "Alert",
      ],
      required: true,
      index: true,
    },

    message: {
      type: String,
      trim: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

StationTimelineSchema.index({
  pollingStation: 1,
  createdAt: -1,
});

module.exports = mongoose.model("StationTimeline", StationTimelineSchema);
