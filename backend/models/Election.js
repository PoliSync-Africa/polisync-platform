const mongoose = require("mongoose");

const ElectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    year: {
      type: Number,
      required: true
    },

    type: {
      type: String,
      enum: ["Presidential", "Parliamentary", "Local"],
      required: true
    },

    country: {
      type: String,
      default: "Ghana"
    },

    status: {
      type: String,
      enum: ["Draft", "Active", "Closed"],
      default: "Draft"
    },

    totalPollingStations: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Election", ElectionSchema);
