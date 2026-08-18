const mongoose = require("mongoose");

const CountrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },

    code: {
      type: String,
      required: true,
      uppercase: true
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
