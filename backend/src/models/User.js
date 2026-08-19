const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Organization is optional for Super Admin and Country Admin
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      index: true
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

    phone: {
      type: String,
      trim: true
    },

    role: {
      type: String,
      enum: [
        "super_admin",
        "country_admin",
        "party_admin",
        "regional_admin",
        "constituency_officer",
        "electoral_area_coordinator",
        "polling_station_agent",
        "observer"
      ],
      default: "observer"
    },

    // Country is controlled by the authentication/authorization layer
    country: {
      type: String,
      trim: true
    },

    region: {
      type: String,
      trim: true
    },

    constituency: {
      type: String,
      trim: true
    },

    electoralArea: {
      type: String,
      trim: true
    },

    pollingStation: {
      type: String,
      trim: true
    },

    isActive: {
      type: Boolean,
      default: true
    },

    lastLogin: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
