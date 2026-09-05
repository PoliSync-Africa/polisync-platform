const mongoose = require("mongoose");

const CountrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },

    capital: {
      type: String,
      default: ""
    },

    currency: {
      type: String,
      default: ""
    },

    defaultElectionAuthority: {
      type: String,
      default: ""
    },

    continent: {
      type: String,
      default: "Africa"
    },

    flagEmoji: {
      type: String,
      default: ""
    },

    dialingCode: {
      type: String,
      default: ""
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

module.exports = mongoose.model("Country", CountrySchema);
