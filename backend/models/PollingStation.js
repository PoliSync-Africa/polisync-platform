const mongoose = require("mongoose");

const PollingStationSchema = new mongoose.Schema(
  {
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: true
    },

    constituency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminArea",
      required: true
    },

    electoralArea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminArea"
    },

    name: {
      type: String,
      required: true
    },

    code: {
      type: String,
      required: true,
      unique: true
    },

    gps: {
      latitude: Number,
      longitude: Number
    },

    registeredVoters: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("PollingStation", PollingStationSchema);
