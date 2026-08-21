const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    shortName: {
      type: String,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "political_party",
        "electoral_body",
        "ngo",
        "observer",
      ],
      required: true,
    },

    country: {
      type: String,
      required: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Organization ||
  mongoose.model("Organization", organizationSchema);
