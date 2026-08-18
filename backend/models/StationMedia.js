const mongoose = require("mongoose");

const StationMediaSchema = new mongoose.Schema(
  {
    pollingStation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GeoUnit"
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    type: {
      type: String,
      enum: [
        "StationPhoto",
        "EC8",
        "IncidentPhoto",
        "Video",
        "Audio"
      ]
    },

    url: String,

    aiProcessed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "StationMedia",
  StationMediaSchema
);
