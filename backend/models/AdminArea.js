const mongoose = require("mongoose");

const AdminAreaSchema = new mongoose.Schema(
  {
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: true
    },

    name: {
      type: String,
      required: true
    },

    level: {
      type: String,
      enum: [
        "Region",
        "State",
        "County",
        "District",
        "Constituency",
        "Electoral Area"
      ],
      required: true
    },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminArea",
      default: null
    },

    code: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("AdminArea", AdminAreaSchema);
