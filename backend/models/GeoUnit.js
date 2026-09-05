
const mongoose = require("mongoose");

const GeoUnitSchema = new mongoose.Schema(
  {
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: true
    },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GeoUnit",
      default: null
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },

    level: {
      type: String,
      enum: [
        "Country",
        "Region",
        "County",
        "State",
        "Province",
        "District",
        "Municipality",
        "Constituency",
        "Ward",
        "ElectoralArea",
        "PollingStation"
      ],
      required: true
    },

    gps: {
      latitude: Number,
      longitude: Number
    },

    boundaryGeoJSON: {
      type: Object,
      default: null
    },

    population: {
      type: Number,
      default: null
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

GeoUnitSchema.index({ country: 1, level: 1 });
GeoUnitSchema.index({ parent: 1 });
GeoUnitSchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model("GeoUnit", GeoUnitSchema);
