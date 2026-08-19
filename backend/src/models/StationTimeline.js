const mongoose = require("mongoose");

const stationTimelineSchema = new mongoose.Schema(
  {
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PollingStation",
      index: true
    },
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      enum: [
        "LOGIN",
        "LOGOUT",
        "RESULT_CREATED",
        "RESULT_UPDATED",
        "RESULT_APPROVED",
        "RESULT_REJECTED",
        "PHOTO_UPLOADED",
        "FORM_UPLOADED",
        "POLLING_STATION_ASSIGNED",
        "USER_CREATED",
        "USER_UPDATED",
        "SYSTEM_EVENT"
      ]
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String
    },
    device: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("StationTimeline", stationTimelineSchema);
