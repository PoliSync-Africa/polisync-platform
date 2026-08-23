const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization"
    },

    firstName: {
      type: String,
      required: true,
      trim: true
    },

    lastName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    phone: String,

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      required: true,
      enum: [
        "super_admin",
        "country_admin",
        "party_admin",
        "regional_admin",
        "constituency_officer",
        "electoral_area_coordinator",
        "polling_station_agent",
        "observer"
      ]
    },

    country: String,
    region: String,
    constituency: String,
    electoralArea: String,
    pollingStation: String,

    isActive: {
      type: Boolean,
      default: true
    },

    lastLogin: Date
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.User ||
  mongoose.model("User", userSchema);
