const mongoose = require("mongoose");

const PollingStationProfileSchema = new mongoose.Schema(
  {
    pollingStation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GeoUnit",
      required: true,
      unique: true
    },

    officialName: String,

    ecCode: {
      type: String,
      required: true
    },

    location: {
      latitude: Number,
      longitude: Number
    },

    networkProvider: String,

    signalStrength: Number,

    accessibility: {
      wheelchair: Boolean,
      roadAccess: Boolean
    },

    historicalTurnout: [
      {
        year: Number,
        turnout: Number
      }
    ],

    currentTrustScore: {
      type: Number,
      default: 100
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "PollingStationProfile",
  PollingStationProfileSchema
);
